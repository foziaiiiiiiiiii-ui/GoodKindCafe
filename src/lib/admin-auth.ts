import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, cleanText, HttpError, readJson } from "@/lib/http";

const cookieName = "goodkind_admin";
const ttlSeconds = 8 * 60 * 60;
const attempts = new Map<string, { count: number; expiresAt: number }>();

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new HttpError(503, "Admin access is not configured. Set a SESSION_SECRET of at least 32 characters.");
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function isAdmin(request: NextRequest) {
  const value = request.cookies.get(cookieName)?.value;
  if (!value) return false;
  const [expiresAt, nonce, signature] = value.split(".");
  if (!expiresAt || !nonce || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;
  const signed = `${expiresAt}.${nonce}`;
  const expected = Buffer.from(sign(signed));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function requireAdmin(request: NextRequest) {
  if (!isAdmin(request)) throw new HttpError(401, "Sign in to access the admin panel.");
}

function passwordMatches(provided: string) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  const expected = createHmac("sha256", secret()).update(configured).digest();
  const actual = createHmac("sha256", secret()).update(provided).digest();
  return timingSafeEqual(expected, actual);
}

export async function login(request: NextRequest) {
  assertSameOrigin(request);
  if (!process.env.ADMIN_PASSWORD) {
    throw new HttpError(503, "Admin login is disabled. Configure ADMIN_PASSWORD and SESSION_SECRET.");
  }
  secret();
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const attempt = attempts.get(key);
  if (attempt && attempt.expiresAt > now && attempt.count >= 8) {
    throw new HttpError(429, "Too many sign-in attempts. Try again in 15 minutes.");
  }
  const body = await readJson(request);
  const password = cleanText(body.password, "Password", 256);
  if (!passwordMatches(password)) {
    const next = !attempt || attempt.expiresAt < now
      ? { count: 1, expiresAt: now + 15 * 60 * 1000 }
      : { ...attempt, count: attempt.count + 1 };
    attempts.set(key, next);
    throw new HttpError(401, "Incorrect admin password.");
  }
  attempts.delete(key);

  const expiresAt = Date.now() + ttlSeconds * 1000;
  const nonce = randomBytes(32).toString("base64url");
  const value = `${expiresAt}.${nonce}.${sign(`${expiresAt}.${nonce}`)}`;
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ttlSeconds,
  });
  return response;
}

export function logout(request: NextRequest) {
  assertSameOrigin(request);
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
