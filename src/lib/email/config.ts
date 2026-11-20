import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { db } from "../db";

/** SMTP settings entered in Admin → Settings → Email (password stored encrypted). Falls back to .env. */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  source: "admin" | "env";
};

const KEY = "smtp";
const key = () => createHash("sha256").update(`fungibd-smtp:${process.env.AUTH_SECRET || "dev-secret"}`).digest();

export function encrypt(text: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(s: string) {
  try {
    const [iv, tag, enc] = s.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

type Stored = { host: string; port: number; secure: boolean; user: string; passEnc: string; fromName: string; fromEmail: string; replyTo: string };

async function stored(): Promise<Stored | null> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as Stored;
  } catch {
    return null;
  }
}

function parseFrom(v: string) {
  const m = v.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: "", email: v.trim() };
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const s = await stored();
  if (s?.host) return { host: s.host, port: s.port, secure: s.secure, user: s.user, pass: s.passEnc ? decrypt(s.passEnc) : "", fromName: s.fromName, fromEmail: s.fromEmail, replyTo: s.replyTo, source: "admin" };
  if (process.env.SMTP_HOST) {
    const from = parseFrom(process.env.MAIL_FROM || "FungiBd <no-reply@fungibd.com>");
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      fromName: from.name || "FungiBd",
      fromEmail: from.email,
      replyTo: "",
      source: "env",
    };
  }
  return null;
}

/** Safe view for the admin form (never returns the password). */
export async function getSmtpPublic() {
  const c = await getSmtpConfig();
  if (!c) return null;
  return { host: c.host, port: c.port, secure: c.secure, user: c.user, hasPassword: Boolean(c.pass), fromName: c.fromName, fromEmail: c.fromEmail, replyTo: c.replyTo, source: c.source };
}

export async function saveSmtpConfig(input: { host: string; port: number; secure: boolean; user: string; pass: string | null; fromName: string; fromEmail: string; replyTo: string }) {
  const prev = await stored();
  const value: Stored = {
    host: input.host,
    port: input.port,
    secure: input.secure,
    user: input.user,
    passEnc: input.pass === null ? (prev?.passEnc ?? "") : input.pass ? encrypt(input.pass) : "",
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    replyTo: input.replyTo,
  };
  await db.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
}

export async function clearSmtpConfig() {
  await db.setting.deleteMany({ where: { key: KEY } });
}
