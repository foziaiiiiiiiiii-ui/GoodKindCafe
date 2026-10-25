import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Sign in to access the admin panel." }, { status: 401 });
  try {
    return NextResponse.json(getOrders());
  } catch (error) {
    return errorResponse(error);
  }
}
