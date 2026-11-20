import type { Settings } from "../settings";
import { taka } from "../utils";
import { fmtDateBn } from "../dates";

const FONT = "'Hind Siliguri','Noto Sans Bengali','Segoe UI',Helvetica,Arial,sans-serif";

export const esc = (s: string | number | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function layout(s: Settings, o: { preheader: string; heading: string; subheading?: string; body: string; cta?: { label: string; url: string }; footerNote?: string }) {
  const p = s.brand.primary;
  const a = s.brand.accent;
  const logo = s.brand.emailLogoUrl
    ? `<img src="${esc(absolute(s.brand.emailLogoUrl))}" alt="${esc(s.store.name)}" height="34" style="height:34px;display:block;border:0" />`
    : `<span style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:.3px">${esc(s.store.name)}</span>`;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#f3efe6;font-family:${FONT};color:#1d211c">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdf8;border-radius:18px;overflow:hidden;border:1px solid #e7e0d2">
<tr><td style="background:${p};padding:22px 28px">${logo}</td></tr>
<tr><td style="padding:30px 28px 8px">
<h1 style="margin:0 0 6px;font-size:24px;line-height:1.35;color:${p};font-family:${FONT}">${o.heading}</h1>
${o.subheading ? `<p style="margin:0 0 4px;font-size:14px;color:#7a776c">${o.subheading}</p>` : ""}
</td></tr>
<tr><td style="padding:12px 28px 8px;font-size:15px;line-height:1.7">${o.body}</td></tr>
${
  o.cta
    ? `<tr><td style="padding:12px 28px 26px"><a href="${esc(o.cta.url)}" style="display:inline-block;background:${p};color:${s.brand.background};text-decoration:none;font-weight:600;padding:13px 26px;border-radius:999px;font-size:15px;border-bottom:3px solid ${a}">${o.cta.label}</a></td></tr>`
    : ""
}
<tr><td style="padding:18px 28px 26px;border-top:1px solid #eee7d8;font-size:13px;color:#7a776c;line-height:1.6">
${o.footerNote ? `${o.footerNote}<br/><br/>` : ""}
<strong style="color:${p}">${esc(s.store.name)}</strong> · ${esc(s.store.taglineBn)}<br/>
📞 ${esc(s.store.phone)}${s.store.whatsapp ? ` · WhatsApp ${esc(s.store.whatsapp)}` : ""} · ✉️ ${esc(s.store.email)}<br/>
🚚 শুধুমাত্র ঢাকার ভিতরে ডেলিভারি · Delivery inside Dhaka only
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function absolute(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  return `${(process.env.SITE_URL || "").replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

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
<td style="padding:10px 0;border-bottom:1px solid #eee7d8"><strong>${esc(i.nameBn)}</strong> <span style="color:#7a776c">· ${esc(i.nameEn)}</span><br/><span style="font-size:13px;color:#7a776c">${esc(i.variantLabel)} × ${i.qty}${i.isPreorder ? ` · <span style="color:${s.brand.primary};font-weight:600">প্রি-অর্ডার</span>` : ""}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #eee7d8;white-space:nowrap">${taka(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const line = (label: string, v: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:700;font-size:16px" : "color:#55534b"}">${label}</td><td align="right" style="padding:4px 0;${bold ? "font-weight:700;font-size:16px" : ""}">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;font-size:14px">${rows}
${line("সাবটোটাল · Subtotal", taka(o.subtotal))}
${o.discount > 0 ? line(`ডিসকাউন্ট · Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}`, `−${taka(o.discount)}`) : ""}
${line("ডেলিভারি চার্জ · Delivery", o.deliveryCharge > 0 ? taka(o.deliveryCharge) : "ফ্রি · Free")}
${line("মোট · Total (Cash on Delivery)", taka(o.total), true)}
</table>`;
}

export function deliveryBox(o: OrderForEmail, s: Settings) {
  return `<div style="background:${s.brand.background};border-radius:12px;padding:14px 16px;margin:10px 0;font-size:14px">
<strong>ডেলিভারি ঠিকানা · Delivery address</strong><br/>
${esc(o.name)} · ${esc(o.phone)}<br/>${esc(o.addressLine)}${o.landmark ? `<br/>ল্যান্ডমার্ক: ${esc(o.landmark)}` : ""}${o.zoneName ? `<br/>এলাকা: ${esc(o.zoneName)}` : ""}
${o.deliveryDate ? `<br/><br/><strong>ডেলিভারির দিন · Delivery date:</strong> ${fmtDateBn(o.deliveryDate)}${o.deliverySlot ? `<br/><strong>সময় · Slot:</strong> ${esc(o.deliverySlot)}` : ""}` : ""}
</div>`;
}

export function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export type { OrderForEmail };
