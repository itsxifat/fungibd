"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { adminPasswordHint, validAdminEmail, validAdminPassword } from "@/lib/admin-auth";
import { isHex, saveSettings } from "@/lib/settings";
import { sendMail, verifySmtp } from "@/lib/email/mailer";
import { clearSmtpConfig, saveSmtpConfig } from "@/lib/email/config";
import { layout } from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";
import { boolField, numField, str } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";

const done = (): ActionState => {
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
};

export async function saveStoreAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  await saveSettings("store", {
    name: str(fd, "name") || "FungiBd",
    taglineBn: str(fd, "taglineBn"),
    taglineEn: str(fd, "taglineEn"),
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp"),
    email: str(fd, "email"),
    address: str(fd, "address"),
    farmAddress: str(fd, "farmAddress"),
    hours: str(fd, "hours"),
    facebook: str(fd, "facebook"),
    instagram: str(fd, "instagram"),
    youtube: str(fd, "youtube"),
  });
  return done();
}

export async function saveBrandAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  const colors = ["primary", "accent", "background", "ink"] as const;
  for (const c of colors) if (str(fd, c) && !isHex(str(fd, c))) return { error: `${c} must be a colour like #02604A` };
  await saveSettings("brand", {
    logoUrl: str(fd, "logoUrl") || "/brand/wordmark-green.svg",
    logoDarkUrl: str(fd, "logoDarkUrl") || "/brand/wordmark-cream.svg",
    emailLogoUrl: str(fd, "emailLogoUrl") || "/brand/email-logo.png",
    primary: str(fd, "primary") || "#02604A",
    accent: str(fd, "accent") || "#D3BFA4",
    background: str(fd, "background") || "#F4EDDB",
    ink: str(fd, "ink") || "#16251F",
  });
  return done();
}

export async function saveDeliveryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  await saveSettings("delivery", {
    centerLat: numField(fd, "centerLat", 23.7808),
    centerLng: numField(fd, "centerLng", 90.4093),
    radiusKm: numField(fd, "radiusKm", 16),
    freeDeliveryMin: numField(fd, "freeDeliveryMin", 0),
    minOrder: numField(fd, "minOrder", 0),
    sameDayCutoffHour: Math.min(23, Math.max(0, Math.round(numField(fd, "sameDayCutoffHour", 12)))),
    daysAhead: Math.min(30, Math.max(1, Math.round(numField(fd, "daysAhead", 6)))),
    slots: str(fd, "slots")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  return done();
}

export async function saveHomeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  await saveSettings("home", {
    announcement: str(fd, "announcement"),
    heroTitleBn: str(fd, "heroTitleBn"),
    heroTitleEn: str(fd, "heroTitleEn"),
    heroSubBn: str(fd, "heroSubBn"),
    heroImage: str(fd, "heroImage"),
    benefitsVideoUrl: str(fd, "benefitsVideoUrl"),
  });
  return done();
}

export async function saveEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  const list = str(fd, "notifyAdminEmail")
    .split(/[s,;]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const bad = list.filter((x) => !/^[^s@]+@[^s@]+.[^s@]+$/.test(x));
  if (bad.length) return { error: `Not a valid email: ${bad.join(", ")}` };
  await saveSettings("email", {
    notifyAdminEmail: list.join(", "),
    sendCustomerEmails: boolField(fd, "sendCustomerEmails"),
    onPlaced: boolField(fd, "onPlaced"),
    onConfirmed: boolField(fd, "onConfirmed"),
    onOutForDelivery: boolField(fd, "onOutForDelivery"),
    onDelivered: boolField(fd, "onDelivered"),
    onCancelled: boolField(fd, "onCancelled"),
    adminNewOrder: boolField(fd, "adminNewOrder"),
    adminNewTicket: boolField(fd, "adminNewTicket"),
    adminNewLead: boolField(fd, "adminNewLead"),
  });
  return done();
}

export async function saveSmtpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  const host = str(fd, "host");
  const fromEmail = str(fd, "fromEmail").toLowerCase();
  if (!host) return { error: "Enter the SMTP server (host)" };
  if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(fromEmail)) return { error: "Enter a valid “send from” email address" };
  const security = str(fd, "security");
  const pass = str(fd, "pass");
  await saveSmtpConfig({
    host,
    port: Math.round(numField(fd, "port", security === "ssl" ? 465 : 587)),
    secure: security === "ssl",
    user: str(fd, "user"),
    pass: pass ? pass : boolField(fd, "clearPass") ? "" : null,
    fromName: str(fd, "fromName") || "FungiBd",
    fromEmail,
    replyTo: str(fd, "replyTo"),
  });
  const v = await verifySmtp();
  revalidatePath("/admin/settings");
  return v.ok ? { ok: true, message: "Saved — connected to the email server successfully ✓" } : { ok: true, message: `Saved, but connection failed: ${v.error}` };
}

export async function clearSmtpAction(_: ActionState): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  await clearSmtpConfig();
  revalidatePath("/admin/settings");
  return { ok: true, message: "Email server settings removed" };
}

export async function saveCrmAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER"]);
  const atRiskDays = Math.max(7, Math.round(numField(fd, "atRiskDays", 30)));
  const lostDays = Math.max(atRiskDays + 1, Math.round(numField(fd, "lostDays", 60)));
  await saveSettings("crm", { atRiskDays, lostDays, loyalOrders: Math.max(2, Math.round(numField(fd, "loyalOrders", 5))) });
  return done();
}

export async function testEmailAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin(["OWNER"]);
  const v = await verifySmtp();
  if (!v.ok) return { error: `SMTP connection failed: ${v.error}` };
  const to = str(fd, "to") || a.email;
  const s = await getSettings();
  const ok = await sendMail({ to, subject: "FungiBd test email ✅", type: "TEST", html: layout(s, { preheader: "Your email setup works", heading: "ইমেইল সেটআপ সফল!", subheading: "Your FungiBd email setup works", body: "<p>Order confirmations and updates will be sent like this.</p>" }) });
  return ok ? { ok: true, message: `Test email sent to ${to}` } : { error: "Connected, but sending failed — see Email log below." };
}

export async function userAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin(["OWNER"]);
  const id = str(fd, "id");
  const role = ["OWNER", "MANAGER", "STAFF"].includes(str(fd, "role")) ? str(fd, "role") : "STAFF";
  const password = str(fd, "password");
  if (password && !validAdminPassword(password)) return { error: adminPasswordHint };
  if (id) {
    const isActive = boolField(fd, "isActive");
    if (id === me.id && (role !== "OWNER" || !isActive)) return { error: "You can't remove your own owner access." };
    await db.adminUser.update({
      where: { id },
      data: {
        name: str(fd, "name"), role, isActive,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
        ...(password || !isActive ? {
          sessionVersion: { increment: 1 }, verifyTokenHash: null, verifyTokenExpiresAt: null, resetTokenHash: null, resetTokenExpiresAt: null,
        } : {}),
      },
    });
  } else {
    const email = str(fd, "email").toLowerCase();
    if (!validAdminEmail(email) || !password) return { error: "A valid email and password are required." };
    if (await db.adminUser.findUnique({ where: { email } })) return { error: "A user with this email already exists" };
    await db.adminUser.create({ data: { name: str(fd, "name") || email, email, role, passwordHash: await hashPassword(password) } });
  }
  revalidatePath("/admin/settings");
  return { ok: true, message: password && id ? "Saved (password changed)" : "Saved" };
}
