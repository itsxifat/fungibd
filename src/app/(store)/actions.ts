"use server";
import { db } from "@/lib/db";
import { placeOrder, validateCoupon, type CheckoutInput } from "@/lib/orders";
import { getCustomerId, startCustomerSession } from "@/lib/auth";
import { rateLimit, sign, verifySig } from "@/lib/security";
import { isEmail, normalizePhone, str } from "@/lib/utils";
import { adminRecipients, background, buildAdminLead, notifyTicketCreated } from "@/lib/email/notify";
import { sendMail } from "@/lib/email/mailer";
import { getSettings } from "@/lib/settings";

export type FormState = { ok?: boolean; error?: string; message?: string; ref?: string };

// ───────────── Checkout ─────────────
export async function placeOrderAction(input: Omit<CheckoutInput, "source" | "customerId" | "isAdmin" | "by">) {
  if (!(await rateLimit("order", 8, 10 * 60_000))) return { ok: false as const, error: "অনেকবার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন · Too many attempts" };
  const customerId = await getCustomerId();
  const res = await placeOrder({ ...input, source: "WEB", customerId });
  if (!res.ok) return res;
  if (input.password && input.password.length >= 6) await startCustomerSession(res.customerId);
  const nos = res.orders.map((o) => o.orderNo).join(",");
  return { ok: true as const, redirect: `/order/success?o=${nos}&k=${sign(`success:${nos}`)}` };
}

export async function checkCouponAction(code: string, subtotal: number, phone: string) {
  if (!(await rateLimit("coupon", 20, 10 * 60_000))) return { ok: false as const, error: "Too many attempts" };
  const r = await validateCoupon(code, subtotal, normalizePhone(phone));
  if (!r.ok) return { ok: false as const, error: r.error };
  return { ok: true as const, code: r.coupon.code, discount: r.discount, freeDelivery: r.freeDelivery, note: r.coupon.note };
}

// ───────────── Lead capture ─────────────
export async function subscribeHarvestAction(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: true, message: "ধন্যবাদ" }; // honeypot
  if (!(await rateLimit("lead", 6, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const contact = str(fd, "contact");
  const phone = normalizePhone(contact);
  const email = isEmail(contact) ? contact.toLowerCase() : "";
  if (!phone && !email) return { error: "ইমেইল বা মোবাইল নম্বর দিন · Enter email or phone" };
  const interest = str(fd, "interest") || "New harvest alerts";
  const existing = await db.lead.findFirst({ where: email ? { email } : { phone: phone! } });
  if (existing) await db.lead.update({ where: { id: existing.id }, data: { interest: `${existing.interest}; ${interest}`.slice(0, 300) } });
  else
    await db.lead.create({
      data: { name: str(fd, "name") || (email ? email.split("@")[0] : phone!), email, phone: phone ?? "", source: "HARVEST_ALERT", type: "RETAIL", interest, message: "Signed up for harvest alerts on website" },
    });
  return { ok: true, message: "সাবস্ক্রাইব হয়েছে — নতুন হারভেস্ট আর প্রি-অর্ডার খুললে জানিয়ে দেব · You're on the list" };
}

export async function wholesaleAction(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: true };
  if (!(await rateLimit("wholesale", 5, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const name = str(fd, "name");
  const phone = normalizePhone(str(fd, "phone"));
  const email = str(fd, "email").toLowerCase();
  if (name.length < 2) return { error: "নাম লিখুন · Enter your name" };
  if (!phone) return { error: "সঠিক মোবাইল নম্বর দিন · Enter a valid mobile number" };
  if (email && !isEmail(email)) return { error: "সঠিক ইমেইল দিন · Invalid email" };
  const volume = str(fd, "volume");
  const lead = await db.lead.create({
    data: {
      name,
      phone,
      email,
      company: str(fd, "company"),
      type: ["RESTAURANT", "WHOLESALE", "DISTRIBUTOR", "OTHER"].includes(str(fd, "type")) ? str(fd, "type") : "WHOLESALE",
      source: "WHOLESALE_FORM",
      interest: `${str(fd, "products")} · ${volume}`.slice(0, 300),
      message: str(fd, "message").slice(0, 2000),
      estValue: 0,
      nextFollowUp: new Date(Date.now() + 24 * 3600_000),
    },
  });
  const s = await getSettings();
  if (s.email.adminNewLead) {
    const m = buildAdminLead(s, { id: lead.id, name, company: lead.company, phone, email, interest: lead.interest, message: lead.message });
    for (const to of adminRecipients(s)) background(sendMail({ to, subject: m.subject, type: "ADMIN_LEAD", refId: lead.id, replyTo: email || undefined, html: m.html }));
  }
  return { ok: true, message: "ধন্যবাদ! ২৪ ঘণ্টার মধ্যে আমাদের টিম আপনাকে কল করবে। · Thanks — we'll call you within 24 hours." };
}

// ───────────── Support ─────────────
async function nextTicketNo() {
  const c = await db.counter.upsert({ where: { key: "ticket" }, create: { key: "ticket", value: 1001 }, update: { value: { increment: 1 } } });
  return `T${c.value}`;
}

export async function supportAction(_: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "website")) return { ok: true };
  if (!(await rateLimit("support", 5, 10 * 60_000))) return { error: "Too many attempts, try later" };
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const phone = normalizePhone(str(fd, "phone")) ?? "";
  const subject = str(fd, "subject");
  const message = str(fd, "message");
  if (name.length < 2) return { error: "নাম লিখুন · Enter your name" };
  if (!isEmail(email)) return { error: "সঠিক ইমেইল দিন — উত্তর ইমেইলে পাঠানো হবে · Enter a valid email" };
  if (subject.length < 3 || message.length < 5) return { error: "বিষয় ও বার্তা লিখুন · Please add a subject and message" };
  const customerId = (await getCustomerId()) ?? (phone ? (await db.customer.findUnique({ where: { phone } }))?.id : null) ?? null;
  const category = str(fd, "category") || "GENERAL";
  const ticket = await db.ticket.create({
    data: {
      ticketNo: await nextTicketNo(),
      customerId,
      name,
      email,
      phone,
      subject: subject.slice(0, 200),
      category,
      priority: category === "QUALITY" || category === "DELIVERY" ? "HIGH" : "NORMAL",
      orderNo: str(fd, "orderNo").toUpperCase().slice(0, 20),
      messages: { create: { from: "CUSTOMER", authorName: name, body: message.slice(0, 5000) } },
    },
  });
  background(notifyTicketCreated(ticket.id));
  return { ok: true, ref: ticket.ticketNo, message: `টিকেট ${ticket.ticketNo} তৈরি হয়েছে। আমরা শীঘ্রই ইমেইলে উত্তর দেব। · Ticket created — we'll reply by email soon.` };
}

export async function ticketReplyAction(_: FormState, fd: FormData): Promise<FormState> {
  const ticketNo = str(fd, "ticketNo");
  if (!verifySig(`ticket:${ticketNo}`, str(fd, "k"))) return { error: "Invalid link" };
  const body = str(fd, "body");
  if (body.length < 2) return { error: "বার্তা লিখুন · Write a message" };
  const t = await db.ticket.findUnique({ where: { ticketNo } });
  if (!t) return { error: "Ticket not found" };
  await db.ticketMessage.create({ data: { ticketId: t.id, from: "CUSTOMER", authorName: t.name, body: body.slice(0, 5000) } });
  await db.ticket.update({ where: { id: t.id }, data: { status: "OPEN" } });
  return { ok: true, message: "পাঠানো হয়েছে · Sent" };
}

// ───────────── Reviews ─────────────
export async function reviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const orderNo = str(fd, "orderNo");
  if (!verifySig(`review:${orderNo}`, str(fd, "k"))) return { error: "Invalid link" };
  const order = await db.order.findUnique({ where: { orderNo }, include: { items: true, customer: true } });
  if (!order || order.status !== "DELIVERED") return { error: "Order not found" };
  const already = await db.review.count({ where: { orderNo } });
  if (already) return { ok: true, message: "আপনার রিভিউ আগেই পেয়েছি, ধন্যবাদ · Already reviewed — thank you" };
  const productIds = [...new Set(order.items.map((i) => i.productId).filter(Boolean))] as string[];
  let created = 0;
  for (const pid of productIds) {
    const rating = Math.max(1, Math.min(5, Number(str(fd, `rating_${pid}`)) || 0));
    const comment = str(fd, `comment_${pid}`);
    if (!rating) continue;
    await db.review.create({ data: { productId: pid, customerId: order.customerId, orderNo, name: order.name, area: order.zoneName.split(" · ").pop() ?? "", rating, comment: comment.slice(0, 1000), isApproved: false } });
    created++;
  }
  if (!created) return { error: "রেটিং দিন · Please choose a rating" };
  return { ok: true, message: "রিভিউর জন্য অনেক ধন্যবাদ · Thank you for your review" };
}

export async function unsubscribeAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "e").toLowerCase();
  if (!verifySig(`unsub:${email}`, str(fd, "k"))) return { error: "Invalid link" };
  await db.customer.updateMany({ where: { email }, data: { marketingOptIn: false } });
  await db.lead.updateMany({ where: { email, source: "HARVEST_ALERT" }, data: { status: "LOST", lostReason: "Unsubscribed" } });
  return { ok: true, message: "আপনাকে আনসাবস্ক্রাইব করা হয়েছে। অর্ডারের ইমেইল আগের মতোই পাবেন। · You're unsubscribed from offers." };
}
