import type { Settings } from "../settings";
import { siteUrl, taka } from "../utils";
import { fmtDateBn } from "../dates";

/*
 * Email building blocks. Email apps only understand old-school HTML: tables, inline styles, PNG images.
 * Icons are PNGs in public/email/icons (made by scripts/email-icons.ts) — no emoji anywhere.
 */

const FONT = "'Noto Sans Bengali','Hind Siliguri',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const C = { ink: "#16251F", soft: "#47524D", muted: "#7B847F", line: "#E9E4D9", page: "#F3F0E8", panel: "#F8F6F1", tint: "#EAF2ED" };

export type IconName =
  | "receipt" | "check" | "circle-check" | "truck" | "package-check" | "x" | "calendar" | "clock" | "map-pin" | "banknote" | "phone"
  | "mail" | "chat" | "sprout" | "star" | "message" | "key" | "user" | "bag" | "briefcase" | "bell" | "info";

export const esc = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function absolute(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  return `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** A small PNG icon. tone: g = brand green, w = white, m = muted grey. */
export const icon = (name: IconName, tone: "g" | "w" | "m" = "g", size = 18) =>
  `<img src="${absolute(`/email/icons/${name}-${tone}.png`)}" width="${size}" height="${size}" alt="" style="display:block;border:0;outline:none;width:${size}px;height:${size}px" />`;

/** Icon + text on one line (table so it aligns in every email app). */
export const iconLine = (name: IconName, html: string, opts: { size?: number; gap?: number; color?: string } = {}) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td valign="top" style="padding:2px ${opts.gap ?? 10}px 0 0">${icon(name, "g", opts.size ?? 18)}</td><td style="font-size:14px;line-height:1.6;color:${opts.color ?? C.soft}">${html}</td></tr></table>`;

export const p = (html: string, style = "") => `<p style="margin:0 0 14px;${style}">${html}</p>`;

export const button = (label: string, url: string, color: string, textColor = "#FFFFFF") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td bgcolor="${color}" style="border-radius:10px;background:${color}"><a href="${esc(url)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1.2;color:${textColor};text-decoration:none;border-radius:10px">${label}</a></td></tr></table>`;

/** Light panel with a heading — used for summaries, addresses and quotes. */
export const panel = (inner: string, title?: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${C.panel};border:1px solid ${C.line};border-radius:12px;margin:6px 0 18px"><tr><td style="padding:18px 20px">${
    title ? `<p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${title}</p>` : ""
  }${inner}</td></tr></table>`;

/** Label / value pairs, e.g. Order no. · Delivery date. */
export function infoRows(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:${i ? 10 : 0}px 12px 0 0;font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top">${k}</td><td align="right" style="padding:${i ? 10 : 0}px 0 0;font-size:14px;font-weight:600;color:${C.ink}">${v}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Progress tracker for orders. `at` = current step index; steps before it are done (at = steps.length → all done). */
export function tracker(steps: { label: string; icon: IconName }[], at: number, brand: string) {
  const w = `${Math.floor(100 / steps.length)}%`;
  const cells = steps
    .map((st, i) => {
      const done = i < at;
      const current = i === at;
      const bg = done || current ? brand : "#EFECE5";
      const ic = done ? icon("check", "w", 16) : icon(st.icon, current ? "w" : "m", 16);
      return `<td align="center" valign="top" width="${w}" style="padding:0 4px">
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 auto"><tr><td width="36" height="36" align="center" valign="middle" bgcolor="${bg}" style="width:36px;height:36px;border-radius:18px;background:${bg}">${ic}</td></tr></table>
<p style="margin:8px 0 0;font-size:12px;line-height:1.4;color:${current ? C.ink : done ? C.soft : C.muted};font-weight:${current ? 700 : 500}">${st.label}</p></td>`;
    })
    .join("");
  const bar = steps.map((_, i) => `<td width="${w}" style="padding:0 2px"><div style="height:3px;border-radius:2px;background:${i <= at ? brand : "#EFECE5"};font-size:0;line-height:0">&nbsp;</div></td>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 6px"><tr>${bar}</tr><tr><td colspan="${steps.length}" style="height:16px;font-size:0;line-height:0">&nbsp;</td></tr><tr>${cells}</tr></table>`;
}

export type LayoutOptions = {
  preheader: string;
  heading: string;
  subheading?: string;
  eyebrow?: string;
  icon?: IconName;
  tone?: "brand" | "muted";
  tracker?: string; // HTML from tracker()
  body: string;
  cta?: { label: string; url: string };
  secondary?: { label: string; url: string };
  footerNote?: string;
  /** Internal alerts to the team — no "questions?" box and a simpler footer. */
  internal?: boolean;
};

export function layout(s: Settings, o: LayoutOptions) {
  const brand = s.brand.primary;
  const logo = s.brand.emailLogoUrl
    ? `<img src="${esc(absolute(s.brand.emailLogoUrl))}" alt="${esc(s.store.name)}" height="30" style="height:30px;width:auto;display:block;border:0;margin:0 auto" />`
    : `<span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:.3px">${esc(s.store.name)}</span>`;
  const badge = o.icon
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 20px"><tr><td width="52" height="52" align="center" valign="middle" bgcolor="${o.tone === "muted" ? "#F1EEE7" : C.tint}" style="width:52px;height:52px;border-radius:26px;background:${o.tone === "muted" ? "#F1EEE7" : C.tint}">${icon(o.icon, o.tone === "muted" ? "m" : "g", 24)}</td></tr></table>`
    : "";
  const phone = s.store.phone.replace(/[^\d+]/g, "");
  const wa = s.store.whatsapp.replace(/[^\d]/g, "");
  const help = o.internal
    ? ""
    : `<tr><td class="px" style="padding:4px 44px 36px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${C.line}"><tr><td style="padding-top:22px">
<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:${C.ink}">প্রশ্ন আছে? আমরা আছি।</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
${phone ? `<td style="padding:0 22px 8px 0">${iconLine("phone", `<a href="tel:${esc(phone)}" style="color:${C.soft};text-decoration:none">${esc(s.store.phone)}</a>`, { size: 16, gap: 8 })}</td>` : ""}
${wa ? `<td style="padding:0 22px 8px 0">${iconLine("chat", `<a href="https://wa.me/${esc(wa)}" style="color:${C.soft};text-decoration:none">WhatsApp</a>`, { size: 16, gap: 8 })}</td>` : ""}
${s.store.email ? `<td style="padding:0 0 8px 0">${iconLine("mail", `<a href="mailto:${esc(s.store.email)}" style="color:${C.soft};text-decoration:none">${esc(s.store.email)}</a>`, { size: 16, gap: 8 })}</td>` : ""}
</tr></table></td></tr></table></td></tr>`;
  const site = siteUrl();
  const footerLinks = [
    [`${site}`, site.replace(/^https?:\/\//, "")],
    [`${site}/track`, "অর্ডার ট্র্যাক"],
    [`${site}/support`, "সাপোর্ট"],
  ]
    .map(([u, l]) => `<a href="${esc(u)}" style="color:${C.muted};text-decoration:underline">${esc(l)}</a>`)
    .join(`<span style="color:#C9C4B8">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.heading.replace(/<[^>]+>/g, ""))}</title>
<style>@media (max-width:620px){.px{padding-left:24px!important;padding-right:24px!important}.h1{font-size:23px!important}.card{border-radius:0!important}}a{color:${brand}}</style></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.ink};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(o.preheader)}${"&#8203;&nbsp;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:28px 10px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td class="card" style="background:#FFFFFF;border:1px solid ${C.line};border-radius:18px;overflow:hidden">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
<tr><td align="center" bgcolor="${brand}" style="background:${brand};padding:26px 24px">${logo}</td></tr>
<tr><td style="height:3px;background:${s.brand.accent};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td class="px" style="padding:40px 44px 10px">
${badge}
${o.eyebrow ? `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${o.tone === "muted" ? C.muted : brand}">${o.eyebrow}</p>` : ""}
<h1 class="h1" style="margin:0;font-family:${FONT};font-size:26px;line-height:1.35;font-weight:700;color:${C.ink}">${o.heading}</h1>
${o.subheading ? `<p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${C.muted}">${o.subheading}</p>` : ""}
</td></tr>
${o.tracker ? `<tr><td class="px" style="padding:26px 44px 6px">${o.tracker}</td></tr>` : ""}
<tr><td class="px" style="padding:22px 44px 8px;font-size:15px;line-height:1.75;color:${C.soft}">${o.body}</td></tr>
${
  o.cta
    ? `<tr><td class="px" style="padding:6px 44px 34px">${button(o.cta.label, o.cta.url, brand)}${
        o.secondary ? `<p style="margin:14px 0 0;font-size:13px"><a href="${esc(o.secondary.url)}" style="color:${brand};font-weight:600;text-decoration:none">${o.secondary.label} &rarr;</a></p>` : ""
      }</td></tr>`
    : `<tr><td style="height:18px;font-size:0;line-height:0">&nbsp;</td></tr>`
}
${help}
</table></td></tr>
<tr><td align="center" style="padding:26px 24px 0;font-size:12px;line-height:1.8;color:${C.muted}">
<p style="margin:0 0 4px;font-weight:700;color:${C.soft}">${esc(s.store.name)}</p>
<p style="margin:0 0 10px">${esc(s.store.taglineBn)}${s.delivery.coverageNote ? ` · ${esc(s.delivery.coverageNote)}` : ""}</p>
${o.internal ? "" : `<p style="margin:0 0 10px">${footerLinks}</p>`}
${o.footerNote ? `<p style="margin:0 0 10px">${o.footerNote}</p>` : ""}
${s.store.address ? `<p style="margin:0;color:#A19C90">${esc(s.store.address)}</p>` : ""}
</td></tr>
</table></td></tr></table></body></html>`;
}

/* ───────────── order pieces ───────────── */

type OrderForEmail = {
  orderNo: string;
  type: string;
  name: string;
  phone: string;
  addressLine: string;
  landmark: string;
  zoneName: string;
  deliveryDate: Date | null;
  deliverySlot: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  couponCode: string;
  items: { nameBn: string; nameEn: string; variantLabel: string; qty: number; unitPrice: number; lineTotal: number; isPreorder: boolean }[];
};

export function itemsTable(o: OrderForEmail, s: Settings) {
  const rows = o.items
    .map(
      (i) => `<tr>
<td style="padding:14px 12px 14px 0;border-bottom:1px solid ${C.line};vertical-align:top">
<p style="margin:0;font-size:15px;font-weight:600;color:${C.ink}">${esc(i.nameBn)}</p>
<p style="margin:2px 0 0;font-size:13px;color:${C.muted}">${esc(i.nameEn)} · ${esc(i.variantLabel)} × ${i.qty}${i.isPreorder ? ` · <span style="color:${s.brand.primary};font-weight:600">প্রি-অর্ডার</span>` : ""}</p></td>
<td align="right" style="padding:14px 0;border-bottom:1px solid ${C.line};white-space:nowrap;vertical-align:top;font-size:15px;color:${C.ink}">${taka(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const line = (label: string, v: string) =>
    `<tr><td style="padding:10px 12px 0 0;font-size:14px;color:${C.muted}">${label}</td><td align="right" style="padding:10px 0 0;font-size:14px;color:${C.soft};white-space:nowrap">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 4px">${rows}
${line("সাবটোটাল · Subtotal", taka(o.subtotal))}
${o.discount > 0 ? line(`ডিসকাউন্ট${o.couponCode ? ` (${esc(o.couponCode)})` : ""} · Discount`, `−${taka(o.discount)}`) : ""}
${line("ডেলিভারি · Delivery", o.deliveryCharge > 0 ? taka(o.deliveryCharge) : "ফ্রি · Free")}
<tr><td colspan="2" style="padding:14px 0 0"><div style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td style="padding:12px 12px 0 0;font-size:16px;font-weight:700;color:${C.ink}">মোট · Total</td><td align="right" style="padding:12px 0 0;font-size:20px;font-weight:700;color:${C.ink};white-space:nowrap">${taka(o.total)}</td></tr>
<tr><td colspan="2" style="padding:12px 0 0">${iconLine("banknote", "ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন", { size: 16, gap: 8, color: C.muted })}</td></tr>
</table>`;
}

export function deliveryBox(o: OrderForEmail) {
  const lines = [
    iconLine("map-pin", `<strong style="color:${C.ink}">${esc(o.name)}</strong> · ${esc(o.phone)}<br/>${esc(o.addressLine)}${o.landmark ? `<br/>ল্যান্ডমার্ক: ${esc(o.landmark)}` : ""}${o.zoneName ? `<br/>এলাকা: ${esc(o.zoneName)}` : ""}`),
    o.deliveryDate ? iconLine("calendar", `<strong style="color:${C.ink}">${fmtDateBn(o.deliveryDate)}</strong>`) : "",
    o.deliverySlot ? iconLine("clock", esc(o.deliverySlot)) : "",
  ].filter(Boolean);
  return panel(lines.join(`<div style="height:12px;font-size:0;line-height:0">&nbsp;</div>`), "ডেলিভারি · Delivery");
}

export function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((x) => `<p style="margin:0 0 14px">${esc(x).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export type { OrderForEmail };
