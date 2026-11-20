"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adjustStock, consumeSupply, recomputeProductCost, recordHarvest, recordPurchase } from "@/lib/stock";
import { parseDateKey } from "@/lib/dates";
import { numField, optNum, round2, str } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";

const refresh = () => {
  for (const p of ["/admin/production", "/admin/inventory", "/admin/supplies", "/admin"]) revalidatePath(p);
};

// ───── Production batches ─────
export async function createBatchAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const productId = str(fd, "productId");
  if (!productId) return { error: "Choose a product" };
  const startDate = parseDateKey(str(fd, "startDate")) ?? new Date();
  const count = await db.productionBatch.count();
  const code = str(fd, "code") || `B-${1000 + count + 1}`;
  if (await db.productionBatch.findUnique({ where: { code } })) return { error: `Batch code ${code} already exists` };
  await db.$transaction(async (tx) => {
    const b = await tx.productionBatch.create({
      data: {
        code,
        productId,
        startDate,
        expectedHarvest: parseDateKey(str(fd, "expectedHarvest")),
        bagCount: Math.round(numField(fd, "bagCount", 0)),
        substrate: str(fd, "substrate"),
        extraCost: round2(numField(fd, "extraCost", 0)),
        note: str(fd, "note"),
      },
    });
    for (let i = 0; i < 6; i++) {
      const item = str(fd, `usage_item_${i}`);
      const qty = numField(fd, `usage_qty_${i}`, 0);
      if (item && qty > 0) await consumeSupply(tx, { supplyItemId: item, qty, reason: "PRODUCTION", batchId: b.id, date: startDate, note: code });
    }
  });
  refresh();
  return { ok: true, message: `Batch ${code} created` };
}

export async function updateBatchAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const b = await db.productionBatch.update({
    where: { id },
    data: {
      status: str(fd, "status") || undefined,
      expectedHarvest: parseDateKey(str(fd, "expectedHarvest")),
      bagCount: Math.round(numField(fd, "bagCount", 0)),
      substrate: str(fd, "substrate"),
      extraCost: round2(numField(fd, "extraCost", 0)),
      note: str(fd, "note"),
    },
  });
  await recomputeProductCost(b.productId);
  refresh();
  revalidatePath(`/admin/production/${id}`);
  return { ok: true, message: "Batch updated" };
}

export async function batchUsageAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const batchId = str(fd, "batchId");
  const item = str(fd, "supplyItemId");
  const qty = numField(fd, "qty", 0);
  if (!item || qty <= 0) return { error: "Choose a supply and quantity" };
  const b = await db.productionBatch.findUniqueOrThrow({ where: { id: batchId } });
  await db.$transaction((tx) => consumeSupply(tx, { supplyItemId: item, qty, reason: "PRODUCTION", batchId, date: parseDateKey(str(fd, "date")) ?? new Date(), note: b.code }));
  await recomputeProductCost(b.productId);
  refresh();
  revalidatePath(`/admin/production/${batchId}`);
  return { ok: true, message: "Supply usage added to batch cost" };
}

export async function harvestAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const productId = str(fd, "productId");
  const qty = numField(fd, "qty", 0);
  if (!productId || qty <= 0) return { error: "Choose a product and enter the harvested amount" };
  await recordHarvest({
    productId,
    batchId: str(fd, "batchId") || null,
    date: parseDateKey(str(fd, "date")) ?? new Date(),
    qty,
    wasteQty: numField(fd, "wasteQty", 0),
    grade: str(fd, "grade") || "A",
    note: str(fd, "note"),
    by: a.name,
  });
  refresh();
  return { ok: true, message: `Harvest recorded: +${qty} added to stock` };
}

// ───── Inventory ─────
export async function adjustStockAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const productId = str(fd, "productId");
  const reason = str(fd, "reason") as "SPOILAGE" | "ADJUST" | "RETURN";
  let change = numField(fd, "change", 0);
  if (!change) return { error: "Enter an amount" };
  if (reason === "SPOILAGE") change = -Math.abs(change);
  await adjustStock({ productId, change, reason, note: str(fd, "note"), by: a.name });
  refresh();
  return { ok: true, message: reason === "SPOILAGE" ? "Spoilage recorded (counted as a loss)" : "Stock adjusted" };
}

// ───── Supplies ─────
export async function supplyItemAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const data = {
    name,
    nameBn: str(fd, "nameBn"),
    category: ["PRODUCTION", "PACKAGING", "OTHER"].includes(str(fd, "category")) ? str(fd, "category") : "OTHER",
    unit: str(fd, "unit") || "pcs",
    reorderLevel: numField(fd, "reorderLevel", 0),
  };
  if (id) await db.supplyItem.update({ where: { id }, data });
  else {
    const opening = numField(fd, "openingQty", 0);
    const cost = numField(fd, "openingCost", 0);
    await db.supplyItem.create({ data: { ...data, stockQty: opening, avgCost: opening > 0 ? round2(cost / opening) : round2(numField(fd, "unitCost", 0)) } });
  }
  refresh();
  return { ok: true, message: "Saved" };
}

export async function purchaseAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const supplyItemId = str(fd, "supplyItemId");
  const qty = numField(fd, "qty", 0);
  const totalCost = numField(fd, "totalCost", 0);
  if (!supplyItemId || qty <= 0 || totalCost < 0) return { error: "Choose an item, quantity and total cost" };
  await recordPurchase({ supplyItemId, supplierId: str(fd, "supplierId") || null, qty, totalCost, date: parseDateKey(str(fd, "date")) ?? new Date(), note: str(fd, "note") });
  refresh();
  return { ok: true, message: "Purchase recorded — stock and average cost updated" };
}

export async function supplyUseAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const supplyItemId = str(fd, "supplyItemId");
  const qty = numField(fd, "qty", 0);
  const reason = (["PRODUCTION", "PACKAGING", "WASTE", "ADJUST"].includes(str(fd, "reason")) ? str(fd, "reason") : "ADJUST") as "PRODUCTION" | "PACKAGING" | "WASTE" | "ADJUST";
  if (!supplyItemId || !qty) return { error: "Choose an item and quantity" };
  const batchId = str(fd, "batchId") || null;
  await db.$transaction((tx) => consumeSupply(tx, { supplyItemId, qty, reason, batchId, date: parseDateKey(str(fd, "date")) ?? new Date(), note: str(fd, "note") }));
  if (batchId) {
    const b = await db.productionBatch.findUnique({ where: { id: batchId } });
    if (b) await recomputeProductCost(b.productId);
  }
  refresh();
  return { ok: true, message: "Usage recorded" };
}

export async function supplierAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const data = { name, phone: str(fd, "phone"), address: str(fd, "address"), note: str(fd, "note") };
  if (id) await db.supplier.update({ where: { id }, data });
  else await db.supplier.create({ data });
  refresh();
  return { ok: true, message: "Supplier saved" };
}

export async function setCostAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const cost = optNum(fd, "costPerUnit");
  if (cost == null || cost < 0) return { error: "Enter a cost" };
  await db.product.update({ where: { id }, data: { costPerUnit: round2(cost), costMode: "MANUAL" } });
  refresh();
  return { ok: true, message: "Cost saved (manual)" };
}
