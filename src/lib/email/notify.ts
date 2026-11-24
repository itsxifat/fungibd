import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { getSettings, type Settings } from "../settings";
import { sendMail } from "./mailer";
import { layout, itemsTable, deliveryBox, esc, paragraphs, panel, infoRows, tracker, iconLine, p, C, type IconName } from "./templates";
import { isEmail, siteUrl, splitEmails, taka } from "../utils";
import { fmtDateBn } from "../dates";
import { sign } from "../security";
import type { OrderStatus } from "../constants";

const trackUrl = (orderNo: string, phone: string) => `${siteUrl()}/track?order=${orderNo}&phone=${phone}`;
export const reviewUrl = (orderNo: string) => `${siteUrl()}/review?order=${orderNo}&k=${sign(`review:${orderNo}`)}`;
export const unsubscribeUrl = (email: string) => `${siteUrl()}/unsubscribe?e=${encodeURIComponent(email)}&k=${sign(`unsub:${email}`)}`;
export const ticketUrl = (ticketNo: string) => `${siteUrl()}/support/ticket/${ticketNo}?k=${sign(`ticket:${ticketNo}`)}`;

type OrderFull = Prisma.OrderGetPayload<{ include: { items: true; rider: true } }>;

async function loadOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: true, rider: true } });
}

/** Everyone who should receive admin alerts (Settings → Email). */
export function adminRecipients(s: Settings) {
  return splitEmails(s.email.notifyAdminEmail || s.store.email).filter(isEmail);
}

/** Run in the background so the customer never waits for SMTP. */
export function background(pr: Promise<unknown>) {
  pr.catch((e) => console.error("[notify]", e));
}

const section = (title: string) => `<p style="margin:26px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${title}</p>`;
const greet = (name: string) => p(`প্রিয় ${esc(name)},`, `color:${C.ink}`);

/* ───────────── customer order emails ───────────── */

export type OrderEmailKind = "PLACED" | "CONFIRMED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "PREORDER_READY";

const REGULAR_STEPS: { label: string; icon: IconName }[] = [
  { label: "অর্ডার গ্রহণ", icon: "receipt" },
  { label: "নিশ্চিত", icon: "circle-check" },
  { label: "পথে", icon: "truck" },
  { label: "ডেলিভারি", icon: "package-check" },
];
const PREORDER_STEPS: { label: string; icon: IconName }[] = [
  { label: "বুক হয়েছে", icon: "calendar" },
  { label: "নিশ্চিত", icon: "circle-check" },
  { label: "হারভেস্ট", icon: "sprout" },
  { label: "পথে", icon: "truck" },
  { label: "ডেলিভারি", icon: "package-check" },
];
const STEP_AT: Record<"REGULAR" | "PREORDER", Partial<Record<OrderEmailKind, number>>> = {
  REGULAR: { PLACED: 0, CONFIRMED: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 4 },
  PREORDER: { PLACED: 0, CONFIRMED: 1, PREORDER_READY: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 5 },
};

/** Builds the subject + HTML for an order email (also used by the admin email preview). */
export function buildOrderEmail(s: Settings, o: OrderFull, kind: OrderEmailKind, message?: string) {
  const pre = o.type === "PREORDER";
  const date = o.deliveryDate ? fmtDateBn(o.deliveryDate) : "";
  const at = STEP_AT[pre ? "PREORDER" : "REGULAR"][kind];
  const track = at != null ? tracker(pre ? PREORDER_STEPS : REGULAR_STEPS, at, s.brand.primary) : undefined;
  const summary = panel(
    infoRows([
      ["অর্ডার নম্বর · Order no.", esc(o.orderNo)],
      ...(date ? [[pre ? "ডেলিভারি (হারভেস্টের পর)" : "ডেলিভারির দিন", date] as [string, string]] : []),
      ["মোট · Total", taka(o.total)],
    ]),
  );
  const items = `${section("আপনার অর্ডার · Your order")}${itemsTable(o, s)}`;
  const trackCta = { label: "অর্ডার ট্র্যাক করুন · Track order", url: trackUrl(o.orderNo, o.phone) };

  const copy: Record<OrderEmailKind, { subject: string; type: string; icon: IconName; tone?: "muted"; heading: string; sub: string; body: string; cta: { label: string; url: string }; secondary?: { label: string; url: string } }> = {
    PLACED: {
      subject: pre ? `প্রি-অর্ডার বুক হয়েছে · Pre-order ${o.orderNo}` : `অর্ডার পেয়েছি · Order ${o.orderNo}`,
      type: pre ? "PREORDER_PLACED" : "ORDER_PLACED",
      icon: pre ? "calendar" : "receipt",
      heading: pre ? "আপনার প্রি-অর্ডার বুক হয়েছে" : "ধন্যবাদ, অর্ডারটি আমরা পেয়েছি",
      sub: pre ? "Your pre-order is reserved from the next harvest." : "Thank you — we've received your order.",
      body:
        greet(o.name) +
        p(
          pre
            ? "পরের হারভেস্ট থেকে আপনার জন্য মাশরুম আলাদা করে রাখা হলো। তোলার দিন ঠিক হলে জানিয়ে দেব — অগ্রিম টাকা লাগবে না।"
            : "FungiBd থেকে অর্ডার করার জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই ফোন করে অর্ডারটি নিশ্চিত করবে।",
        ) +
        summary +
        items +
        deliveryBox(o),
      cta: trackCta,
    },
    CONFIRMED: {
      subject: `অর্ডার নিশ্চিত হয়েছে · Order ${o.orderNo} confirmed`,
      type: "ORDER_CONFIRMED",
      icon: "circle-check",
      heading: "অর্ডার নিশ্চিত হয়েছে",
      sub: "Your order is confirmed.",
      body:
        greet(o.name) +
        p(pre ? "আপনার প্রি-অর্ডার নিশ্চিত করা হয়েছে। হারভেস্টের পর নির্ধারিত দিনে তাজা মাশরুম যত্ন করে প্যাক করে পাঠানো হবে।" : "আপনার অর্ডার নিশ্চিত করা হয়েছে। নির্ধারিত দিনে যত্ন করে প্যাক করে পাঠানো হবে।") +
        deliveryBox(o) +
        items,
      cta: trackCta,
    },
    OUT_FOR_DELIVERY: {
      subject: `আপনার অর্ডার পথে · Order ${o.orderNo} is on its way`,
      type: "ORDER_OUT_FOR_DELIVERY",
      icon: "truck",
      heading: "আপনার অর্ডার পথে আছে",
      sub: "Your order is out for delivery.",
      body:
        greet(o.name) +
        p("আমাদের ডেলিভারি সহকারী আপনার অর্ডার নিয়ে রওনা দিয়েছেন। অনুগ্রহ করে ফোন খোলা রাখুন।") +
        panel(
          infoRows([
            ["পরিশোধযোগ্য · To pay", `<span style="font-size:18px">${taka(o.total)}</span>`],
            ...(o.rider ? [["ডেলিভারি সহকারী", `${esc(o.rider.name)}${o.rider.phone ? ` · <a href="tel:${esc(o.rider.phone)}" style="color:${C.ink};text-decoration:none">${esc(o.rider.phone)}</a>` : ""}`] as [string, string]] : []),
          ]),
        ) +
        items,
      cta: trackCta,
    },
    DELIVERED: {
      subject: `ডেলিভারি সম্পন্ন · Order ${o.orderNo} delivered`,
      type: "ORDER_DELIVERED",
      icon: "package-check",
      heading: "ডেলিভারি সম্পন্ন হয়েছে",
      sub: `Delivered — thank you for choosing ${esc(s.store.name)}.`,
      body:
        greet(o.name) +
        p("আপনার অর্ডার পৌঁছে গেছে। আশা করি ভালো লাগবে — আপনার মতামত আমাদের পরের হারভেস্টকে আরও ভালো করতে সাহায্য করে।") +
        (o.items.some((i) => i.isPreorder) ? panel(iconLine("info", "তাজা রাখতে মাশরুম পেপার ব্যাগে ফ্রিজের নিচের তাকে রাখুন এবং ২–৩ দিনের মধ্যে রান্না করুন। প্লাস্টিকে মুখ বন্ধ করে রাখবেন না।"), "সংরক্ষণের নিয়ম · Storage") : ""),
      cta: { label: "রিভিউ দিন · Rate your order", url: reviewUrl(o.orderNo) },
      secondary: { label: "পরের হারভেস্ট থেকে আবার বুক করুন", url: `${siteUrl()}/preorder` },
    },
    CANCELLED: {
      subject: `অর্ডার বাতিল হয়েছে · Order ${o.orderNo} cancelled`,
      type: "ORDER_CANCELLED",
      icon: "x",
      tone: "muted",
      heading: "অর্ডারটি বাতিল করা হয়েছে",
      sub: "Your order has been cancelled.",
      body: greet(o.name) + p("আপনার অর্ডারটি বাতিল করা হয়েছে। কোনো প্রশ্ন থাকলে আমাদের জানান — আমরা সাহায্য করব।") + (o.cancelReason ? panel(esc(o.cancelReason), "কারণ · Reason") : "") + items,
      cta: { label: "সাপোর্টে লিখুন · Contact support", url: `${siteUrl()}/support` },
    },
    PREORDER_READY: {
      subject: `আপনার প্রি-অর্ডারের মাশরুম তোলা হয়েছে · Pre-order ${o.orderNo}`,
      type: "PREORDER_READY",
      icon: "sprout",
      heading: "আপনার মাশরুম তোলা হয়েছে",
      sub: "Your pre-order has been harvested.",
      body:
        greet(o.name) +
        p(`আপনার প্রি-অর্ডার করা মাশরুম খামার থেকে তোলা হয়েছে। ${date ? `<strong style="color:${C.ink}">${date}</strong> ডেলিভারি দেওয়া হবে।` : "শীঘ্রই ডেলিভারি দেওয়া হবে।"}`) +
        (message ? paragraphs(message) : "") +
        deliveryBox(o),
      cta: trackCta,
    },
  };

  const c = copy[kind];
  return {
    subject: c.subject,
    type: c.type,
    html: layout(s, {
      preheader: `${c.sub} ${o.orderNo} · ${taka(o.total)}`,
      eyebrow: `${pre ? "প্রি-অর্ডার" : "অর্ডার"} ${esc(o.orderNo)}`,
      icon: c.icon,
      tone: c.tone,
      heading: c.heading,
      subheading: c.sub,
      tracker: kind === "CANCELLED" ? undefined : track,
      body: c.body,
      cta: c.cta,
      secondary: c.secondary,
    }),
  };
}

export async function notifyOrderPlaced(orderId: string) {
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o || !o.email || !s.email.sendCustomerEmails || !s.email.onPlaced) return;
  const m = buildOrderEmail(s, o, "PLACED");
  await sendMail({ to: o.email, subject: m.subject, type: m.type, refId: o.id, html: m.html });
}

const STATUS_KIND: Partial<Record<OrderStatus, OrderEmailKind>> = { CONFIRMED: "CONFIRMED", OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY", DELIVERED: "DELIVERED", CANCELLED: "CANCELLED" };

export async function notifyOrderStatus(orderId: string, status: OrderStatus) {
  const kind = STATUS_KIND[status];
  if (!kind) return;
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o || !o.email || !s.email.sendCustomerEmails) return;
  const enabled = { CONFIRMED: s.email.onConfirmed, OUT_FOR_DELIVERY: s.email.onOutForDelivery, DELIVERED: s.email.onDelivered, CANCELLED: s.email.onCancelled } as Record<string, boolean>;
  if (enabled[status] === false) return;
  const m = buildOrderEmail(s, o, kind);
  await sendMail({ to: o.email, subject: m.subject, type: m.type, refId: o.id, html: m.html });
}

export async function notifyPreorderReady(orderId: string, message?: string) {
  const [s, o] = await Promise.all([getSettings(), loadOrder(orderId)]);
  if (!o || !o.email) return;
  const m = buildOrderEmail(s, o, "PREORDER_READY", message);
  await sendMail({ to: o.email, subject: m.subject, type: m.type, refId: o.id, html: m.html });
}

/* ───────────── team alerts ───────────── */

export function buildAdminNewOrders(s: Settings, orders: Prisma.OrderGetPayload<{ include: { items: true } }>[]) {
  const total = orders.reduce((a, o) => a + o.total, 0);
  const body = orders
    .map((o) =>
      panel(
        infoRows([
          ["Order", `<a href="${siteUrl()}/admin/orders/${o.id}" style="color:${s.brand.primary};text-decoration:none">${esc(o.orderNo)}</a>`],
          ["Type", o.type === "PREORDER" ? "Pre-order" : "Regular"],
          ["Customer", `${esc(o.name)} · <a href="tel:${esc(o.phone)}" style="color:${C.ink};text-decoration:none">${esc(o.phone)}</a>`],
          ["Area", esc(o.zoneName) || "—"],
          ["Delivery", o.deliveryDate ? `${fmtDateBn(o.deliveryDate, { day: "numeric", month: "short", weekday: "short" })}${o.deliverySlot ? ` · ${esc(o.deliverySlot)}` : ""}` : "—"],
          ["Items", o.items.map((i) => `${esc(i.nameEn)} ${esc(i.variantLabel)} × ${i.qty}`).join("<br/>")],
          ["Total", taka(o.total)],
        ]),
      ),
    )
    .join("");
  return {
    subject: `New order ${orders.map((o) => o.orderNo).join(", ")} · ${taka(total)}`,
    html: layout(s, {
      internal: true,
      preheader: `${orders.length} new order${orders.length > 1 ? "s" : ""} on the website · ${taka(total)}`,
      eyebrow: "Website order",
      icon: "bag",
      heading: `New order${orders.length > 1 ? "s" : ""} · ${taka(total)}`,
      body,
      cta: { label: "Open in admin", url: `${siteUrl()}/admin/orders/${orders[0].id}` },
    }),
  };
}

export async function notifyAdminNewOrders(orderIds: string[]) {
  const s = await getSettings();
  const recipients = adminRecipients(s);
  if (!s.email.adminNewOrder || !recipients.length) return;
  const orders = await db.order.findMany({ where: { id: { in: orderIds } }, include: { items: true } });
  if (!orders.length) return;
  const m = buildAdminNewOrders(s, orders);
  for (const to of recipients) await sendMail({ to, subject: m.subject, type: "ADMIN_NEW_ORDER", refId: orders[0].id, html: m.html });
}

/** Wholesale inquiry alert (called from the wholesale form). */
export function buildAdminLead(s: Settings, l: { id: string; name: string; company: string; phone: string; email: string; interest: string; message: string }) {
  return {
    subject: `New wholesale inquiry: ${l.name}${l.company ? ` (${l.company})` : ""}`,
    html: layout(s, {
      internal: true,
      preheader: l.interest,
      eyebrow: "Wholesale",
      icon: "briefcase",
      heading: "New wholesale inquiry",
      body:
        panel(
          infoRows([
            ["Name", esc(l.name)],
            ...(l.company ? [["Business", esc(l.company)] as [string, string]] : []),
            ["Phone", `<a href="tel:${esc(l.phone)}" style="color:${C.ink};text-decoration:none">${esc(l.phone)}</a>`],
            ...(l.email ? [["Email", esc(l.email)] as [string, string]] : []),
            ["Interested in", esc(l.interest)],
          ]),
        ) + (l.message ? panel(paragraphs(l.message), "Message") : ""),
      cta: { label: "Open lead", url: `${siteUrl()}/admin/leads/${l.id}` },
    }),
  };
}

/* ───────────── support ───────────── */

export async function notifyTicketCreated(ticketId: string) {
  const [s, t] = await Promise.all([getSettings(), db.ticket.findUnique({ where: { id: ticketId }, include: { messages: true } })]);
  if (!t) return;
  const first = t.messages[0]?.body ?? "";
  await sendMail({
    to: t.email,
    subject: `আমরা আপনার বার্তা পেয়েছি · Ticket ${t.ticketNo}`,
    type: "TICKET_CREATED",
    refId: t.id,
    html: layout(s, {
      preheader: `We received your message — ticket ${t.ticketNo}`,
      eyebrow: `টিকেট ${esc(t.ticketNo)}`,
      icon: "message",
      heading: "আপনার বার্তা আমরা পেয়েছি",
      subheading: "Thanks for reaching out — we usually reply within a few hours.",
      body: greet(t.name) + p("যোগাযোগের জন্য ধন্যবাদ। আমাদের টিম সাধারণত কয়েক ঘণ্টার মধ্যে উত্তর দেয়। উত্তর এই ইমেইলেই পাবেন।") + panel(`<p style="margin:0 0 8px;font-weight:700;color:${C.ink}">${esc(t.subject)}</p>${paragraphs(first)}`, "আপনার বার্তা · Your message"),
      cta: { label: "টিকেট দেখুন · View ticket", url: ticketUrl(t.ticketNo) },
    }),
  });
  if (s.email.adminNewTicket)
    for (const adminTo of adminRecipients(s))
      await sendMail({
        to: adminTo,
        subject: `New support ticket ${t.ticketNo}: ${t.subject}`,
        type: "ADMIN_TICKET",
        refId: t.id,
        replyTo: t.email,
        html: layout(s, {
          internal: true,
          preheader: t.subject,
          eyebrow: `Ticket ${esc(t.ticketNo)}`,
          icon: "message",
          heading: esc(t.subject),
          body: panel(infoRows([["From", esc(t.name)], ["Email", esc(t.email)], ...(t.phone ? [["Phone", esc(t.phone)] as [string, string]] : []), ...(t.orderNo ? [["Order", esc(t.orderNo)] as [string, string]] : [])])) + panel(paragraphs(first), "Message"),
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
      eyebrow: `টিকেট ${esc(t.ticketNo)}`,
      icon: "message",
      heading: "সাপোর্ট টিমের উত্তর",
      subheading: esc(t.subject),
      body: greet(t.name) + paragraphs(body) + p(`— ${esc(staffName)}, ${esc(s.store.name)}`, `color:${C.muted}`),
      cta: { label: "উত্তর দিন · Reply", url: ticketUrl(t.ticketNo) },
    }),
  });
}

/* ───────────── account ───────────── */

export function buildWelcome(s: Settings, name: string) {
  return layout(s, {
    preheader: "Your FungiBd account is ready",
    eyebrow: "নতুন অ্যাকাউন্ট",
    icon: "user",
    heading: `স্বাগতম, ${esc(name)}`,
    subheading: `Your ${esc(s.store.name)} account is ready.`,
    body:
      p("অ্যাকাউন্ট তৈরি হয়ে গেছে। এখন থেকে:") +
      [
        iconLine("calendar", "পরের হারভেস্ট থেকে এক ক্লিকে প্রি-অর্ডার করতে পারবেন"),
        iconLine("truck", "সব অর্ডার এক জায়গায় ট্র্যাক করতে পারবেন"),
        iconLine("bell", "নতুন হারভেস্ট আর প্রি-অর্ডারের খবর সবার আগে পাবেন"),
      ].join(`<div style="height:12px;font-size:0;line-height:0">&nbsp;</div>`),
    cta: { label: "প্রি-অর্ডার দেখুন · See pre-orders", url: `${siteUrl()}/preorder` },
  });
}

export async function sendWelcome(c: { name: string; email: string | null }) {
  if (!c.email) return;
  const s = await getSettings();
  await sendMail({ to: c.email, subject: `${s.store.name}-তে স্বাগতম · Welcome to ${s.store.name}`, type: "WELCOME", html: buildWelcome(s, c.name) });
}

export function buildPasswordReset(s: Settings, name: string, token: string) {
  return layout(s, {
    preheader: "Reset your password (link valid for 1 hour)",
    eyebrow: "অ্যাকাউন্ট নিরাপত্তা",
    icon: "key",
    heading: "পাসওয়ার্ড রিসেট করুন",
    subheading: "This link is valid for 1 hour.",
    body: greet(name) + p("নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড দিন।") + panel(iconLine("info", "আপনি অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন — আপনার পাসওয়ার্ড বদলাবে না।")),
    cta: { label: "নতুন পাসওয়ার্ড দিন · Reset password", url: `${siteUrl()}/account/reset?token=${token}` },
  });
}

export async function sendPasswordReset(c: { name: string; email: string }, token: string) {
  const s = await getSettings();
  await sendMail({ to: c.email, subject: `পাসওয়ার্ড রিসেট · Reset your ${s.store.name} password`, type: "PASSWORD_RESET", html: buildPasswordReset(s, c.name, token) });
}

/* ───────────── marketing ───────────── */

export function campaignHtml(s: Settings, subject: string, body: string, email: string, name?: string) {
  return layout(s, {
    preheader: body.slice(0, 100),
    heading: esc(subject),
    body: `${name ? greet(name) : ""}${paragraphs(body)}`,
    cta: { label: "প্রি-অর্ডার করুন · Pre-order", url: `${siteUrl()}/preorder` },
    footerNote: `এই ধরনের ইমেইল আর না চাইলে <a href="${unsubscribeUrl(email)}" style="color:${C.muted};text-decoration:underline">আনসাবস্ক্রাইব করুন · Unsubscribe</a>`,
  });
}
