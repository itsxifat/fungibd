import "server-only";
import { db } from "../db";
import { getSettings } from "../settings";
import { sendMail } from "./mailer";
import { layout, itemsTable, deliveryBox, esc, paragraphs } from "./templates";
import { siteUrl, taka } from "../utils";
import { fmtDateBn } from "../dates";
import { sign } from "../security";
import { ORDER_STATUS, type OrderStatus } from "../constants";

const trackUrl = (orderNo: string, phone: string) => `${siteUrl()}/track?order=${orderNo}&phone=${phone}`;
export const reviewUrl = (orderNo: string) => `${siteUrl()}/review?order=${orderNo}&k=${sign(`review:${orderNo}`)}`;
export const unsubscribeUrl = (email: string) => `${siteUrl()}/unsubscribe?e=${encodeURIComponent(email)}&k=${sign(`unsub:${email}`)}`;
export const ticketUrl = (ticketNo: string) => `${siteUrl()}/support/ticket/${ticketNo}?k=${sign(`ticket:${ticketNo}`)}`;

async function loadOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: true, rider: true } });
}

/** Everyone who should receive admin alerts (Settings → Email). */
export function adminRecipients(s: Awaited<ReturnType<typeof getSettings>>) {
  return [...new Set((s.email.notifyAdminEmail || s.store.email).split(/[s,;]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^s@]+@[^s@]+.[^s@]+$/.test(x)))];
}

/** Run in the background so the customer never waits for SMTP. */
export function background(p: Promise<unknown>) {
  p.catch((e) => console.error("[notify]", e));
}

export async function notifyOrderPlaced(orderId: string) {
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o) return;
  const pre = o.type === "PREORDER";

  if (o.email && s.email.sendCustomerEmails && s.email.onPlaced) {
    const body = `<p style="margin:0 0 12px">প্রিয় ${esc(o.name)},</p>
<p style="margin:0 0 12px">${
      pre
        ? `আপনার <strong>প্রি-অর্ডার</strong> বুক হয়েছে। হারভেস্টের দিন আমরা তাজা মাশরুম তুলে আপনার কাছে পৌঁছে দেব। <span style="color:#7a776c">Your pre-order is booked — we'll harvest and deliver on the scheduled day.</span>`
        : `FungiBd থেকে অর্ডার করার জন্য ধন্যবাদ! আমাদের টিম শীঘ্রই কল করে অর্ডারটি নিশ্চিত করবে। <span style="color:#7a776c">Thanks for your order — we'll call you shortly to confirm.</span>`
    }</p>
<p style="margin:0 0 4px;font-size:13px;color:#7a776c">অর্ডার নম্বর · Order no.</p>
<p style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:1px">${o.orderNo}</p>
${itemsTable(o, s)}
${deliveryBox(o, s)}
<p style="margin:10px 0 0;font-size:14px">💵 পেমেন্ট: <strong>ক্যাশ অন ডেলিভারি</strong> — মাশরুম হাতে পেয়ে টাকা দিন।</p>`;
    await sendMail({
      to: o.email,
      subject: pre ? `প্রি-অর্ডার বুক হয়েছে · Pre-order ${o.orderNo} received` : `অর্ডার পেয়েছি · Order ${o.orderNo} received`,
      type: pre ? "PREORDER_PLACED" : "ORDER_PLACED",
      refId: o.id,
      html: layout(s, {
        preheader: `Order ${o.orderNo} · ${taka(o.total)} · Cash on Delivery`,
        heading: pre ? "আপনার প্রি-অর্ডার বুক হয়েছে 🍄" : "আপনার অর্ডারটি আমরা পেয়েছি 🍄",
        subheading: pre ? "Your pre-order is confirmed in our harvest plan" : "We've received your order",
        body,
        cta: { label: "অর্ডার ট্র্যাক করুন · Track order", url: trackUrl(o.orderNo, o.phone) },
      }),
    });
  }
}

export async function notifyAdminNewOrders(orderIds: string[]) {
  const s = await getSettings();
  const recipients = adminRecipients(s);
  if (!s.email.adminNewOrder || !recipients.length) return;
  const orders = await db.order.findMany({ where: { id: { in: orderIds } }, include: { items: true } });
  if (!orders.length) return;
  const body = orders
    .map(
      (o) => `<p style="margin:0 0 6px"><strong>${o.orderNo}</strong> · ${o.type === "PREORDER" ? "PRE-ORDER" : "Regular"} · ${taka(o.total)}<br/>
${esc(o.name)} · ${esc(o.phone)} · ${esc(o.zoneName)}<br/>${o.items.map((i) => `${esc(i.nameEn)} ${esc(i.variantLabel)} × ${i.qty}`).join(", ")}</p>`,
    )
    .join("<hr style='border:none;border-top:1px solid #eee7d8'/>");
  for (const to of recipients) await sendMail({
    to,
    subject: `🛒 New order ${orders.map((o) => o.orderNo).join(", ")} · ${taka(orders.reduce((a, o) => a + o.total, 0))}`,
    type: "ADMIN_NEW_ORDER",
    refId: orders[0].id,
    html: layout(s, { preheader: "New order on fungibd.com", heading: "New order received", body, cta: { label: "Open in admin", url: `${siteUrl()}/admin/orders/${orders[0].id}` } }),
  });
}

const STATUS_COPY: Partial<Record<OrderStatus, { heading: string; sub: string; text: string }>> = {
  CONFIRMED: {
    heading: "অর্ডার নিশ্চিত হয়েছে ✅",
    sub: "Your order is confirmed",
    text: "আপনার অর্ডারটি নিশ্চিত করা হয়েছে। নির্ধারিত দিনে ভোরে তোলা তাজা মাশরুম যত্ন করে প্যাক করে পাঠানো হবে।",
  },
  OUT_FOR_DELIVERY: {
    heading: "আপনার মাশরুম পথে আছে 🛵",
    sub: "Your order is out for delivery",
    text: "আমাদের ডেলিভারি ম্যান আপনার অর্ডার নিয়ে রওনা দিয়েছেন। অনুগ্রহ করে ফোন খোলা রাখুন এবং টাকা প্রস্তুত রাখুন।",
  },
  DELIVERED: {
    heading: "ডেলিভারি সম্পন্ন হয়েছে 🎉",
    sub: "Delivered — enjoy your mushrooms!",
    text: "FungiBd থেকে কেনার জন্য ধন্যবাদ! তাজা থাকতে মাশরুম পেপার ব্যাগে ফ্রিজের নিচের তাকে রাখুন এবং ২–৩ দিনের মধ্যে রান্না করুন।",
  },
  CANCELLED: {
    heading: "অর্ডারটি বাতিল করা হয়েছে",
    sub: "Your order was cancelled",
    text: "আপনার অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন — আমরা সাহায্য করতে প্রস্তুত।",
  },
};

export async function notifyOrderStatus(orderId: string, status: OrderStatus) {
  const copy = STATUS_COPY[status];
  if (!copy) return;
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o || !o.email || !s.email.sendCustomerEmails) return;
  const enabled = { CONFIRMED: s.email.onConfirmed, OUT_FOR_DELIVERY: s.email.onOutForDelivery, DELIVERED: s.email.onDelivered, CANCELLED: s.email.onCancelled } as Record<string, boolean>;
  if (enabled[status] === false) return;

  let extra = "";
  if (status === "OUT_FOR_DELIVERY") {
    extra = `<div style="background:${s.brand.background};border-radius:12px;padding:14px 16px;margin:10px 0">💵 পরিশোধযোগ্য · Amount to pay: <strong style="font-size:18px">${taka(o.total)}</strong>${
      o.rider ? `<br/>🛵 ডেলিভারি: ${esc(o.rider.name)}${o.rider.phone ? ` · ${esc(o.rider.phone)}` : ""}` : ""
    }</div>`;
  }
  if (status === "CANCELLED" && o.cancelReason) extra = `<p style="margin:0 0 12px"><strong>কারণ · Reason:</strong> ${esc(o.cancelReason)}</p>`;
  if (status === "CONFIRMED") extra = deliveryBox(o, s);

  await sendMail({
    to: o.email,
    subject: `${copy.sub} · ${o.orderNo}`,
    type: `ORDER_${status}`,
    refId: o.id,
    html: layout(s, {
      preheader: `${ORDER_STATUS[status].en} · ${o.orderNo}`,
      heading: copy.heading,
      subheading: `${copy.sub} · ${o.orderNo}`,
      body: `<p style="margin:0 0 12px">প্রিয় ${esc(o.name)},</p><p style="margin:0 0 12px">${copy.text}</p>${extra}${status === "DELIVERED" ? "" : itemsTable(o, s)}`,
      cta:
        status === "DELIVERED"
          ? { label: "⭐ রিভিউ দিন · Rate your mushrooms", url: reviewUrl(o.orderNo) }
          : { label: "অর্ডার ট্র্যাক করুন · Track order", url: trackUrl(o.orderNo, o.phone) },
    }),
  });
}

export async function notifyPreorderReady(orderId: string, message?: string) {
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o || !o.email) return;
  await sendMail({
    to: o.email,
    subject: `আপনার প্রি-অর্ডারের মাশরুম তোলা হয়েছে · Pre-order ${o.orderNo} is harvested`,
    type: "PREORDER_READY",
    refId: o.id,
    html: layout(s, {
      preheader: "Your pre-ordered mushrooms are harvested and on schedule",
      heading: "আপনার প্রি-অর্ডার প্রস্তুত 🌱",
      subheading: "Fresh harvest is ready for your pre-order",
      body: `<p style="margin:0 0 12px">প্রিয় ${esc(o.name)},</p>
<p style="margin:0 0 12px">সুখবর! আপনার প্রি-অর্ডার করা মাশরুম আজ খামার থেকে তোলা হয়েছে। ${
        o.deliveryDate ? `<strong>${fmtDateBn(o.deliveryDate)}</strong> তারিখে ডেলিভারি দেওয়া হবে।` : "শীঘ্রই ডেলিভারি দেওয়া হবে।"
      }</p>${message ? paragraphs(message) : ""}${deliveryBox(o, s)}`,
      cta: { label: "অর্ডার ট্র্যাক করুন · Track order", url: trackUrl(o.orderNo, o.phone) },
    }),
  });
}

export async function notifyTicketCreated(ticketId: string) {
  const [s, t] = await Promise.all([getSettings(), db.ticket.findUnique({ where: { id: ticketId }, include: { messages: true } })]);
  if (!t) return;
  await sendMail({
    to: t.email,
    subject: `আমরা আপনার বার্তা পেয়েছি · Ticket ${t.ticketNo}`,
    type: "TICKET_CREATED",
    refId: t.id,
    html: layout(s, {
      preheader: `We received your message — ticket ${t.ticketNo}`,
      heading: "আপনার বার্তা আমরা পেয়েছি",
      subheading: `Support ticket ${t.ticketNo}`,
      body: `<p style="margin:0 0 12px">প্রিয় ${esc(t.name)},</p><p style="margin:0 0 12px">যোগাযোগের জন্য ধন্যবাদ। আমাদের টিম সাধারণত কয়েক ঘণ্টার মধ্যে উত্তর দেয়। <span style="color:#7a776c">We usually reply within a few hours.</span></p>
<div style="background:${s.brand.background};border-radius:12px;padding:14px 16px"><strong>${esc(t.subject)}</strong><br/>${esc(t.messages[0]?.body ?? "").replace(/\n/g, "<br/>")}</div>`,
      cta: { label: "টিকেট দেখুন · View ticket", url: ticketUrl(t.ticketNo) },
    }),
  });
  if (s.email.adminNewTicket)
    for (const adminTo of adminRecipients(s)) await sendMail({
      to: adminTo,
      subject: `🎧 New support ticket ${t.ticketNo}: ${t.subject}`,
      type: "ADMIN_TICKET",
      refId: t.id,
      replyTo: t.email,
      html: layout(s, {
        preheader: t.subject,
        heading: "New support ticket",
        body: `<p><strong>${esc(t.name)}</strong> · ${esc(t.email)} · ${esc(t.phone)}</p><p>${esc(t.messages[0]?.body ?? "").replace(/\n/g, "<br/>")}</p>`,
        cta: { label: "Reply in admin", url: `${siteUrl()}/admin/support/${t.id}` },
      }),
    });
}

export async function notifyTicketReply(ticketId: string, body: string, staffName: string) {
  const [s, t] = await Promise.all([getSettings(), db.ticket.findUnique({ where: { id: ticketId } })]);
  if (!t) return;
  await sendMail({
    to: t.email,
    subject: `Re: ${t.subject} · ${t.ticketNo}`,
    type: "TICKET_REPLY",
    refId: t.id,
    html: layout(s, {
      preheader: body.slice(0, 90),
      heading: "FungiBd সাপোর্ট টিমের উত্তর",
      subheading: `Reply to ticket ${t.ticketNo} · ${esc(t.subject)}`,
      body: `<p style="margin:0 0 12px">প্রিয় ${esc(t.name)},</p>${paragraphs(body)}<p style="margin:0;color:#7a776c">— ${esc(staffName)}, FungiBd</p>`,
      cta: { label: "উত্তর দিন · Reply", url: ticketUrl(t.ticketNo) },
    }),
  });
}

export async function sendWelcome(c: { name: string; email: string | null }) {
  if (!c.email) return;
  const s = await getSettings();
  await sendMail({
    to: c.email,
    subject: "FungiBd-তে স্বাগতম 🍄 · Welcome to FungiBd",
    type: "WELCOME",
    html: layout(s, {
      preheader: "Your FungiBd account is ready",
      heading: `স্বাগতম, ${esc(c.name)}!`,
      subheading: "Your account is ready",
      body: `<p style="margin:0 0 12px">এখন থেকে আপনি সহজেই অর্ডার ট্র্যাক করতে, আগের অর্ডার দেখতে এবং নতুন হারভেস্টের খবর পেতে পারবেন।</p><p style="margin:0;color:#7a776c">Track orders, re-order favourites and get fresh-harvest alerts.</p>`,
      cta: { label: "শপে যান · Start shopping", url: `${siteUrl()}/shop` },
    }),
  });
}

export async function sendPasswordReset(c: { name: string; email: string }, token: string) {
  const s = await getSettings();
  await sendMail({
    to: c.email,
    subject: "পাসওয়ার্ড রিসেট · Reset your FungiBd password",
    type: "PASSWORD_RESET",
    html: layout(s, {
      preheader: "Reset your password (valid for 1 hour)",
      heading: "পাসওয়ার্ড রিসেট করুন",
      subheading: "This link is valid for 1 hour",
      body: `<p style="margin:0 0 12px">প্রিয় ${esc(c.name)}, নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড দিন। আপনি অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।</p>`,
      cta: { label: "নতুন পাসওয়ার্ড দিন · Reset password", url: `${siteUrl()}/account/reset?token=${token}` },
    }),
  });
}

export function campaignHtml(s: Awaited<ReturnType<typeof getSettings>>, subject: string, body: string, email: string, name?: string) {
  return layout(s, {
    preheader: body.slice(0, 100),
    heading: esc(subject),
    body: `${name ? `<p style="margin:0 0 12px">প্রিয় ${esc(name)},</p>` : ""}${paragraphs(body)}`,
    cta: { label: "এখনই অর্ডার করুন · Shop now", url: `${siteUrl()}/shop` },
    footerNote: `এই ধরনের ইমেইল আর না চাইলে <a href="${unsubscribeUrl(email)}" style="color:#7a776c">আনসাবস্ক্রাইব করুন · Unsubscribe</a>`,
  });
}
