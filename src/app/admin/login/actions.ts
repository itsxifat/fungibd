"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkPassword, endAdminSession, startAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/security";
import { str } from "@/lib/utils";

export async function adminLoginAction(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  if (!(await rateLimit("admin-login", 8, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const email = str(fd, "email").toLowerCase();
  const u = await db.adminUser.findUnique({ where: { email } });
  if (!u || !u.isActive || !(await checkPassword(str(fd, "password"), u.passwordHash))) return { error: "Wrong email or password" };
  await db.adminUser.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
  await startAdminSession(u);
  const next = str(fd, "next");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
