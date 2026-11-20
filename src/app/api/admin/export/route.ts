import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { profitAndLoss } from "@/lib/analytics";
import { dateKey, resolveRange } from "@/lib/dates";
import { toCsv } from "@/lib/utils";

// CSV downloads for Excel / Google Sheets. Owner & manager only.
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin || admin.role === "STAFF") return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams) as Record<string, string>;
  const type = sp.type ?? "orders";
  const r = resolveRange(sp, "30d");
  const range = { gte: r.from, lt: r.to };
  let rows: (string | number | null)[][] = [];

  if (type === "orders") {
    const orders = await db.order.findMany({ where: { createdAt: range }, orderBy: { createdAt: "asc" }, include: { items: true, rider: true } });
    rows = [["Order", "Date", "Type", "Status", "Source", "Customer", "Phone", "Email", "Area", "Address", "Delivery date", "Items", "Subtotal", "Discount", "Coupon", "Delivery charge", "Total", "Mushroom cost", "Packaging cost", "Delivery cost", "Profit", "Payment", "Rider"]];
    for (const o of orders)
      rows.push([
        o.orderNo,
        dateKey(o.createdAt),
        o.type,
        o.status,
        o.source,
        o.name,
        o.phone,
        o.email,
        o.zoneName,
        o.addressLine,
        o.deliveryDate ? dateKey(o.deliveryDate) : "",
        o.items.map((i) => `${i.nameEn} ${i.variantLabel.split(" · ").pop()} x${i.qty}`).join("; "),
        o.subtotal,
        o.discount,
        o.couponCode,
        o.deliveryCharge,
        o.total,
        o.itemsCost,
        o.packagingCost,
        o.deliveryCost,
        Math.round((o.subtotal - o.discount + o.deliveryCharge - o.itemsCost - o.packagingCost - o.deliveryCost) * 100) / 100,
        o.paymentStatus,
        o.rider?.name ?? "",
      ]);
  } else if (type === "customers") {
    const cs = await db.customer.findMany({ orderBy: { createdAt: "asc" } });
    rows = [["Name", "Phone", "Email", "Orders", "Lifetime value", "First order", "Last order", "Tags", "Offers opt-in", "Source", "Joined"]];
    for (const c of cs) rows.push([c.name, c.phone, c.email ?? "", c.totalOrders, c.totalSpent, c.firstOrderAt ? dateKey(c.firstOrderAt) : "", c.lastOrderAt ? dateKey(c.lastOrderAt) : "", c.tags, c.marketingOptIn ? "yes" : "no", c.source, dateKey(c.createdAt)]);
  } else if (type === "expenses") {
    const ex = await db.expense.findMany({ where: { date: range, ...(sp.cat ? { category: sp.cat } : {}) }, orderBy: { date: "asc" } });
    rows = [["Date", "Category", "Amount", "Paid to", "Method", "Note"]];
    for (const e of ex) rows.push([dateKey(e.date), e.category, e.amount, e.paidTo, e.method, e.note]);
  } else if (type === "products") {
    const items = await db.orderItem.findMany({ where: { order: { createdAt: range, status: { notIn: ["CANCELLED", "RETURNED"] } } } });
    const m = new Map<string, { units: number; amount: number; revenue: number; cost: number }>();
    for (const i of items) {
      const k = `${i.nameEn} — ${i.variantLabel.split(" · ").pop()}`;
      const x = m.get(k) ?? { units: 0, amount: 0, revenue: 0, cost: 0 };
      x.units += i.qty;
      x.amount += i.unitAmount * i.qty;
      x.revenue += i.lineTotal;
      x.cost += i.unitCost * i.qty;
      m.set(k, x);
    }
    rows = [["Product / pack", "Packs sold", "Quantity (kg/pcs)", "Sales", "Production cost", "Gross margin"]];
    for (const [k, x] of m) rows.push([k, x.units, Math.round(x.amount * 1000) / 1000, Math.round(x.revenue * 100) / 100, Math.round(x.cost * 100) / 100, Math.round((x.revenue - x.cost) * 100) / 100]);
  } else if (type === "pnl") {
    const p = await profitAndLoss(r);
    rows = [
      ["Profit & loss", `${dateKey(r.from)} to ${dateKey(new Date(r.to.getTime() - 1))}`],
      ["Product sales", p.grossSales],
      ["Discounts", -p.discounts],
      ["Delivery charges collected", p.deliveryIncome],
      ["Net revenue", p.netRevenue],
      ["Mushroom production cost", -p.cogs],
      ["Packaging", -p.packaging],
      ["Delivery cost", -p.deliveryCost],
      ["Spoilage", -p.spoilageLoss],
      ["Wasted supplies", -p.supplyWasteLoss],
      ["Cancelled/returned losses", -(p.cancelLoss + p.returnLoss)],
      ["Gross profit", p.grossProfit],
      ...p.expenseLines.map((e) => [e.label, -e.amount]),
      ["Operating expenses", -p.opex],
      ["Net profit", p.netProfit],
    ];
  } else if (type === "leads") {
    const ls = await db.lead.findMany({ orderBy: { createdAt: "asc" } });
    rows = [["Name", "Business", "Phone", "Email", "Type", "Source", "Stage", "Est. value", "Interest", "Next follow-up", "Created"]];
    for (const l of ls) rows.push([l.name, l.company, l.phone, l.email, l.type, l.source, l.status, l.estValue, l.interest, l.nextFollowUp ? dateKey(l.nextFollowUp) : "", dateKey(l.createdAt)]);
  } else return new Response("Unknown export", { status: 400 });

  return new Response("﻿" + toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="fungibd-${type}-${dateKey(new Date())}.csv"` },
  });
}
