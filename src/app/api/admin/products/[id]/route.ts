import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin, cleanText, errorResponse, HttpError, readJson } from "@/lib/http";

export const runtime = "nodejs";

function validateProduct(body: Record<string, unknown>) {
  const name = cleanText(body.name, "Product name", 100);
  const category = cleanText(body.category, "Category", 40);
  const note = cleanText(body.note, "Description", 240);
  const image = cleanText(body.image, "Image ID", 200);
  if (!["Coffee", "Not coffee", "Something good"].includes(category)) {
    throw new HttpError(400, "Choose a valid product category.");
  }
  if (!/^photo-[a-zA-Z0-9-]+$/.test(image)) throw new HttpError(400, "Image must be a valid Unsplash photo ID.");
  if (!Number.isInteger(body.priceCents) || (body.priceCents as number) < 0 || (body.priceCents as number) > 100000) {
    throw new HttpError(400, "Price must be between $0.00 and $1,000.00.");
  }
  return { name, category, note, image, priceCents: body.priceCents as number };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    if (!isAdmin(request)) throw new HttpError(401, "Sign in to access the admin panel.");
    const { id } = await context.params;
    const product = validateProduct(await readJson(request));
    const result = getDatabase().prepare(`
      UPDATE products SET name = ?, category = ?, price_cents = ?, note = ?, image = ?,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(product.name, product.category, product.priceCents, product.note, product.image, id);
    if (!result.changes) throw new HttpError(404, "Product not found.");
    return NextResponse.json({ id, ...product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    if (!isAdmin(request)) throw new HttpError(401, "Sign in to access the admin panel.");
    const { id } = await context.params;
    const result = getDatabase().prepare(`
      UPDATE products SET available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
    if (!result.changes) throw new HttpError(404, "Product not found.");
    return NextResponse.json({ archived: true });
  } catch (error) {
    return errorResponse(error);
  }
}
