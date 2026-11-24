"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { boolField, numField, round2, str } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";

export async function assignRiderAction(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const riderId = str(fd, "riderId") || null;
  const rider = riderId ? await db.rider.findUnique({ where: { id: riderId } }) : null;
  const o = await db.order.findUniqueOrThrow({ where: { id } });
  await db.order.update({ where: { id }, data: { riderId, ...(rider && rider.costPerDelivery > 0 ? { deliveryCost: round2(rider.costPerDelivery) } : {}) } });
  await db.orderEvent.create({ data: { orderId: id, status: o.status, note: rider ? `Rider: ${rider.name}` : "Rider removed", by: a.name } });
  revalidatePath("/admin/delivery");
}

export async function riderAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const data = { name, phone: str(fd, "phone"), type: str(fd, "type") === "COURIER" ? "COURIER" : "INHOUSE", costPerDelivery: round2(numField(fd, "costPerDelivery", 0)), isActive: id ? boolField(fd, "isActive") : true };
  if (id) await db.rider.update({ where: { id }, data });
  else await db.rider.create({ data });
  revalidatePath("/admin/delivery");
  return { ok: true, message: "Saved" };
}

export async function zoneAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const nameEn = str(fd, "nameEn");
  if (!nameEn) return { error: "Area name is required" };
  const data = {
    nameEn,
    nameBn: str(fd, "nameBn") || nameEn,
    region: str(fd, "region").slice(0, 60),
    charge: round2(numField(fd, "charge", 0)),
    riderCost: round2(numField(fd, "riderCost", 0)),
    sortOrder: numField(fd, "sortOrder", 0),
    isActive: id ? boolField(fd, "isActive") : true,
  };
  if (id) await db.deliveryZone.update({ where: { id }, data });
  else await db.deliveryZone.create({ data });
  revalidatePath("/admin/delivery");
  return { ok: true, message: "Saved" };
}
