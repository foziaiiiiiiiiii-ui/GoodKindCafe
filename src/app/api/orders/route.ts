import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, cleanText, errorResponse, HttpError, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await readJson(request);
    const customerName = cleanText(body.customerName, "Name", 100);
    const customerPhone = cleanText(body.customerPhone, "Phone number", 40);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 40) {
      throw new HttpError(400, "Add at least one product to your order.");
    }

    const db = getDatabase();
    const selectProduct = db.prepare(`
      SELECT id, name, price_cents AS priceCents FROM products WHERE id = ? AND available = 1
    `);
    const items = body.items.map((item) => {
      if (!item || typeof item !== "object") throw new HttpError(400, "Order item is invalid.");
      const candidate = item as { productId?: unknown; quantity?: unknown };
      if (typeof candidate.productId !== "string" || !Number.isInteger(candidate.quantity)
        || (candidate.quantity as number) < 1 || (candidate.quantity as number) > 30) {
        throw new HttpError(400, "Order item is invalid.");
      }
      const product = selectProduct.get(candidate.productId) as
        | { id: string; name: string; priceCents: number }
        | undefined;
      if (!product) throw new HttpError(400, "A selected product is no longer available.");
      return {
        productId: product.id,
        name: product.name,
        quantity: candidate.quantity as number,
        unitPriceCents: product.priceCents,
      };
    });
    const totalCents = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
    const id = randomUUID();
    db.prepare(`
      INSERT INTO orders (id, customer_name, customer_phone, items_json, total_cents)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, customerName, customerPhone, JSON.stringify(items), totalCents);

    return NextResponse.json({ id, status: "new", totalCents }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
