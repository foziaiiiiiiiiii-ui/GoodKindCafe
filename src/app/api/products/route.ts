import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export function GET() {
  try {
    return NextResponse.json(getPublicProducts());
  } catch (error) {
    return errorResponse(error);
  }
}
