import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const seedProducts = [
  ["honey-oat-latte", "Honey oat latte", "Coffee", 600, "Double espresso · oat milk · local honey", "photo-1461023058943-07fcbe16d735"],
  ["maple-cloud", "Maple cloud", "Coffee", 650, "Cold brew · maple cream · pinch of sea salt", "photo-1517701604599-bb29b565090c"],
  ["piccolo", "Piccolo", "Coffee", 450, "A little latte with a big personality", "photo-1570968915860-54d5c301fa9f"],
  ["matcha-morning", "Matcha morning", "Not coffee", 600, "Ceremonial matcha · your choice of milk", "photo-1515823064-d6e0c04616a7"],
  ["cardamom-bun", "Cardamom bun", "Something good", 500, "Twisted by hand · baked every morning", "photo-1509365465985-25d11c17e812"],
  ["olive-oil-cake", "Olive oil cake", "Something good", 600, "Citrus, good olive oil, no occasion needed", "photo-1578985545062-69928b1d9587"],
] as const;

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
    customer_phone TEXT NOT NULL,
    items_json TEXT NOT NULL,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
`);

if (db.prepare("SELECT COUNT(*) AS count FROM products").get()?.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, category, price_cents, note, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  db.exec("BEGIN");
  try {
    for (const product of seedProducts) insert.run(...product);
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
    SELECT id, customer_name AS customerName, customer_phone AS customerPhone,
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
