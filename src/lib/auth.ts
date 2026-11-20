import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { AdminRole } from "./constants";

export const ADMIN_COOKIE = "fb_admin";
export const CUSTOMER_COOKIE = "fb_cust";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export async function signToken(payload: Record<string, unknown>, expiresIn = "14d") {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secret());
}
export async function verifyToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);

const cookieOpts = (maxAgeDays: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
  path: "/",
  maxAge: maxAgeDays * 24 * 60 * 60,
});

// ───────────── Admin ─────────────
export type AdminSession = { id: string; name: string; email: string; role: AdminRole };

export async function startAdminSession(user: { id: string; role: string }) {
  const token = await signToken({ sub: user.id, role: user.role, kind: "admin" }, "7d");
  (await cookies()).set(ADMIN_COOKIE, token, cookieOpts(7));
}
export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function getAdmin(): Promise<AdminSession | null> {
  const t = await verifyToken<{ sub: string; kind: string }>((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!t || t.kind !== "admin") return null;
  const u = await db.adminUser.findUnique({ where: { id: t.sub } });
  if (!u || !u.isActive) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role as AdminRole };
}
/** Use at the top of every admin page and server action. */
export async function requireAdmin(roles?: AdminRole[]): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (roles && !roles.includes(a.role)) redirect("/admin?denied=1");
  return a;
}

// ───────────── Customer ─────────────
export async function startCustomerSession(customerId: string) {
  const token = await signToken({ sub: customerId, kind: "customer" }, "60d");
  (await cookies()).set(CUSTOMER_COOKIE, token, cookieOpts(60));
}
export async function endCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
export async function getCustomerId(): Promise<string | null> {
  const t = await verifyToken<{ sub: string; kind: string }>((await cookies()).get(CUSTOMER_COOKIE)?.value);
  return t && t.kind === "customer" ? t.sub : null;
}
export async function getCustomer() {
  const id = await getCustomerId();
  if (!id) return null;
  const c = await db.customer.findUnique({ where: { id } });
  return c && c.hasAccount ? c : null;
}
export async function requireCustomer() {
  const c = await getCustomer();
  if (!c) redirect("/account/login");
  return c;
}
