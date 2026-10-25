import { NextRequest, NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 65_536) throw new HttpError(413, "Request body is too large.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be an object.");
  }
  return body as Record<string, unknown>;
}

export function cleanText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") throw new HttpError(400, `${label} is required.`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new HttpError(400, `${label} must be between 1 and ${maxLength} characters.`);
  }
  return text;
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) throw new HttpError(403, "Request origin could not be verified.");
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new HttpError(403, "Request origin could not be verified.");
  }
  if (url.host !== request.headers.get("host")) {
    throw new HttpError(403, "Cross-origin request rejected.");
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("API request failed:", error);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
