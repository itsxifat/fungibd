import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { buildAdminLead, buildAdminNewOrders, buildOrderEmail, buildPasswordReset, buildWelcome, campaignHtml, type OrderEmailKind } from "@/lib/email/notify";

/* Admin → Settings → Email → "Preview emails": renders an email in the browser using your latest real order. Nothing is sent. */

const KIND: Record<string, { kind: OrderEmailKind; pre: boolean }> = {
  placed: { kind: "PLACED", pre: false },
  "preorder-placed": { kind: "PLACED", pre: true },
  confirmed: { kind: "CONFIRMED", pre: false },
  "preorder-ready": { kind: "PREORDER_READY", pre: true },
  out: { kind: "OUT_FOR_DELIVERY", pre: false },
  delivered: { kind: "DELIVERED", pre: true },
  cancelled: { kind: "CANCELLED", pre: false },
};

const html = (body: string) => new NextResponse(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") ?? "placed";
  const s = await getSettings();

  if (type in KIND) {
    const { kind, pre } = KIND[type];
    const include = { items: true, rider: true } as const;
    const o =
      (await db.order.findFirst({ where: { type: pre ? "PREORDER" : "REGULAR", ...(type === "cancelled" ? { status: "CANCELLED" } : {}) }, orderBy: { createdAt: "desc" }, include })) ??
      (await db.order.findFirst({ orderBy: { createdAt: "desc" }, include }));
    if (!o) return html("<p style='font-family:sans-serif;padding:24px'>No orders yet — place a test order to preview order emails.</p>");
    return html(buildOrderEmail(s, o, kind, kind === "PREORDER_READY" ? "আজ সকালে তোলা হয়েছে। ডেলিভারির আগে আমাদের রাইডার ফোন করবেন।" : undefined).html);
  }
  if (type === "welcome") return html(buildWelcome(s, "রহিম"));
  if (type === "reset") return html(buildPasswordReset(s, "রহিম", "preview-token"));
  if (type === "campaign") return html(campaignHtml(s, "পরের হারভেস্টের প্রি-অর্ডার খুলেছে", "এই সপ্তাহে ঝিনুক আর দুধ মাশরুমের নতুন ব্যাচ তোলা হবে।\n\nসীমিত পরিমাণ — আগে বুক করলে আগে পাবেন।", "preview@example.com", "রহিম"));
  if (type === "admin-order") {
    const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 1, include: { items: true } });
    if (!orders.length) return html("<p style='font-family:sans-serif;padding:24px'>No orders yet.</p>");
    return html(buildAdminNewOrders(s, orders).html);
  }
  if (type === "admin-lead")
    return html(buildAdminLead(s, { id: "preview", name: "Karim Ahmed", company: "Green Leaf Restaurant", phone: "01700000000", email: "karim@example.com", interest: "Oyster mushroom · 10 kg / week", message: "We need fresh oyster mushrooms twice a week for our kitchen." }).html);
  return NextResponse.json({ error: "Unknown preview type" }, { status: 400 });
}
