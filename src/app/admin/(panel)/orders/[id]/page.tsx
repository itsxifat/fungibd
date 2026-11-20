import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Mail, MessageCircle, Navigation, Phone, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NEXT_STATUS, ORDER_SOURCES, ORDER_STATUS, ORDER_TYPE, type OrderStatus } from "@/lib/constants";
import { dateKey, fmtDate, fmtDateTime } from "@/lib/dates";
import { directionsLink } from "@/lib/geo";
import { pct, round2, taka } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { Badge, Card, PageHeader, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { paymentAction, resendEmailAction, statusFormAction, updateDeliveryAction } from "../actions";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [o, riders, s] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, events: { orderBy: { createdAt: "asc" } }, customer: true, rider: true } }),
    db.rider.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getSettings(),
  ]);
  if (!o) notFound();
  const emails = await db.emailLog.findMany({ where: { refId: o.id }, orderBy: { createdAt: "desc" }, take: 10 });
  const st = o.status as OrderStatus;
  const next = NEXT_STATUS[st];
  const revenue = round2(o.subtotal - o.discount + o.deliveryCharge);
  const profit = round2(revenue - o.itemsCost - o.packagingCost - o.deliveryCost);
  const showMoney = admin.role !== "STAFF";
  const phone88 = `88${o.phone}`;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${o.orderNo}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge map={ORDER_STATUS} value={o.status} />
            {o.type === "PREORDER" && <StatusBadge map={ORDER_TYPE} value={o.type} />}
            <span>
              Placed {fmtDateTime(o.createdAt)} via {ORDER_SOURCES[o.source as keyof typeof ORDER_SOURCES] ?? o.source}
            </span>
            {o.checkoutGroup && <Badge tone="gray">Split delivery</Badge>}
          </span>
        }
        actions={
          <>
            <Link href={`/admin/orders/${o.id}/print`} target="_blank" className="btn btn-outline btn-sm rounded-xl bg-white">
              <Printer className="h-4 w-4" /> Packing slip
            </Link>
            {showMoney && (
              <DeleteButton
                type="order"
                id={o.id}
                label="Delete"
                redirectTo="/admin/orders"
                title={`Delete order ${o.orderNo}?`}
                description="The order is removed permanently. Stock, pre-order bookings, packaging and coupon use are put back automatically. To keep a record, cancel the order instead."
              />
            )}
          </>
        }
      />
      {sp.error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{sp.error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Status actions */}
          {next.length > 0 && (
            <Card title="Next step">
              <div className="flex flex-wrap items-start gap-3">
                {next
                  .filter((n) => n !== "CANCELLED" && n !== "RETURNED")
                  .map((n) => (
                    <ActionForm key={n} action={statusFormAction}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="to" value={n} />
                      <Submit>Mark as {ORDER_STATUS[n].en.toLowerCase()}</Submit>
                    </ActionForm>
                  ))}
              </div>
              <p className="mt-3 text-xs text-stone-500">
                {o.type === "PREORDER" && !o.stockDeducted
                  ? "Pre-order: stock is taken from inventory when you mark it Packing (record the harvest first)."
                  : "Packing uses packaging supplies automatically. The customer is emailed on Confirmed, Out for delivery, Delivered and Cancelled."}
              </p>
              <div className="mt-5 grid gap-4 border-t border-stone-100 pt-5 md:grid-cols-2">
                {next.includes("CANCELLED") && (
                  <ActionForm action={statusFormAction} className="space-y-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="to" value="CANCELLED" />
                    <label className="label" htmlFor="reason">
                      Cancel order
                    </label>
                    <input id="reason" name="reason" className="input input-sm" placeholder="Reason (shown to customer)" required />
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input type="checkbox" name="silent" /> Don&apos;t email the customer
                    </label>
                    <Submit variant="outline">Cancel order</Submit>
                  </ActionForm>
                )}
                {next.includes("RETURNED") && (
                  <ActionForm action={statusFormAction} className="space-y-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="to" value="RETURNED" />
                    <label className="label" htmlFor="rnote">
                      Returned / refused at door
                    </label>
                    <input id="rnote" name="note" className="input input-sm" placeholder="Note" />
                    <label className="flex items-center gap-2 text-xs text-stone-600">
                      <input type="checkbox" name="restock" /> Put mushrooms back in stock (otherwise counted as a loss)
                    </label>
                    <Submit variant="outline">Mark returned</Submit>
                  </ActionForm>
                )}
              </div>
            </Card>
          )}

          {/* Items */}
          <Card title="Items" pad={false}>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Price</th>
                    <th className="num">Qty</th>
                    <th className="num">Total</th>
                    {showMoney && <th className="num">Cost</th>}
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.nameEn} <span className="text-stone-500">· {i.nameBn}</span>
                        <span className="block text-xs text-stone-500">
                          {i.variantLabel}
                          {i.isPreorder && " · pre-order"}
                        </span>
                      </td>
                      <td className="num">{taka(i.unitPrice)}</td>
                      <td className="num">{i.qty}</td>
                      <td className="num">{taka(i.lineTotal)}</td>
                      {showMoney && <td className="num text-stone-500">{taka(i.unitCost * i.qty)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="grid gap-6 border-t border-stone-200 p-5 md:grid-cols-2">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{taka(o.subtotal)}</dd></div>
                {o.discount > 0 && <div className="flex justify-between"><dt className="text-stone-500">Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>−{taka(o.discount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-stone-500">Delivery charge</dt><dd>{taka(o.deliveryCharge)}</dd></div>
                <div className="flex justify-between border-t border-stone-100 pt-1.5 font-semibold"><dt>Total (COD)</dt><dd>{taka(o.total)}</dd></div>
              </dl>
              {showMoney && (
                <dl className="space-y-1.5 rounded-lg bg-stone-50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Order profit</p>
                  <div className="flex justify-between"><dt className="text-stone-500">Revenue</dt><dd>{taka(revenue)}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Mushroom cost</dt><dd>−{taka(o.itemsCost)}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Packaging</dt><dd>−{taka(o.packagingCost)}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Delivery cost</dt><dd>−{taka(o.deliveryCost)}</dd></div>
                  <div className="flex justify-between border-t border-stone-200 pt-1.5 font-semibold">
                    <dt>Profit</dt>
                    <dd className={profit < 0 ? "text-red-700" : ""}>
                      {taka(profit)} <span className="text-xs font-normal text-stone-500">({pct(revenue ? profit / revenue : 0)})</span>
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </Card>

          {/* Delivery & costs */}
          <Card title="Delivery">
            <ActionForm action={updateDeliveryAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={o.id} />
              <label className="block">
                <span className="label">Delivery date</span>
                <input type="date" name="deliveryDate" defaultValue={o.deliveryDate ? dateKey(o.deliveryDate) : ""} className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Time slot</span>
                <select name="deliverySlot" defaultValue={o.deliverySlot} className="input input-sm">
                  {[...new Set([o.deliverySlot, ...s.delivery.slots])].filter(Boolean).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="label">Address</span>
                <textarea name="addressLine" defaultValue={o.addressLine} className="input input-sm min-h-16" />
              </label>
              <label className="block">
                <span className="label">Landmark</span>
                <input name="landmark" defaultValue={o.landmark} className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Rider / courier</span>
                <select name="riderId" defaultValue={o.riderId ?? ""} className="input input-sm">
                  <option value="">— Not assigned —</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.costPerDelivery ? `(৳${r.costPerDelivery}/delivery)` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {showMoney && (
                <>
                  <label className="block">
                    <span className="label">Our delivery cost (৳)</span>
                    <input type="number" step="0.01" name="deliveryCost" defaultValue={o.deliveryCost} className="input input-sm" />
                  </label>
                  <label className="block">
                    <span className="label">Packaging cost (৳)</span>
                    <input type="number" step="0.01" name="packagingCost" defaultValue={o.packagingCost} className="input input-sm" />
                  </label>
                </>
              )}
              <label className="block md:col-span-2">
                <span className="label">Internal note (not shown to customer)</span>
                <textarea name="internalNote" defaultValue={o.internalNote} className="input input-sm min-h-16" />
              </label>
              <div className="md:col-span-2">
                <Submit>Save delivery details</Submit>
              </div>
            </ActionForm>
          </Card>

          <Card title="History">
            <ol className="space-y-3 text-sm">
              {o.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-stone-300" />
                  <div>
                    <span className="font-medium">{ORDER_STATUS[e.status as OrderStatus]?.en ?? e.status}</span>
                    {e.note && <span className="text-stone-600"> — {e.note}</span>}
                    <span className="block text-xs text-stone-500">
                      {fmtDateTime(e.createdAt)} · {e.by}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{o.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${o.phone}`} className="btn btn-outline btn-sm rounded-lg">
                <Phone className="h-3.5 w-3.5" /> {o.phone}
              </a>
              <a href={`https://wa.me/${phone88}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm rounded-lg">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
              {o.email && (
                <a href={`mailto:${o.email}`} className="btn btn-outline btn-sm rounded-lg">
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              )}
            </div>
            <Link href={`/admin/customers/${o.customerId}`} className="mt-4 block text-sm text-brand hover:underline">
              {o.customer.totalOrders} orders · {taka(o.customer.totalSpent)} lifetime → customer profile
            </Link>
            {o.customerNote && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">“{o.customerNote}”</p>}
          </Card>

          <Card title="Location">
            <p className="text-sm">{o.addressLine}</p>
            {o.landmark && <p className="text-sm text-stone-500">{o.landmark}</p>}
            <p className="mt-1 text-sm text-stone-500">{o.zoneName}</p>
            {o.deliveryDate && (
              <p className="mt-2 text-sm">
                {fmtDate(o.deliveryDate, { weekday: "long", day: "numeric", month: "short" })} · {o.deliverySlot}
              </p>
            )}
            {o.lat != null && o.lng != null ? (
              <>
                <iframe
                  title="Delivery location"
                  className="mt-3 h-48 w-full rounded-lg border border-stone-200"
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${o.lng - 0.006},${o.lat - 0.004},${o.lng + 0.006},${o.lat + 0.004}&layer=mapnik&marker=${o.lat},${o.lng}`}
                />
                <a href={directionsLink(o.lat, o.lng)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm mt-3 w-full rounded-lg">
                  <Navigation className="h-4 w-4" /> Directions (Google Maps)
                </a>
              </>
            ) : (
              <p className="mt-3 text-xs text-stone-500">No map pin for this order.</p>
            )}
          </Card>

          <Card title="Payment (cash on delivery)">
            <ActionForm action={paymentAction} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <select name="paymentStatus" defaultValue={o.paymentStatus} className="input input-sm">
                <option value="UNPAID">Not collected</option>
                <option value="PAID">Cash collected</option>
              </select>
              <label className="block">
                <span className="label">Amount collected (৳)</span>
                <input type="number" step="0.01" name="collectedAmount" defaultValue={o.collectedAmount || o.total} className="input input-sm" />
              </label>
              {o.paidAt && <p className="text-xs text-stone-500">Collected {fmtDateTime(o.paidAt)}</p>}
              <Submit variant="outline">Update payment</Submit>
            </ActionForm>
          </Card>

          <Card title="Emails">
            <ul className="space-y-2 text-sm">
              {emails.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="truncate">{e.type.replaceAll("_", " ").toLowerCase()}</span>
                  <Badge tone={e.status === "SENT" ? "green" : e.status === "FAILED" ? "red" : "gray"}>{e.status.toLowerCase()}</Badge>
                </li>
              ))}
              {!emails.length && <li className="text-stone-500">No emails yet{!o.email && " (no email address)"}.</li>}
            </ul>
            {o.email && (
              <form action={resendEmailAction} className="mt-3">
                <input type="hidden" name="id" value={o.id} />
                <button className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  <ExternalLink className="h-3 w-3" /> Re-send current status email
                </button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
