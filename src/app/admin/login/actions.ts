"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, endAdminSession, getAdmin, hashPassword, startAdminSession } from "@/lib/auth";
import { adminPasswordHint, safeAdminNext, sendAdminAuthLink, validAdminEmail, validAdminPassword } from "@/lib/admin-auth";
import { hashAuthToken, OWNER_SETUP_ID } from "@/lib/owner-setup";
import { rateLimit } from "@/lib/security";
import { str } from "@/lib/utils";

type AuthState = { error?: string; ok?: boolean; message?: string };

export async function adminLoginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!(await rateLimit("admin-login", 8, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const u = await db.adminUser.findUnique({ where: { email } });
  if (!u || !u.isActive || !password || !(await checkPassword(password, u.passwordHash))) return { error: "Wrong email or password." };
  if (!u.emailVerifiedAt) {
    if (!(await sendAdminAuthLink(u, "verify", u.passwordHash))) return { error: "The verification email could not be sent. Try again or contact the site owner." };
    return { ok: true, message: "Check your inbox for a link to verify your email and sign in." };
  }
  const [user] = await db.adminUser.updateManyAndReturn({
    where: { id: u.id, isActive: true, sessionVersion: u.sessionVersion },
    data: { lastLoginAt: new Date() },
    select: { id: true, sessionVersion: true },
  });
  if (!user) return { error: "Sign-in details changed. Try again." };
  await startAdminSession(user);
  redirect(safeAdminNext(str(fd, "next")));
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function adminForgotAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!(await rateLimit("admin-forgot", 5, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const email = str(fd, "email").toLowerCase();
  after(async () => {
    if (!validAdminEmail(email)) return;
    const user = await db.adminUser.findUnique({ where: { email }, select: { id: true, email: true, isActive: true, passwordHash: true } });
    if (user?.isActive) await sendAdminAuthLink(user, "reset", user.passwordHash);
  });
  return { ok: true, message: "If an active admin account uses that email, a reset link will be sent." };
}

export async function adminResetAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!(await rateLimit("admin-reset", 8, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const token = str(fd, "token");
  const password = str(fd, "password");
  if (!validAdminPassword(password)) return { error: adminPasswordHint };
  if (password !== str(fd, "confirmPassword")) return { error: "The passwords must match." };
  if (!/^[\w-]{43}$/.test(token)) return { error: "This reset link is invalid or has expired." };
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const { count } = await db.adminUser.updateMany({
    where: { isActive: true, resetTokenHash: hashAuthToken(token), resetTokenExpiresAt: { gt: now } },
    data: {
      passwordHash, emailVerifiedAt: now, sessionVersion: { increment: 1 },
      resetTokenHash: null, resetTokenExpiresAt: null, verifyTokenHash: null, verifyTokenExpiresAt: null,
    },
  });
  if (!count) return { error: "This reset link is invalid, expired, or already used." };
  await endAdminSession();
  redirect("/admin/login?reset=1");
}

export async function adminVerifyAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!(await rateLimit("admin-verify", 8, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const token = str(fd, "token");
  if (!/^[\w-]{43}$/.test(token)) return { error: "This verification link is invalid or has expired." };
  const now = new Date();
  const [user] = await db.adminUser.updateManyAndReturn({
    where: { isActive: true, emailVerifiedAt: null, verifyTokenHash: hashAuthToken(token), verifyTokenExpiresAt: { gt: now } },
    data: { emailVerifiedAt: now, lastLoginAt: now, verifyTokenHash: null, verifyTokenExpiresAt: null },
    select: { id: true, sessionVersion: true },
  });
  if (!user) return { error: "This verification link is invalid, expired, or already used." };
  await startAdminSession(user);
  redirect("/admin");
}

export async function resendAdminVerificationAction(_: AuthState): Promise<AuthState> {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  if (!(await rateLimit("admin-resend-verification", 5, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!(await sendAdminAuthLink(user, "verify"))) return { error: "The verification email could not be sent. Check the email settings and try again." };
  return { ok: true, message: "Check your inbox for the verification link." };
}

export async function claimOwnerAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!(await rateLimit("admin-setup", 5, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const code = str(fd, "code");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!/^[\w-]{43}$/.test(code)) return { error: "Enter the private setup code from the server." };
  if (name.length < 2 || name.length > 100 || !validAdminEmail(email)) return { error: "Enter your name and an email address you can access." };
  if (!validAdminPassword(password)) return { error: adminPasswordHint };
  if (password !== str(fd, "confirmPassword")) return { error: "The passwords must match." };

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const user = await db.$transaction(async (tx) => {
    const { count } = await tx.ownerSetup.updateMany({
      where: { id: OWNER_SETUP_ID, claimedAt: null, tokenHash: hashAuthToken(code) },
      data: { tokenHash: null, claimedAt: now },
    });
    if (!count) return null;
    return tx.adminUser.create({
      data: { name, email, passwordHash, role: "OWNER", lastLoginAt: now },
      select: { id: true, email: true, sessionVersion: true },
    });
  });
  if (!user) return { error: "The setup code is invalid or owner setup is closed." };
  await startAdminSession(user);
  after(async () => { await sendAdminAuthLink(user, "verify", passwordHash); });
  redirect("/admin");
}
