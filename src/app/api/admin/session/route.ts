import { NextRequest, NextResponse } from "next/server";
import { isAdmin, login, logout } from "@/lib/admin-auth";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdmin(request) });
}

export async function POST(request: NextRequest) {
  try {
    return await login(request);
  } catch (error) {
    return errorResponse(error);
  }
}

export function DELETE(request: NextRequest) {
  try {
    return logout(request);
  } catch (error) {
    return errorResponse(error);
  }
}
