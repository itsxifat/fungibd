import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "../db";
import { getSmtpConfig, type SmtpConfig } from "./config";

let cached: { sig: string; t: Transporter; cfg: SmtpConfig } | null = null;

async function getTransport(): Promise<{ t: Transporter; cfg: SmtpConfig } | null> {
  const cfg = await getSmtpConfig();
  if (!cfg) return null;
  const sig = JSON.stringify(cfg);
  if (cached?.sig === sig) return cached;
  const t = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 15000,
  });
  cached = { sig, t, cfg };
  return cached;
}

export const emailConfigured = async () => Boolean(await getSmtpConfig());

export type MailInput = { to: string; subject: string; html: string; text?: string; type: string; refId?: string; replyTo?: string };

/** Sends an email and records it in the Email Log. Never throws. */
export async function sendMail(m: MailInput): Promise<boolean> {
  if (!m.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.to)) return false;
  const tr = await getTransport();
  if (!tr) {
    await db.emailLog.create({ data: { to: m.to, subject: m.subject, type: m.type, status: "SKIPPED", error: "Email server not set up", refId: m.refId ?? "" } }).catch(() => {});
    return false;
  }
  try {
    await tr.t.sendMail({
      from: tr.cfg.fromName ? { name: tr.cfg.fromName, address: tr.cfg.fromEmail } : tr.cfg.fromEmail,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text ?? htmlToText(m.html),
      replyTo: m.replyTo || tr.cfg.replyTo || undefined,
    });
    await db.emailLog.create({ data: { to: m.to, subject: m.subject, type: m.type, status: "SENT", refId: m.refId ?? "" } }).catch(() => {});
    return true;
  } catch (e) {
    await db.emailLog
      .create({ data: { to: m.to, subject: m.subject, type: m.type, status: "FAILED", error: String((e as Error).message).slice(0, 500), refId: m.refId ?? "" } })
      .catch(() => {});
    return false;
  }
}

export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  cached = null;
  const tr = await getTransport();
  if (!tr) return { ok: false, error: "The email server is not set up yet" };
  try {
    await tr.t.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
