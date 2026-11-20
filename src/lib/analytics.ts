import "server-only";
import { db } from "./db";
import { round2, round3 } from "./utils";
import { dateKey, dayKeys, startOfDay, addDays } from "./dates";
import { EXPENSE_CATEGORIES } from "./constants";

type Range = { from: Date; to: Date };
const inRange = (r: Range) => ({ gte: r.from, lt: r.to });

/**
 * Profit & Loss — revenue is counted when an order is DELIVERED.
 *   Net revenue   = product sales − discounts + delivery charges collected
 *   Cost of sales = mushroom production cost (snapshot per order) + packaging + rider/courier cost
 *   Losses        = spoilage (stock written off) + wasted supplies + cancelled/returned order costs
 *   Gross profit  = Net revenue − Cost of sales − Losses
 *   Net profit    = Gross profit − Operating expenses (rent, salary, utilities…)
 * Supply purchases are NOT expenses here: they become cost when used (avoids double counting).
 */
export async function profitAndLoss(r: Range) {
  const [delivered, cancelled, returned, spoilage, supplyWaste, expenses] = await Promise.all([
    db.order.findMany({
      where: { status: "DELIVERED", deliveredAt: inRange(r) },
      select: { subtotal: true, discount: true, deliveryCharge: true, total: true, itemsCost: true, packagingCost: true, deliveryCost: true },
    }),
    db.order.findMany({ where: { status: "CANCELLED", cancelledAt: inRange(r) }, select: { packagingCost: true, deliveryCost: true, packed: true } }),
    db.order.findMany({ where: { status: "RETURNED", returnedAt: inRange(r) }, select: { itemsCost: true, packagingCost: true, deliveryCost: true } }),
    db.stockMovement.findMany({ where: { reason: "SPOILAGE", createdAt: inRange(r) }, select: { change: true, unitCost: true } }),
    db.supplyUsage.aggregate({ where: { reason: "WASTE", date: inRange(r) }, _sum: { totalCost: true } }),
    db.expense.groupBy({ by: ["category"], where: { date: inRange(r) }, _sum: { amount: true } }),
  ]);
  const sum = <T>(arr: T[], f: (x: T) => number) => round2(arr.reduce((a, x) => a + f(x), 0));

  const grossSales = sum(delivered, (o) => o.subtotal);
  const discounts = sum(delivered, (o) => o.discount);
  const deliveryIncome = sum(delivered, (o) => o.deliveryCharge);
  const netRevenue = round2(grossSales - discounts + deliveryIncome);

  const cogs = sum(delivered, (o) => o.itemsCost);
  const packaging = sum(delivered, (o) => o.packagingCost);
  const deliveryCost = sum(delivered, (o) => o.deliveryCost);
  const costOfSales = round2(cogs + packaging + deliveryCost);

  const spoilageLoss = sum(spoilage, (m) => Math.abs(m.change) * m.unitCost);
  const supplyWasteLoss = round2(supplyWaste._sum.totalCost ?? 0);
  const cancelLoss = sum(cancelled, (o) => (o.packed ? o.packagingCost : 0) + o.deliveryCost);
  const returnLoss = sum(returned, (o) => o.itemsCost + o.packagingCost + o.deliveryCost);
  const losses = round2(spoilageLoss + supplyWasteLoss + cancelLoss + returnLoss);

  const grossProfit = round2(netRevenue - costOfSales - losses);
  const expenseLines = Object.keys(EXPENSE_CATEGORIES)
    .map((k) => ({ category: k, label: EXPENSE_CATEGORIES[k as keyof typeof EXPENSE_CATEGORIES], amount: round2(expenses.find((e) => e.category === k)?._sum.amount ?? 0) }))
    .filter((e) => e.amount > 0);
  const opex = round2(expenseLines.reduce((a, e) => a + e.amount, 0));
  const netProfit = round2(grossProfit - opex);

  return {
    orders: delivered.length,
    grossSales,
    discounts,
    deliveryIncome,
    netRevenue,
    cogs,
    packaging,
    deliveryCost,
    costOfSales,
    spoilageLoss,
    supplyWasteLoss,
    cancelLoss,
    returnLoss,
    losses,
    grossProfit,
    expenseLines,
    opex,
    netProfit,
    grossMargin: netRevenue > 0 ? grossProfit / netRevenue : 0,
    netMargin: netRevenue > 0 ? netProfit / netRevenue : 0,
  };
}
export type PnL = Awaited<ReturnType<typeof profitAndLoss>>;

/** Cash actually received vs paid out in the period. */
export async function cashFlow(r: Range) {
  const [collected, purchases, expenses, riderPaid] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID", paidAt: inRange(r) }, _sum: { collectedAmount: true } }),
    db.supplyPurchase.aggregate({ where: { date: inRange(r) }, _sum: { totalCost: true } }),
    db.expense.aggregate({ where: { date: inRange(r) }, _sum: { amount: true } }),
    db.order.aggregate({
      where: { OR: [{ deliveredAt: inRange(r) }, { returnedAt: inRange(r) }, { status: "CANCELLED", cancelledAt: inRange(r) }] },
      _sum: { deliveryCost: true },
    }),
  ]);
  const cashIn = round2(collected._sum.collectedAmount ?? 0);
  const supplies = round2(purchases._sum.totalCost ?? 0);
  const exp = round2(expenses._sum.amount ?? 0);
  const delivery = round2(riderPaid._sum.deliveryCost ?? 0);
  const cashOut = round2(supplies + exp + delivery);
  return { cashIn, supplies, expenses: exp, delivery, cashOut, net: round2(cashIn - cashOut) };
}

/** Value of what is sitting in stock right now (at cost). */
export async function inventoryValue() {
  const [products, supplies] = await Promise.all([
    db.product.findMany({ select: { stockQty: true, costPerUnit: true } }),
    db.supplyItem.findMany({ select: { stockQty: true, avgCost: true } }),
  ]);
  const mushrooms = round2(products.reduce((a, p) => a + Math.max(0, p.stockQty) * p.costPerUnit, 0));
  const sup = round2(supplies.reduce((a, s) => a + Math.max(0, s.stockQty) * s.avgCost, 0));
  return { mushrooms, supplies: sup, total: round2(mushrooms + sup) };
}

/** Daily series for charts. */
export async function dailySeries(r: Range) {
  const [created, delivered, expenses] = await Promise.all([
    db.order.findMany({ where: { createdAt: inRange(r), status: { not: "CANCELLED" } }, select: { createdAt: true, total: true, type: true } }),
    db.order.findMany({
      where: { status: "DELIVERED", deliveredAt: inRange(r) },
      select: { deliveredAt: true, subtotal: true, discount: true, deliveryCharge: true, itemsCost: true, packagingCost: true, deliveryCost: true },
    }),
    db.expense.findMany({ where: { date: inRange(r) }, select: { date: true, amount: true } }),
  ]);
  const keys = dayKeys(r.from, r.to);
  const map = new Map(keys.map((k) => [k, { date: k, orders: 0, preorders: 0, booked: 0, revenue: 0, grossProfit: 0, expenses: 0 }]));
  for (const o of created) {
    const d = map.get(dateKey(o.createdAt));
    if (!d) continue;
    d.orders++;
    if (o.type === "PREORDER") d.preorders++;
    d.booked += o.total;
  }
  for (const o of delivered) {
    const d = map.get(dateKey(o.deliveredAt!));
    if (!d) continue;
    const rev = o.subtotal - o.discount + o.deliveryCharge;
    d.revenue += rev;
    d.grossProfit += rev - o.itemsCost - o.packagingCost - o.deliveryCost;
  }
  for (const e of expenses) {
    const d = map.get(dateKey(e.date));
    if (d) d.expenses += e.amount;
  }
  return [...map.values()].map((d) => ({ ...d, booked: round2(d.booked), revenue: round2(d.revenue), grossProfit: round2(d.grossProfit), expenses: round2(d.expenses) }));
}

export async function salesBreakdown(r: Range) {
  const items = await db.orderItem.findMany({
    where: { order: { createdAt: inRange(r), status: { notIn: ["CANCELLED", "RETURNED"] } } },
    select: { productId: true, nameEn: true, nameBn: true, qty: true, unitAmount: true, lineTotal: true, unitCost: true, product: { select: { stockUnit: true } } },
  });
  const prod = new Map<string, { name: string; nameBn: string; units: number; amount: number; revenue: number; cost: number; unit: string }>();
  for (const i of items) {
    const k = i.productId ?? i.nameEn;
    const p = prod.get(k) ?? { name: i.nameEn, nameBn: i.nameBn, units: 0, amount: 0, revenue: 0, cost: 0, unit: i.product?.stockUnit ?? "kg" };
    p.units += i.qty;
    p.amount += i.unitAmount * i.qty;
    p.revenue += i.lineTotal;
    p.cost += i.unitCost * i.qty;
    prod.set(k, p);
  }
  const products = [...prod.values()]
    .map((p) => ({ ...p, amount: round3(p.amount), revenue: round2(p.revenue), cost: round2(p.cost), margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const orders = await db.order.findMany({
    where: { createdAt: inRange(r), status: { notIn: ["CANCELLED"] } },
    select: { zoneName: true, total: true, source: true, customerId: true, type: true, customer: { select: { firstOrderAt: true } } },
  });
  const zones = new Map<string, { zone: string; orders: number; revenue: number }>();
  const sources = new Map<string, number>();
  let newCustomers = 0;
  let returningOrders = 0;
  const seen = new Set<string>();
  for (const o of orders) {
    const z = zones.get(o.zoneName) ?? { zone: o.zoneName || "—", orders: 0, revenue: 0 };
    z.orders++;
    z.revenue += o.total;
    zones.set(o.zoneName, z);
    sources.set(o.source, (sources.get(o.source) ?? 0) + 1);
    const first = o.customer.firstOrderAt;
    if (first && first >= r.from && first < r.to) {
      if (!seen.has(o.customerId)) newCustomers++;
    } else returningOrders++;
    seen.add(o.customerId);
  }
  return {
    products,
    zones: [...zones.values()].map((z) => ({ ...z, revenue: round2(z.revenue) })).sort((a, b) => b.revenue - a.revenue),
    sources: [...sources.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    customers: { unique: seen.size, newCustomers, returningOrders, totalOrders: orders.length },
  };
}

/** Live operational counters for the dashboard (not range dependent). */
export async function liveOps() {
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const [pending, toPack, outForDelivery, todayDeliveries, openPreorders, products, supplies, openTickets, followUps, newLeads] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "CONFIRMED", OR: [{ deliveryDate: { lt: tomorrow } }, { deliveryDate: null }] } }),
    db.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    db.order.count({ where: { deliveryDate: { gte: today, lt: tomorrow }, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY"] } } }),
    db.order.count({ where: { type: "PREORDER", status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.product.findMany({ where: { isActive: true }, select: { id: true, nameEn: true, nameBn: true, stockQty: true, lowStockAt: true, stockUnit: true, preorderEnabled: true, preorderMode: true } }),
    db.supplyItem.findMany({ where: { isActive: true }, select: { id: true, name: true, stockQty: true, reorderLevel: true, unit: true } }),
    db.ticket.count({ where: { status: { in: ["OPEN"] } } }),
    db.lead.count({ where: { nextFollowUp: { lt: tomorrow }, status: { notIn: ["WON", "LOST"] } } }),
    db.lead.count({ where: { status: "NEW" } }),
  ]);
  const lowStock = products.filter((p) => !(p.preorderEnabled && p.preorderMode === "ALWAYS") && p.stockQty <= p.lowStockAt);
  const lowSupplies = supplies.filter((s) => s.stockQty <= s.reorderLevel);
  return { pending, toPack, outForDelivery, todayDeliveries, openPreorders, lowStock, lowSupplies, openTickets, followUps, newLeads };
}

export function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}
