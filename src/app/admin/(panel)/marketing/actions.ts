"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { segmentWhere } from "@/lib/crm";
import { sendMail } from "@/lib/email/mailer";
import { background, campaignHtml } from "@/lib/email/notify";
import { parseLocalDateTime } from "@/lib/dates";
import { boolField, numField, optNum, str } from "@/lib/utils";
import { SEGMENTS, type Segment } from "@/lib/constants";
import type { ActionState } from "@/components/admin/client";

export async function campaignRecipients(segment: string) {
  const s = await getSettings();
  if (segment === "LEADS" || segment === "HARVEST_ALERT") {
    const leads = await db.lead.findMany({ where: { email: { not: "" }, status: { not: "LOST" }, ...(segment === "HARVEST_ALERT" ? { source: "HARVEST_ALERT" } : {}) }, select: { email: true, name: true } });
    return dedupe(leads.map((l) => ({ email: l.email, name: l.name })));
  }
  const where = segment in SEGMENTS ? segmentWhere(segment as Segment, s.crm) : {};
  const cs = await db.customer.findMany({ where: { ...where, marketingOptIn: true, email: { not: null } }, select: { email: true, name: true } });
  return dedupe(cs.map((c) => ({ email: c.email!, name: c.name })));
}
function dedupe(list: { email: string; name: string }[]) {
  const seen = new Set<string>();
  return list.filter((x) => x.email && !seen.has(x.email.toLowerCase()) && seen.add(x.email.toLowerCase()));
}

export async function campaignAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const data = { name: str(fd, "name") || str(fd, "subject"), subject: str(fd, "subject"), body: str(fd, "body"), segment: str(fd, "segment") || "ALL" };
  if (!data.subject || !data.body) return { error: "Subject and message are required" };
  const camp = id ? await db.campaign.update({ where: { id }, data }) : await db.campaign.create({ data });
  const mode = str(fd, "mode");
  const s = await getSettings();
  if (mode === "test") {
    const admin = await db.adminUser.findUnique({ where: { id: a.id } });
    const ok = await sendMail({ to: admin!.email, subject: `[TEST] ${camp.subject}`, html: campaignHtml(s, camp.subject, camp.body, admin!.email, a.name), type: "CAMPAIGN_TEST", refId: camp.id });
    revalidatePath("/admin/marketing");
    return ok ? { ok: true, message: `Test sent to ${admin!.email}` } : { error: "Test email not sent — check SMTP settings (Settings → Email)." };
  }
  if (mode === "send") {
    if (camp.status === "SENT") return { error: "This campaign was already sent. Create a new one." };
    const list = await campaignRecipients(camp.segment);
    if (!list.length) return { error: "No recipients with an email address in this segment." };
    await db.campaign.update({ where: { id: camp.id }, data: { status: "SENT", sentAt: new Date(), sentCount: list.length } });
    background(
      (async () => {
        for (const r of list) {
          await sendMail({ to: r.email, subject: camp.subject, html: campaignHtml(s, camp.subject, camp.body, r.email, r.name), type: "CAMPAIGN", refId: camp.id });
          await new Promise((res) => setTimeout(res, 400)); // gentle pace for SMTP limits
        }
      })(),
    );
    revalidatePath("/admin/marketing");
    return { ok: true, message: `Sending to ${list.length} people in the background` };
  }
  revalidatePath("/admin/marketing");
  return { ok: true, message: "Draft saved" };
}

export async function couponAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Code is required" };
  const clash = await db.coupon.findFirst({ where: { code, NOT: id ? { id } : undefined } });
  if (clash) return { error: "That code already exists" };
  const data = {
    code,
    type: ["PERCENT", "FIXED", "FREE_DELIVERY"].includes(str(fd, "type")) ? str(fd, "type") : "PERCENT",
    value: numField(fd, "value", 0),
    minOrder: numField(fd, "minOrder", 0),
    maxDiscount: optNum(fd, "maxDiscount"),
    usageLimit: optNum(fd, "usageLimit"),
    perCustomer: Math.max(0, Math.round(numField(fd, "perCustomer", 1))),
    startsAt: parseLocalDateTime(str(fd, "startsAt")),
    expiresAt: parseLocalDateTime(str(fd, "expiresAt")),
    isActive: id ? boolField(fd, "isActive") : true,
    note: str(fd, "note"),
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  revalidatePath("/admin/marketing");
  return { ok: true, message: "Coupon saved" };
}

export async function reviewModerateAction(fd: FormData) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (op === "delete") await db.review.delete({ where: { id } });
  else await db.review.update({ where: { id }, data: { isApproved: op === "approve" } });
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}
