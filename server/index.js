import { createServer } from "node:http";
import { createReadStream, mkdirSync, statSync } from "node:fs";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { extname, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createServer as createViteServer } from "vite";

const root = process.cwd();
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5173);
const databasePath = resolve(process.env.DATABASE_PATH || "data/goodkind.sqlite");
const sessionTtlMs = 8 * 60 * 60 * 1000;
const sessions = new Map();
const loginAttempts = new Map();
const productCategories = new Set(["Coffee", "Not coffee", "Something good"]);
const orderStatuses = new Set(["new", "accepted", "ready", "completed", "cancelled"]);

mkdirSync(resolve(databasePath, ".."), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    note TEXT NOT NULL,
    image TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
`);

const seedProducts = [
  ["honey-oat-latte", "Honey oat latte", "Coffee", 600, "Double espresso · oat milk · local honey", "photo-1461023058943-07fcbe16d735"],
  ["maple-cloud", "Maple cloud", "Coffee", 650, "Cold brew · maple cream · pinch of sea salt", "photo-1517701604599-bb29b565090c"],
  ["piccolo", "Piccolo", "Coffee", 450, "A little latte with a big personality", "photo-1570968915860-54d5c301fa9f"],
  ["matcha-morning", "Matcha morning", "Not coffee", 600, "Ceremonial matcha · your choice of milk", "photo-1515823064-d6e0c04616a7"],
  ["cardamom-bun", "Cardamom bun", "Something good", 500, "Twisted by hand · baked every morning", "photo-1509365465985-25d11c17e812"],
  ["olive-oil-cake", "Olive oil cake", "Something good", 600, "Citrus, good olive oil, no occasion needed", "photo-1578985545062-69928b1d9587"],
];
if (db.prepare("SELECT COUNT(*) AS count FROM products").get().count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, category, price_cents, note, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const seed = db.transaction((products) => products.forEach((product) => insert.run(...product)));
  seed(seedProducts);
}

const selectProducts = db.prepare(`
  SELECT id, name, category, price_cents AS priceCents, note, image, available
  FROM products WHERE available = 1 ORDER BY category, name
`);
const selectAllProducts = db.prepare(`
  SELECT id, name, category, price_cents AS priceCents, note, image, available
  FROM products ORDER BY category, name
`);

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 65536) throw httpError(413, "Request body is too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Request body must be valid JSON.");
  }
}

function cleanText(value, label, maxLength) {
  if (typeof value !== "string") throw httpError(400, `${label} is required.`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw httpError(400, `${label} must be between 1 and ${maxLength} characters.`);
  }
  return text;
}

function ensureSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) throw httpError(403, "Request origin could not be verified.");
  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw httpError(403, "Request origin could not be verified.");
  }
  if (originUrl.host !== host) throw httpError(403, "Cross-origin request rejected.");
}

function cookieValue(request, name) {
  const cookies = request.headers.cookie || "";
  for (const item of cookies.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

function authenticated(request) {
  const token = cookieValue(request, "goodkind_admin");
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  sessions.set(token, Date.now() + sessionTtlMs);
  return true;
}

function requireAdmin(request) {
  if (!authenticated(request)) throw httpError(401, "Sign in to access the admin panel.");
}

function passwordMatches(provided) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  const expected = createHash("sha256").update(configured).digest();
  const actual = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expected, actual);
}

function adminCookie(token, maxAge) {
  const secure = isProduction ? "; Secure" : "";
  return `goodkind_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function productPayload(body) {
  const name = cleanText(body.name, "Product name", 100);
  const category = cleanText(body.category, "Category", 40);
  const note = cleanText(body.note, "Description", 240);
  const image = cleanText(body.image, "Image ID", 200);
  if (!productCategories.has(category)) throw httpError(400, "Choose a valid product category.");
  if (!/^photo-[a-zA-Z0-9-]+$/.test(image)) throw httpError(400, "Image must be a valid Unsplash photo ID.");
  if (!Number.isInteger(body.priceCents) || body.priceCents < 0 || body.priceCents > 100000) {
    throw httpError(400, "Price must be between $0.00 and $1,000.00.");
  }
  return { name, category, note, image, priceCents: body.priceCents };
}

function listOrders() {
  const rows = db.prepare(`
    SELECT id, customer_name AS customerName, customer_phone AS customerPhone,
      items_json AS itemsJson, total_cents AS totalCents, status, created_at AS createdAt
    FROM orders ORDER BY created_at DESC
  `).all();
  return rows.map(({ itemsJson, ...order }) => ({
    ...order,
    items: JSON.parse(itemsJson),
  }));
}

async function handleApi(request, response, url) {
  const { pathname } = url;
  const method = request.method || "GET";

  if (pathname === "/api/health" && method === "GET") {
    return sendJson(response, 200, { status: "ok" });
  }
  if (pathname === "/api/products" && method === "GET") {
    return sendJson(response, 200, selectProducts.all());
  }
  if (pathname === "/api/orders" && method === "POST") {
    ensureSameOrigin(request);
    const body = await readJson(request);
    const customerName = cleanText(body.customerName, "Name", 100);
    const customerPhone = cleanText(body.customerPhone, "Phone number", 40);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 40) {
      throw httpError(400, "Add at least one product to your order.");
    }

    const getProduct = db.prepare("SELECT id, name, price_cents AS priceCents FROM products WHERE id = ? AND available = 1");
    const orderItems = body.items.map((item) => {
      if (!item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 30) {
        throw httpError(400, "Order item is invalid.");
      }
      const product = getProduct.get(item.productId);
      if (!product) throw httpError(400, "A selected product is no longer available.");
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
      };
    });
    const totalCents = orderItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    const id = randomUUID();
    db.prepare(`
      INSERT INTO orders (id, customer_name, customer_phone, items_json, total_cents)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, customerName, customerPhone, JSON.stringify(orderItems), totalCents);
    return sendJson(response, 201, { id, status: "new", totalCents });
  }

  if (pathname === "/api/admin/session" && method === "GET") {
    return sendJson(response, 200, { authenticated: authenticated(request) });
  }
  if (pathname === "/api/admin/login" && method === "POST") {
    ensureSameOrigin(request);
    if (!process.env.ADMIN_PASSWORD) {
      throw httpError(503, "Admin access is not configured. Set ADMIN_PASSWORD and restart the server.");
    }
    const ip = request.socket.remoteAddress || "unknown";
    const attempt = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
    if (attempt.resetAt < Date.now()) {
      attempt.count = 0;
      attempt.resetAt = Date.now() + 15 * 60 * 1000;
    }
    if (attempt.count >= 8) throw httpError(429, "Too many sign-in attempts. Try again in 15 minutes.");
    const body = await readJson(request);
    const password = typeof body.password === "string" ? body.password : "";
    if (!passwordMatches(password)) {
      attempt.count += 1;
      loginAttempts.set(ip, attempt);
      throw httpError(401, "Incorrect admin password.");
    }
    loginAttempts.delete(ip);
    const token = randomBytes(32).toString("base64url");
    sessions.set(token, Date.now() + sessionTtlMs);
    return sendJson(response, 200, { authenticated: true }, {
      "Set-Cookie": adminCookie(token, sessionTtlMs / 1000),
    });
  }
  if (pathname === "/api/admin/logout" && method === "POST") {
    ensureSameOrigin(request);
    const token = cookieValue(request, "goodkind_admin");
    sessions.delete(token);
    return sendJson(response, 200, { authenticated: false }, {
      "Set-Cookie": adminCookie("", 0),
    });
  }

  if (pathname.startsWith("/api/admin/")) {
    requireAdmin(request);
    if (method !== "GET") ensureSameOrigin(request);

    if (pathname === "/api/admin/products" && method === "GET") {
      return sendJson(response, 200, selectAllProducts.all());
    }
    if (pathname === "/api/admin/products" && method === "POST") {
      const product = productPayload(await readJson(request));
      const id = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;
      db.prepare(`
        INSERT INTO products (id, name, category, price_cents, note, image)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, product.name, product.category, product.priceCents, product.note, product.image);
      return sendJson(response, 201, { id, ...product, available: 1 });
    }
    const productMatch = pathname.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
    if (productMatch && method === "PATCH") {
      const product = productPayload(await readJson(request));
      const result = db.prepare(`
        UPDATE products SET name = ?, category = ?, price_cents = ?, note = ?, image = ?,
          updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(product.name, product.category, product.priceCents, product.note, product.image, productMatch[1]);
      if (!result.changes) throw httpError(404, "Product not found.");
      return sendJson(response, 200, { id: productMatch[1], ...product });
    }
    if (productMatch && method === "DELETE") {
      const result = db.prepare("UPDATE products SET available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(productMatch[1]);
      if (!result.changes) throw httpError(404, "Product not found.");
      return sendJson(response, 200, { archived: true });
    }
    if (pathname === "/api/admin/orders" && method === "GET") {
      return sendJson(response, 200, listOrders());
    }
    const orderMatch = pathname.match(/^\/api\/admin\/orders\/([a-f0-9-]+)$/);
    if (orderMatch && method === "PATCH") {
      const body = await readJson(request);
      if (!orderStatuses.has(body.status)) throw httpError(400, "Choose a valid order status.");
      const result = db.prepare(`
        UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(body.status, orderMatch[1]);
      if (!result.changes) throw httpError(404, "Order not found.");
      return sendJson(response, 200, { id: orderMatch[1], status: body.status });
    }
  }

  throw httpError(404, "API endpoint not found.");
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function serveProductionFile(request, response) {
  const dist = resolve(root, "dist");
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = resolve(dist, `.${requestPath}`);
  const safePath = requested === dist || requested.startsWith(`${dist}${sep}`);
  let filePath = safePath ? requested : resolve(dist, "index.html");
  try {
    if (!statSync(filePath).isFile()) filePath = resolve(dist, "index.html");
  } catch {
    filePath = resolve(dist, "index.html");
  }
  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(filePath).pipe(response);
}

const vite = isProduction
  ? null
  : await createViteServer({
      configFile: resolve(root, "vite.config.js"),
      server: { middlewareMode: true },
      appType: "spa",
    });

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    try {
      await handleApi(request, response, url);
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      if (status === 500) console.error("API request failed:", error);
      if (!response.headersSent) {
        sendJson(response, status, { error: status === 500 ? "Internal server error." : error.message });
      } else {
        response.destroy();
      }
    }
    return;
  }
  if (vite) {
    vite.middlewares(request, response, (error) => {
      if (error) {
        console.error("Vite request failed:", error);
        response.statusCode = 500;
        response.end("Internal server error.");
      } else {
        response.statusCode = 404;
        response.end("Not found");
      }
    });
    return;
  }
  serveProductionFile(request, response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Goodkind café app listening on http://localhost:${port}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("Admin login is disabled until ADMIN_PASSWORD is configured.");
  }
});

function shutdown() {
  server.close(() => {
    vite?.close();
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
