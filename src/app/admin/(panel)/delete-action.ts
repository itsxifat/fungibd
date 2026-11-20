"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteOrder } from "@/lib/orders";
import { recomputeProductCost } from "@/lib/stock";
import { round2, round3, str } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";

const MGR = ["OWNER", "MANAGER"] as const;

/**
 * One place for every delete in the admin panel. Each case reverses side-effects so stock,
 * supplies and costs stay correct. Returns where to go next (for deletes from a detail page).
 */
export async function deleteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const type = str(fd, "type");
  const id = str(fd, "id");
  const redirect = str(fd, "redirectTo") || undefined;
  const admin = await requireAdmin(type === "activity" || type === "address" ? undefined : [...MGR]);
  try {
    switch (type) {
      case "order":
        await deleteOrder(id, admin.name);
        break;
      case "customer": {
        const orders = await db.order.findMany({ where: { customerId: id }, select: { id: true } });
        for (const o of orders) await deleteOrder(o.id, admin.name);
        await db.customer.delete({ where: { id } });
        break;
      }
      case "address":
        await db.address.delete({ where: { id } });
        break;
      case "product":
        await db.product.delete({ where: { id } });
        break;
      case "category":
        await db.category.delete({ where: { id } });
        break;
      case "lead":
        await db.lead.delete({ where: { id } });
        break;
      case "activity":
        await db.activity.delete({ where: { id } });
        break;
      case "ticket":
        await db.ticket.delete({ where: { id } });
        break;
      case "ticketMessage":
        await db.ticketMessage.delete({ where: { id } });
        break;
      case "campaign":
        await db.campaign.delete({ where: { id } });
        break;
      case "coupon":
        await db.coupon.delete({ where: { id } });
        break;
      case "review":
        await db.review.delete({ where: { id } });
        break;
      case "expense":
        await db.expense.delete({ where: { id } });
        break;
      case "rider":
        await db.rider.delete({ where: { id } });
        break;
      case "zone":
        await db.deliveryZone.delete({ where: { id } });
        break;
      case "supplier":
        await db.supplier.delete({ where: { id } });
        break;
      case "harvest": {
        const h = await db.harvest.findUniqueOrThrow({ where: { id }, include: { product: true } });
        await db.$transaction(async (tx) => {
          await tx.product.update({ where: { id: h.productId }, data: { stockQty: { decrement: h.qty } } });
          await tx.stockMovement.create({ data: { productId: h.productId, change: -h.qty, reason: "ADJUST", unitCost: h.product.costPerUnit, note: "Harvest record deleted", by: admin.name } });
          await tx.harvest.delete({ where: { id } });
        });
        await recomputeProductCost(h.productId);
        break;
      }
      case "batch": {
        const b = await db.productionBatch.findUniqueOrThrow({ where: { id }, include: { usages: true } });
        await db.$transaction(async (tx) => {
          for (const u of b.usages) await tx.supplyItem.update({ where: { id: u.supplyItemId }, data: { stockQty: { increment: u.qty } } });
          await tx.supplyUsage.deleteMany({ where: { batchId: id } });
          await tx.productionBatch.delete({ where: { id } });
        });
        await recomputeProductCost(b.productId);
        break;
      }
      case "supplyItem":
        await db.productVariant.updateMany({ where: { packagingItemId: id }, data: { packagingItemId: null } });
        await db.supplyItem.delete({ where: { id } });
        break;
      case "purchase": {
        const p = await db.supplyPurchase.findUniqueOrThrow({ where: { id } });
        await db.$transaction(async (tx) => {
          await tx.supplyPurchase.delete({ where: { id } });
          const item = await tx.supplyItem.findUniqueOrThrow({ where: { id: p.supplyItemId } });
          const rest = await tx.supplyPurchase.findMany({ where: { supplyItemId: p.supplyItemId } });
          const qty = rest.reduce((a, x) => a + x.qty, 0);
          const cost = rest.reduce((a, x) => a + x.totalCost, 0);
          await tx.supplyItem.update({ where: { id: item.id }, data: { stockQty: round3(item.stockQty - p.qty), ...(qty > 0 ? { avgCost: round2(cost / qty) } : {}) } });
        });
        break;
      }
      case "usage": {
        const u = await db.supplyUsage.findUniqueOrThrow({ where: { id }, include: { batch: true } });
        await db.$transaction(async (tx) => {
          await tx.supplyItem.update({ where: { id: u.supplyItemId }, data: { stockQty: { increment: u.qty } } });
          if (u.orderId && u.reason === "PACKAGING") {
            const o = await tx.order.findUnique({ where: { id: u.orderId } });
            if (o) await tx.order.update({ where: { id: o.id }, data: { packagingCost: round2(Math.max(0, o.packagingCost - u.totalCost)) } });
          }
          await tx.supplyUsage.delete({ where: { id } });
        });
        if (u.batch) await recomputeProductCost(u.batch.productId);
        break;
      }
      case "user": {
        await requireAdmin(["OWNER"]);
        if (id === admin.id) return { error: "You can't delete your own account." };
        await db.adminUser.delete({ where: { id } });
        break;
      }
      default:
        return { error: "Unknown item" };
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("Foreign key") || msg.includes("violates")) return { error: "This item is still used somewhere else and can't be deleted." };
    console.error("[delete]", type, e);
    return { error: "Could not delete. Please try again." };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: "Deleted", redirect };
}
