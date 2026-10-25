import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { categories, getAdminProducts, getDatabase } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin, cleanText, errorResponse, HttpError, readJson } from "@/lib/http";

export const runtime = "nodejs";

function validateProduct(body: Record<string, unknown>) {
  const name = cleanText(body.name, "Product name", 100);
  const category = cleanText(body.category, "Category", 40);
  const note = cleanText(body.note, "Description", 240);
  const image = cleanText(body.image, "Image ID", 200);
  if (!categories.has(category)) throw new HttpError(400, "Choose a valid product category.");
  if (!/^photo-[a-zA-Z0-9-]+$/.test(image)) throw new HttpError(400, "Image must be a valid Unsplash photo ID.");
  if (!Number.isInteger(body.priceCents) || (body.priceCents as number) < 0 || (body.priceCents as number) > 100000) {
    throw new HttpError(400, "Price must be between $0.00 and $1,000.00.");
  }
  return { name, category, note, image, priceCents: body.priceCents as number };
}

export function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Sign in to access the admin panel." }, { status: 401 });
  try {
    return NextResponse.json(getAdminProducts());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (!isAdmin(request)) throw new HttpError(401, "Sign in to access the admin panel.");
    const product = validateProduct(await readJson(request));
    const id = `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomBytes(3).toString("hex")}`;
    getDatabase().prepare(`
      INSERT INTO products (id, name, category, price_cents, note, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, product.name, product.category, product.priceCents, product.note, product.image);
    return NextResponse.json({ id, ...product, available: 1 }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
