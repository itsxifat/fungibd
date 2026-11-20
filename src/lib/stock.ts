import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { round2, round3 } from "./utils";

type Tx = Prisma.TransactionClient;

/** Recalculate production cost per kg from the latest batches (if product cost mode is AUTO). */
export async function recomputeProductCost(productId: string, tx: Tx = db) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product || product.costMode !== "AUTO") return;
  const batches = await tx.productionBatch.findMany({
    where: { productId, status: { not: "FAILED" } },
    orderBy: { startDate: "desc" },
    take: 6,
    include: { harvests: true, usages: true },
  });
  let cost = 0;
  let kg = 0;
  for (const b of batches) {
    const harvested = b.harvests.reduce((a, h) => a + h.qty, 0);
    if (harvested <= 0) continue;
    cost += b.usages.reduce((a, u) => a + u.totalCost, 0) + b.extraCost;
    kg += harvested;
  }
  if (kg > 0) await tx.product.update({ where: { id: productId }, data: { costPerUnit: round2(cost / kg) } });
}

/** Batch cost summary: supplies used + direct costs, harvested kg and cost per kg. */
export function batchSummary(b: { extraCost: number; usages: { totalCost: number }[]; harvests: { qty: number; wasteQty: number }[] }) {
  const supplies = round2(b.usages.reduce((a, u) => a + u.totalCost, 0));
  const total = round2(supplies + b.extraCost);
  const kg = round3(b.harvests.reduce((a, h) => a + h.qty, 0));
  const waste = round3(b.harvests.reduce((a, h) => a + h.wasteQty, 0));
  return { supplies, total, kg, waste, costPerKg: kg > 0 ? round2(total / kg) : 0 };
}

export async function recordHarvest(input: { productId: string; batchId?: string | null; date: Date; qty: number; wasteQty: number; grade: string; note: string; by: string }) {
  await db.$transaction(async (tx) => {
    const h = await tx.harvest.create({
      data: { productId: input.productId, batchId: input.batchId || null, date: input.date, qty: input.qty, wasteQty: input.wasteQty, grade: input.grade, note: input.note },
    });
    if (input.batchId) {
      const b = await tx.productionBatch.findUnique({ where: { id: input.batchId } });
      if (b?.status === "GROWING") await tx.productionBatch.update({ where: { id: b.id }, data: { status: "HARVESTING" } });
    }
    await recomputeProductCost(input.productId, tx);
    const p = await tx.product.update({ where: { id: input.productId }, data: { stockQty: { increment: input.qty } } });
    await tx.stockMovement.create({
      data: { productId: input.productId, change: input.qty, reason: "HARVEST", unitCost: p.costPerUnit, refId: h.id, note: input.note || `Grade ${input.grade}`, by: input.by },
    });
  });
}

export async function adjustStock(input: { productId: string; change: number; reason: "SPOILAGE" | "ADJUST" | "RETURN"; note: string; by: string }) {
  await db.$transaction(async (tx) => {
    const p = await tx.product.update({ where: { id: input.productId }, data: { stockQty: { increment: input.change } } });
    await tx.stockMovement.create({ data: { productId: p.id, change: input.change, reason: input.reason, unitCost: p.costPerUnit, note: input.note, by: input.by } });
  });
}

/** Buying supplies increases stock and updates the weighted average cost. */
export async function recordPurchase(input: { supplyItemId: string; supplierId?: string | null; qty: number; totalCost: number; date: Date; note: string }) {
  await db.$transaction(async (tx) => {
    const item = await tx.supplyItem.findUniqueOrThrow({ where: { id: input.supplyItemId } });
    const unitCost = input.qty > 0 ? input.totalCost / input.qty : 0;
    const existing = Math.max(0, item.stockQty);
    const newQty = existing + input.qty;
    const avg = newQty > 0 ? (existing * item.avgCost + input.totalCost) / newQty : unitCost;
    await tx.supplyPurchase.create({
      data: { supplyItemId: item.id, supplierId: input.supplierId || null, qty: input.qty, unitCost: round2(unitCost), totalCost: round2(input.totalCost), date: input.date, note: input.note },
    });
    await tx.supplyItem.update({ where: { id: item.id }, data: { stockQty: round3(item.stockQty + input.qty), avgCost: round2(avg) } });
  });
}

/** Using supplies (for a grow batch, packaging or waste) reduces stock at average cost. */
export async function consumeSupply(
  tx: Tx,
  input: { supplyItemId: string; qty: number; reason: "PRODUCTION" | "PACKAGING" | "WASTE" | "ADJUST"; batchId?: string | null; orderId?: string | null; date?: Date; note?: string },
) {
  const item = await tx.supplyItem.findUniqueOrThrow({ where: { id: input.supplyItemId } });
  const totalCost = round2(item.avgCost * input.qty);
  await tx.supplyUsage.create({
    data: {
      supplyItemId: item.id,
      qty: input.qty,
      unitCost: item.avgCost,
      totalCost,
      reason: input.reason,
      batchId: input.batchId || null,
      orderId: input.orderId || null,
      date: input.date ?? new Date(),
      note: input.note ?? "",
    },
  });
  await tx.supplyItem.update({ where: { id: item.id }, data: { stockQty: round3(item.stockQty - input.qty) } });
  return totalCost;
}
