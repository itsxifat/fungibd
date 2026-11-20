"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/orders";
import { notifyPreorderReady } from "@/lib/email/notify";
import { str } from "@/lib/utils";
import type { ActionState } from "@/components/admin/client";

/** Confirms the selected pre-orders and emails customers that their harvest is ready. */
export async function harvestReadyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  const ids = fd.getAll("ids").map(String);
  if (!ids.length) return { error: "Select at least one order" };
  const message = str(fd, "message");
  let sent = 0;
  for (const id of ids) {
    const o = await db.order.findUnique({ where: { id } });
    if (!o || o.type !== "PREORDER") continue;
    if (o.status === "PENDING") await changeOrderStatus(id, "CONFIRMED", { by: a.name, note: "Harvest ready", notify: false });
    await notifyPreorderReady(id, message);
    await db.orderEvent.create({ data: { orderId: id, status: "CONFIRMED", note: "Harvest-ready email sent", by: a.name } });
    sent++;
  }
  revalidatePath("/admin/preorders");
  return { ok: true, message: `${sent} customers notified` };
}

/** Moves selected pre-orders to Packing (stock is taken from inventory at this point). */
export async function packSelectedAction(fd: FormData) {
  const a = await requireAdmin();
  const ids = fd.getAll("ids").map(String);
  const errors: string[] = [];
  let done = 0;
  for (const id of ids) {
    const r = await changeOrderStatus(id, "PROCESSING", { by: a.name });
    if (r.ok) done++;
    else errors.push(r.error);
  }
  revalidatePath("/admin/preorders");
  const msg = errors.length ? `${done} moved to packing. ${[...new Set(errors)].join(" ")}` : `${done} orders moved to packing`;
  redirect(`/admin/preorders?${errors.length ? "error" : "done"}=${encodeURIComponent(msg)}`);
}
