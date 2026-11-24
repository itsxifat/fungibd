"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus, placeOrder } from "@/lib/orders";
import { parseDateKey } from "@/lib/dates";
import { boolField, numField, round2, str } from "@/lib/utils";
import { background, notifyOrderStatus } from "@/lib/email/notify";
import type { OrderStatus } from "@/lib/constants";
import type { ActionState } from "@/components/admin/client";

export async function setStatusAction(fd: FormData) {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const to = str(fd, "to") as OrderStatus;
  const res = await changeOrderStatus(id, to, {
    by: a.name,
    note: str(fd, "note"),
    cancelReason: str(fd, "reason"),
    restock: boolField(fd, "restock"),
    notify: !boolField(fd, "silent"),
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  if (!res.ok) redirect(`/admin/orders/${id}?error=${encodeURIComponent(res.error)}`);
}

export async function statusFormAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const res = await changeOrderStatus(id, str(fd, "to") as OrderStatus, {
    by: a.name,
    note: str(fd, "note"),
    cancelReason: str(fd, "reason"),
    restock: boolField(fd, "restock"),
    notify: !boolField(fd, "silent"),
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return res.ok ? { ok: true, message: "Status updated" } : { error: res.error };
}

export async function updateDeliveryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const riderId = str(fd, "riderId") || null;
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  let deliveryCost = numField(fd, "deliveryCost", order.deliveryCost);
  if (riderId && riderId !== order.riderId && str(fd, "deliveryCost") === String(order.deliveryCost)) {
    const rider = await db.rider.findUnique({ where: { id: riderId } });
    if (rider && rider.costPerDelivery > 0) deliveryCost = rider.costPerDelivery;
  }
  await db.order.update({
    where: { id },
    data: {
      riderId,
      deliveryDate: parseDateKey(str(fd, "deliveryDate")) ?? order.deliveryDate,
      deliverySlot: str(fd, "deliverySlot"),
      addressLine: str(fd, "addressLine") || order.addressLine,
      landmark: str(fd, "landmark"),
      deliveryCost: round2(deliveryCost),
      packagingCost: round2(numField(fd, "packagingCost", order.packagingCost)),
      internalNote: str(fd, "internalNote"),
    },
  });
  if (riderId !== order.riderId) await db.orderEvent.create({ data: { orderId: id, status: order.status, note: riderId ? "Rider assigned" : "Rider removed", by: a.name } });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Saved" };
}

export async function paymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const id = str(fd, "id");
  const paid = str(fd, "paymentStatus") === "PAID";
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  await db.order.update({
    where: { id },
    data: { paymentStatus: paid ? "PAID" : "UNPAID", paidAt: paid ? order.paidAt ?? new Date() : null, collectedAmount: paid ? round2(numField(fd, "collectedAmount", order.total)) : 0 },
  });
  await db.orderEvent.create({ data: { orderId: id, status: order.status, note: paid ? `Cash collected ৳${numField(fd, "collectedAmount", order.total)}` : "Marked unpaid", by: a.name } });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Payment updated" };
}

export async function resendEmailAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const o = await db.order.findUniqueOrThrow({ where: { id } });
  background(notifyOrderStatus(id, o.status as OrderStatus));
  revalidatePath(`/admin/orders/${id}`);
}

export async function createManualOrderAction(input: {
  name: string;
  phone: string;
  email: string;
  zoneId: string;
  addressLine: string;
  landmark: string;
  deliveryDate: string;
  deliverySlot: string;
  note: string;
  internalNote: string;
  couponCode: string;
  source: string;
  lines: { variantId: string; qty: number }[];
  confirm: boolean;
  customerId?: string;
}) {
  const a = await requireAdmin();
  const res = await placeOrder({ ...input, lat: null, lng: null, isAdmin: true, by: a.name });
  if (!res.ok) return { ok: false as const, error: res.error };
  if (input.confirm) for (const o of res.orders) await changeOrderStatus(o.id, "CONFIRMED", { by: a.name, note: "Confirmed when created" });
  revalidatePath("/admin/orders");
  return { ok: true as const, id: res.orders[0].id };
}
