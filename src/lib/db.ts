import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { defaultProducts } from "@/lib/default-products";

const databasePath = resolve(process.env.DATABASE_PATH || "./data/goodkind.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & { goodkindDatabase?: DatabaseSync };
const db = globalDatabase.goodkindDatabase ?? new DatabaseSync(databasePath);
globalDatabase.goodkindDatabase = db;

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
    customer_email TEXT,
    items_json TEXT NOT NULL,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
if (!orderColumns.some((column) => column.name === "customer_email")) {
  db.exec("ALTER TABLE orders ADD COLUMN customer_email TEXT");
}
if (orderColumns.some((column) => column.name === "customer_phone")) {
  db.exec("BEGIN");
  try {
    db.exec(`
      CREATE TABLE orders_email_only (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        items_json TEXT NOT NULL,
        total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO orders_email_only (
        id, customer_name, customer_email, items_json, total_cents, status, created_at, updated_at
      )
      SELECT id, customer_name, customer_email, items_json, total_cents, status, created_at, updated_at
      FROM orders;
      DROP TABLE orders;
      ALTER TABLE orders_email_only RENAME TO orders;
    `);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
db.exec("CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC)");

if (db.prepare("SELECT COUNT(*) AS count FROM products").get()?.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, category, price_cents, note, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  db.exec("BEGIN");
  try {
    for (const product of defaultProducts) {
      insert.run(product.id, product.name, product.category, product.priceCents, product.note, product.image);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getDatabase() {
  return db;
}

export function getPublicProducts() {
  return db.prepare(`
    SELECT id, name, category, price_cents AS priceCents, note, image, available
    FROM products WHERE available = 1 ORDER BY category, name
  `).all();
}

export function getAdminProducts() {
  return db.prepare(`
    SELECT id, name, category, price_cents AS priceCents, note, image, available
    FROM products ORDER BY category, name
  `).all();
}

export function getOrders() {
  const orders = db.prepare(`
    SELECT id, customer_name AS customerName, customer_email AS customerEmail,
      items_json AS itemsJson, total_cents AS totalCents, status, created_at AS createdAt
    FROM orders ORDER BY created_at DESC
  `).all() as Array<{ itemsJson: string; [key: string]: unknown }>;
  return orders.map(({ itemsJson, ...order }) => ({
    ...order,
    items: JSON.parse(itemsJson) as unknown[],
  }));
}

export const categories = new Set(["Coffee", "Not coffee", "Something good"]);
export const orderStatuses = new Set(["new", "accepted", "ready", "completed", "cancelled"]);
