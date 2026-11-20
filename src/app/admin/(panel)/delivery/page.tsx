import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dateKey, fmtDate, parseDateKey, resolveRange, startOfDay } from "@/lib/dates";
import { directionsLink } from "@/lib/geo";
import { ORDER_STATUS } from "@/lib/constants";
import { num, round2, taka } from "@/lib/utils";
import { Card, Empty, PageHeader, RangeTabs, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { setStatusAction } from "../orders/actions";
import { assignRiderAction, riderAction, zoneAction } from "./actions";

export const metadata = { title: "Delivery" };

export default async function DeliveryPage({ searchParams }: { searchParams: Promise<{ date?: string; range?: string; from?: string; to?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const canEdit = admin.role !== "STAFF";
  const day = parseDateKey(sp.date) ?? startOfDay();
  const r = resolveRange(sp, "month");
  const [orders, riders, zones, payouts] = await Promise.all([
    db.order.findMany({
      where: { deliveryDate: { gte: day, lt: addDays(day, 1) }, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"] } },
      orderBy: [{ zoneName: "asc" }, { deliverySlot: "asc" }],
      include: { items: true, rider: true },
    }),
    db.rider.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.deliveryZone.findMany({ orderBy: { sortOrder: "asc" } }),
    db.order.groupBy({ by: ["riderId"], where: { deliveredAt: { gte: r.from, lt: r.to }, riderId: { not: null } }, _count: { _all: true }, _sum: { deliveryCost: true, collectedAmount: true } }),
  ]);
  const byZone = new Map<string, typeof orders>();
  for (const o of orders) byZone.set(o.zoneName || "—", [...(byZone.get(o.zoneName || "—") ?? []), o]);
  const toCollect = round2(orders.filter((o) => o.status !== "DELIVERED" && o.paymentStatus !== "PAID").reduce((a, o) => a + o.total, 0));
  const dk = dateKey(day);

  return (
    <>
      <PageHeader
        title="Delivery"
        description={`${fmtDate(day, { weekday: "long", day: "numeric", month: "long" })} · ${orders.length} deliveries · ${taka(toCollect)} cash to collect`}
        actions={
          <form className="flex items-center gap-2">
            <Link href={`/admin/delivery?date=${dateKey(addDays(day, -1))}`} className="btn btn-outline btn-sm rounded-lg">←</Link>
            <input type="date" name="date" defaultValue={dk} className="input input-sm w-40" aria-label="Delivery date" />
            <button className="btn btn-outline btn-sm rounded-lg">Go</button>
            <Link href={`/admin/delivery?date=${dateKey(addDays(day, 1))}`} className="btn btn-outline btn-sm rounded-lg">→</Link>
          </form>
        }
      />

      {orders.length === 0 ? (
        <Card>
          <Empty title="No deliveries scheduled for this day" />
        </Card>
      ) : (
        <div className="space-y-6">
          {[...byZone.entries()].map(([zone, list]) => (
            <Card key={zone} title={`${zone} · ${list.length}`} pad={false}>
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer & address</th>
                      <th>Slot</th>
                      <th>Status</th>
                      <th>Rider</th>
                      <th className="num">Collect</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                            {o.orderNo}
                          </Link>
                          <span className="block text-xs text-stone-500">{o.items.reduce((a, i) => a + i.qty, 0)} packs</span>
                        </td>
                        <td className="max-w-xs">
                          {o.name}{" "}
                          <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 text-xs text-brand">
                            <Phone className="h-3 w-3" />
                            {o.phone}
                          </a>
                          <span className="block text-xs text-stone-500">
                            {o.addressLine}
                            {o.landmark && ` · ${o.landmark}`}
                          </span>
                          {o.lat != null && o.lng != null && (
                            <a href={directionsLink(o.lat, o.lng)} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                              <MapPin className="h-3 w-3" /> Directions
                            </a>
                          )}
                        </td>
                        <td className="text-xs">{o.deliverySlot.split("(").pop()?.replace(")", "") || o.deliverySlot}</td>
                        <td>
                          <StatusBadge map={ORDER_STATUS} value={o.status} />
                        </td>
                        <td>
                          <form action={assignRiderAction} className="flex gap-1">
                            <input type="hidden" name="id" value={o.id} />
                            <select name="riderId" defaultValue={o.riderId ?? ""} className="input input-sm w-36 py-1" aria-label="Rider">
                              <option value="">—</option>
                              {riders.filter((x) => x.isActive).map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.name}
                                </option>
                              ))}
                            </select>
                            <button className="btn btn-outline btn-sm rounded-lg py-1">Set</button>
                          </form>
                        </td>
                        <td className="num font-medium">{o.paymentStatus === "PAID" ? <span className="text-emerald-700">paid</span> : taka(o.total)}</td>
                        <td className="text-right">
                          {(o.status === "CONFIRMED" || o.status === "PROCESSING") && (
                            <form action={setStatusAction}>
                              <input type="hidden" name="id" value={o.id} />
                              <input type="hidden" name="to" value="OUT_FOR_DELIVERY" />
                              <button className="btn btn-outline btn-sm whitespace-nowrap rounded-lg">Send out</button>
                            </form>
                          )}
                          {o.status === "OUT_FOR_DELIVERY" && (
                            <form action={setStatusAction}>
                              <input type="hidden" name="id" value={o.id} />
                              <input type="hidden" name="to" value="DELIVERED" />
                              <button className="btn btn-primary btn-sm whitespace-nowrap rounded-lg">Delivered</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </Card>
          ))}
        </div>
      )}

      <Card title="Rider payouts & cash collected" className="mt-8" actions={<RangeTabs base="/admin/delivery" current={r.key} params={{ date: sp.date }} keys={["7d", "month", "lastmonth"]} from={sp.from} to={sp.to} />} pad={false}>
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Rider</th>
                <th className="num">Deliveries</th>
                <th className="num">Delivery cost (to pay)</th>
                <th className="num">Cash collected</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.riderId}>
                  <td>{riders.find((x) => x.id === p.riderId)?.name ?? "—"}</td>
                  <td className="num">{p._count._all}</td>
                  <td className="num">{taka(p._sum.deliveryCost ?? 0)}</td>
                  <td className="num">{taka(p._sum.collectedAmount ?? 0)}</td>
                </tr>
              ))}
              {!payouts.length && (
                <tr>
                  <td colSpan={4} className="text-center text-stone-500">
                    No delivered orders with riders in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      {canEdit && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card title="Riders & couriers">
            <div className="space-y-2">
              {riders.map((x) => (
                <div key={x.id} className="flex items-center gap-1">
                <ActionForm action={riderAction} className="grid flex-1 grid-cols-2 items-center gap-2 sm:grid-cols-[1.3fr_1fr_1fr_80px_auto_auto]">
                  <input type="hidden" name="id" value={x.id} />
                  <input name="name" defaultValue={x.name} className="input input-sm" aria-label="Name" />
                  <input name="phone" defaultValue={x.phone} className="input input-sm" aria-label="Phone" />
                  <select name="type" defaultValue={x.type} className="input input-sm" aria-label="Type">
                    <option value="INHOUSE">In-house</option>
                    <option value="COURIER">Courier</option>
                  </select>
                  <input name="costPerDelivery" type="number" defaultValue={x.costPerDelivery} className="input input-sm" aria-label="Cost per delivery" title="Cost per delivery (৳)" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name="isActive" defaultChecked={x.isActive} /> Active
                  </label>
                  <Submit variant="outline">Save</Submit>
                </ActionForm>
                <DeleteButton type="rider" id={x.id} title={`Delete ${x.name}?`} description="Past orders keep their delivery cost but lose the rider name." />
                </div>
              ))}
              <ActionForm action={riderAction} resetOnSuccess className="grid grid-cols-2 items-center gap-2 border-t border-stone-100 pt-3 sm:grid-cols-[1.3fr_1fr_1fr_80px_auto]">
                <input name="name" placeholder="New rider / courier" className="input input-sm" />
                <input name="phone" placeholder="Phone" className="input input-sm" />
                <select name="type" className="input input-sm">
                  <option value="INHOUSE">In-house</option>
                  <option value="COURIER">Courier</option>
                </select>
                <input name="costPerDelivery" type="number" placeholder="৳/trip" className="input input-sm" />
                <Submit>Add</Submit>
              </ActionForm>
            </div>
          </Card>
          <Card title="Delivery areas & charges">
            <p className="mb-3 text-xs text-stone-500">Charge = what the customer pays. Our cost = estimated rider cost used for profit (replaced by the rider&apos;s rate when assigned).</p>
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center gap-1">
                <ActionForm action={zoneAction} className="grid flex-1 grid-cols-2 items-center gap-2 sm:grid-cols-[1.2fr_1.2fr_70px_70px_56px_auto_auto]">
                  <input type="hidden" name="id" value={z.id} />
                  <input name="nameEn" defaultValue={z.nameEn} className="input input-sm" aria-label="Area (English)" />
                  <input name="nameBn" defaultValue={z.nameBn} className="input input-sm" aria-label="Area (Bangla)" />
                  <input name="charge" type="number" defaultValue={z.charge} className="input input-sm" aria-label="Customer charge" title="Customer charge ৳" />
                  <input name="riderCost" type="number" defaultValue={z.riderCost} className="input input-sm" aria-label="Our cost" title="Our cost ৳" />
                  <input name="sortOrder" type="number" defaultValue={z.sortOrder} className="input input-sm" aria-label="Order" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name="isActive" defaultChecked={z.isActive} /> On
                  </label>
                  <Submit variant="outline">Save</Submit>
                </ActionForm>
                <DeleteButton type="zone" id={z.id} title={`Delete area ${z.nameEn}?`} description="Customers can no longer choose it. Past orders keep the area name. To pause it instead, untick On." />
                </div>
              ))}
            </div>
            <ActionForm action={zoneAction} resetOnSuccess className="mt-3 grid grid-cols-2 items-center gap-2 border-t border-stone-100 pt-3 sm:grid-cols-[1.2fr_1.2fr_70px_70px_auto]">
              <input name="nameEn" placeholder="New area" className="input input-sm" />
              <input name="nameBn" placeholder="এলাকা" className="input input-sm" />
              <input name="charge" type="number" placeholder="৳" className="input input-sm" />
              <input name="riderCost" type="number" placeholder="cost" className="input input-sm" />
              <Submit>Add</Submit>
            </ActionForm>
            <p className="mt-3 text-xs text-stone-500">{num(zones.filter((z) => z.isActive).length)} active areas. The map delivery radius is set in Settings → Delivery.</p>
          </Card>
        </div>
      )}
    </>
  );
}
