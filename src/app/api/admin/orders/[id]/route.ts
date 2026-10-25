import { NextRequest, NextResponse } from "next/server";
import { getDatabase, orderStatuses } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { assertSameOrigin, errorResponse, HttpError, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    if (!isAdmin(request)) throw new HttpError(401, "Sign in to access the admin panel.");
    const { id } = await context.params;
    const body = await readJson(request);
    if (typeof body.status !== "string" || !orderStatuses.has(body.status)) {
      throw new HttpError(400, "Choose a valid order status.");
    }
    const result = getDatabase().prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(body.status, id);
    if (!result.changes) throw new HttpError(404, "Order not found.");
    return NextResponse.json({ id, status: body.status });
  } catch (error) {
    return errorResponse(error);
  }
}
