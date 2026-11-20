import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateKey, fmtDate, toLocalDateTimeValue } from "@/lib/dates";
import { ORDER_STATUS } from "@/lib/constants";
import { num, round3, taka } from "@/lib/utils";
import { Badge, Card, Empty, PageHeader, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { preorderSettingsAction } from "../products/actions";
import { harvestReadyAction, packSelectedAction } from "./actions";

export const metadata = { title: "Pre-orders" };

export default async function PreordersPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const canEdit = admin.role !== "STAFF";
  const [products, open] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, orderBy: [{ preorderEnabled: "desc" }, { sortOrder: "asc" }] }),
    db.order.findMany({ where: { type: "PREORDER", status: { in: ["PENDING", "CONFIRMED"] } }, orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }], include: { items: true } }),
  ]);
  const byDate = new Map<string, typeof open>();
  for (const o of open) {
    const k = o.deliveryDate ? dateKey(o.deliveryDate) : "No date";
    byDate.set(k, [...(byDate.get(k) ?? []), o]);
  }
  const need = new Map<string, number>();
  for (const o of open) for (const i of o.items) if (i.productId) need.set(i.productId, (need.get(i.productId) ?? 0) + i.unitAmount * i.qty);

  return (
    <>
      <PageHeader title="Pre-orders" description="Turn pre-order on per product, set the harvest date and limit, then notify and pack bookings when the harvest is in." />
      {sp.error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{sp.error}</p>}
      {sp.done && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{sp.done}</p>}

      <Card title="Pre-order settings by product" pad={false}>
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Settings</th>
                <th className="num">Booked</th>
                <th className="num">In stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="w-48 align-top">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.nameEn}
                    </Link>
                    <span className="block text-xs text-stone-500">{p.nameBn}</span>
                    {p.preorderEnabled ? <Badge tone="green" className="mt-1">On</Badge> : <Badge className="mt-1">Off</Badge>}
                  </td>
                  <td>
                    {canEdit ? (
                      <ActionForm action={preorderSettingsAction} className="grid grid-cols-2 items-end gap-2 lg:grid-cols-[auto_1.4fr_1fr_1.2fr_0.8fr_1.4fr_auto]">
                        <input type="hidden" name="id" value={p.id} />
                        <label className="flex items-center gap-1.5 self-center text-xs font-medium">
                          <input type="checkbox" name="preorderEnabled" defaultChecked={p.preorderEnabled} /> Enable
                        </label>
                        <label className="block">
                          <span className="label text-[11px]">When</span>
                          <select name="preorderMode" defaultValue={p.preorderMode} className="input input-sm">
                            <option value="OUT_OF_STOCK">When sold out</option>
                            <option value="ALWAYS">Pre-order only</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="label text-[11px]">Harvest date</span>
                          <input type="date" name="preorderDate" defaultValue={p.preorderDate ? dateKey(p.preorderDate) : ""} className="input input-sm" />
                        </label>
                        <label className="block">
                          <span className="label text-[11px]">Closes</span>
                          <input type="datetime-local" name="preorderCutoff" defaultValue={toLocalDateTimeValue(p.preorderCutoff)} className="input input-sm" />
                        </label>
                        <label className="block">
                          <span className="label text-[11px]">Limit ({p.stockUnit})</span>
                          <input type="number" step="0.1" name="preorderCap" defaultValue={p.preorderCap ?? ""} placeholder="∞" className="input input-sm" />
                        </label>
                        <label className="block">
                          <span className="label text-[11px]">Note</span>
                          <input name="preorderNote" defaultValue={p.preorderNote} className="input input-sm" />
                        </label>
                        <Submit variant="outline">Save</Submit>
                      </ActionForm>
                    ) : (
                      <span className="text-sm text-stone-600">
                        {p.preorderEnabled ? `${p.preorderMode === "ALWAYS" ? "Pre-order only" : "When sold out"} · ${p.preorderDate ? fmtDate(p.preorderDate) : "no date"}` : "Off"}
                      </span>
                    )}
                  </td>
                  <td className="num align-top">
                    {num(round3(p.preorderBooked))} {p.stockUnit}
                    {p.preorderCap != null && <span className="block text-xs text-stone-500">of {num(p.preorderCap)}</span>}
                  </td>
                  <td className="num align-top">
                    <span className={need.get(p.id) && p.stockQty < (need.get(p.id) ?? 0) ? "font-semibold text-amber-700" : ""}>
                      {num(round3(p.stockQty))} {p.stockUnit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-stone-500">Open bookings</h2>
      {open.length === 0 ? (
        <Card>
          <Empty title="No open pre-orders">New pre-orders will appear here grouped by harvest date.</Empty>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...byDate.entries()].map(([date, orders]) => {
            const totals = new Map<string, { name: string; amount: number; unit: string }>();
            for (const o of orders) for (const i of o.items) {
              const t = totals.get(i.nameEn) ?? { name: i.nameEn, amount: 0, unit: "" };
              t.amount += i.unitAmount * i.qty;
              totals.set(i.nameEn, t);
            }
            return (
              <Card
                key={date}
                title={`Harvest / delivery: ${date === "No date" ? date : fmtDate(new Date(`${date}T00:00:00+06:00`), { weekday: "long", day: "numeric", month: "long" })} · ${orders.length} orders`}
                pad={false}
              >
                <div className="flex flex-wrap gap-2 border-b border-stone-200 px-5 py-3 text-sm">
                  <span className="text-stone-500">Total needed:</span>
                  {[...totals.values()].map((t) => (
                    <Badge key={t.name} tone="brand">
                      {t.name}: {num(round3(t.amount))}
                    </Badge>
                  ))}
                </div>
                <ActionForm action={harvestReadyAction}>
                  <TableWrap>
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="w-8"></th>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th className="num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <input type="checkbox" name="ids" value={o.id} defaultChecked aria-label={`Select ${o.orderNo}`} />
                            </td>
                            <td>
                              <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                                {o.orderNo}
                              </Link>
                            </td>
                            <td>
                              {o.name}
                              <span className="block text-xs text-stone-500">{o.phone}</span>
                            </td>
                            <td className="text-xs">{o.items.map((i) => `${i.nameEn} ${i.variantLabel.split(" · ").pop()} ×${i.qty}`).join(", ")}</td>
                            <td>
                              <StatusBadge map={ORDER_STATUS} value={o.status} />
                            </td>
                            <td className="num">{taka(o.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                  <div className="flex flex-wrap items-end gap-3 border-t border-stone-200 px-5 py-4">
                    <label className="block min-w-64 flex-1">
                      <span className="label">Message in the email (optional)</span>
                      <input name="message" className="input input-sm" placeholder="e.g. Your mushrooms will arrive between 2–5 PM" />
                    </label>
                    <Submit>Email “harvest ready” to selected</Submit>
                    <button formAction={packSelectedAction} className="btn btn-outline btn-sm rounded-lg">
                      Move selected to packing (takes stock)
                    </button>
                  </div>
                </ActionForm>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
