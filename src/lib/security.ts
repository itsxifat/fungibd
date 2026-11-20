import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { headers } from "next/headers";

const key = () => process.env.AUTH_SECRET || "dev-secret";

/** Short signature used in links sent by email (order view, unsubscribe, reviews, tickets). */
export function sign(value: string) {
  return createHmac("sha256", key()).update(value).digest("base64url").slice(0, 20);
}
export function verifySig(value: string, sig: string | null | undefined) {
  if (!sig) return false;
  const a = Buffer.from(sign(value));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const randomToken = (bytes = 24) => randomBytes(bytes).toString("base64url");

// Simple in-memory rate limiter (good enough for a single office server)
const buckets = new Map<string, { count: number; reset: number }>();
export async function rateLimit(name: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const k = `${name}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  if (buckets.size > 5000) for (const [kk, v] of buckets) if (v.reset < now) buckets.delete(kk);
  return b.count <= limit;
}
