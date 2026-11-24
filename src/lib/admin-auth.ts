import "server-only";
import { db } from "./db";
import { sendMail } from "./email/mailer";
import { layout } from "./email/templates";
import { hashAuthToken, OWNER_SETUP_ID } from "./owner-setup";
import { randomToken } from "./security";
import { getSettings } from "./settings";
import { siteUrl } from "./utils";

export const ADMIN_LOGIN = "/admin/login";
const LINK_LIFETIME_MINUTES = 30;

export function safeAdminNext(next?: string) {
  if (!next?.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u0020]/.test(next)) return "/admin";
  const url = new URL(next, "https://admin.invalid");
  const isPanel = url.pathname === "/admin" || (url.pathname.startsWith("/admin/") && !url.pathname.startsWith(ADMIN_LOGIN));
  return isPanel ? `${url.pathname}${url.search}${url.hash}` : "/admin";
}

export function validAdminPassword(password: string) {
  return password.length >= 12 && Buffer.byteLength(password, "utf8") <= 72;
}

export function validAdminEmail(email: string) {
  return email.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email);
}

export const adminPasswordHint = "Use at least 12 characters and no more than 72 bytes.";

export function setupIsOpen() {
  return db.ownerSetup.findFirst({
    where: { id: OWNER_SETUP_ID, claimedAt: null, tokenHash: { not: null } },
    select: { id: true },
  });
}

export async function sendAdminAuthLink(user: { id: string; email: string }, purpose: "verify" | "reset", passwordHash?: string) {
  const token = randomToken(32);
  const hash = hashAuthToken(token);
  const expires = new Date(Date.now() + LINK_LIFETIME_MINUTES * 60_000);
  const verify = purpose === "verify";
  const { count } = await db.adminUser.updateMany({
    where: { id: user.id, isActive: true, passwordHash, ...(verify ? { emailVerifiedAt: null } : {}) },
    data: verify
      ? { verifyTokenHash: hash, verifyTokenExpiresAt: expires }
      : { resetTokenHash: hash, resetTokenExpiresAt: expires },
  });
  if (!count) return false;

  const settings = await getSettings();
  const label = verify ? "Verify email" : "Reset password";
  const heading = verify ? "Verify your FungiBd admin email" : "Reset your FungiBd admin password";
  const message = `This link expires in ${LINK_LIFETIME_MINUTES} minutes and can be used once. If you did not request it, you can ignore this email.`;
  const url = `${siteUrl()}${ADMIN_LOGIN}/${purpose}#${token}`;
  return sendMail({
    to: user.email,
    subject: heading,
    type: verify ? "ADMIN_EMAIL_VERIFICATION" : "ADMIN_PASSWORD_RESET",
    refId: user.id,
    html: layout(settings, { preheader: heading, heading, body: `<p>${message}</p>`, cta: { label, url } }),
    text: `${heading}\n\n${url}\n\n${message}`,
  });
}
