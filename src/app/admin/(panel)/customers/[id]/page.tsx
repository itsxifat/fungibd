import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { segmentOf } from "@/lib/crm";
import { ORDER_STATUS, SEGMENTS, TICKET_STATUS } from "@/lib/constants";
import { DAY, daysBetween, fmtDate } from "@/lib/dates";
import { num, round2, taka } from "@/lib/utils";
import { Card, PageHeader, Stat, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { updateCustomerAction } from "../actions";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [c, s] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
        addresses: true,
        tickets: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
        reviews: { include: { product: true } },
        leads: true,
      },
    }),
    getSettings(),
  ]);
  if (!c) notFound();
  const now = new Date();
  const valid = c.orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");
  const dates = valid.map((o) => o.createdAt.getTime()).sort((a, b) => a - b);
  const gaps = dates.slice(1).map((t, i) => (t - dates[i]) / DAY);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const aov = valid.length ? valid.reduce((a, o) => a + o.total, 0) / valid.length : 0;
  const favourite = new Map<string, number>();
  for (const o of valid) for (const i of o.items) favourite.set(i.nameEn, (favourite.get(i.nameEn) ?? 0) + i.qty);
  const fav = [...favourite.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const seg = segmentOf(c, s.crm, now);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={c.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge map={SEGMENTS} value={seg} /> {SEGMENTS[seg].hint} · customer since {fmtDate(c.createdAt)} · source {c.source.toLowerCase()}
          </span>
        }
        actions={
          <>
            {c.phone && (
              <>
                <a href={`tel:${c.phone}`} className="btn btn-outline btn-sm rounded-lg">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href={`https://wa.me/88${c.phone}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm rounded-lg">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="btn btn-outline btn-sm rounded-lg">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            <Link href={`/admin/orders/new?customer=${c.id}`} className="btn btn-primary btn-sm rounded-xl">
              <Plus className="h-4 w-4" /> New order
            </Link>
            <DeleteButton
              type="customer"
              id={c.id}
              label="Delete"
              redirectTo="/admin/customers"
              title={`Delete ${c.name}?`}
              description={
                c.orders.length
                  ? `This also deletes their ${c.orders.length} order(s); stock and packaging are put back. Support tickets and reviews are kept without the link.`
                  : "The customer, their saved addresses and interaction notes are removed."
              }
            />
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Orders" value={c.totalOrders} hint={`${c.orders.length - valid.length} cancelled/returned`} />
        <Stat label="Lifetime value" value={taka(c.totalSpent)} hint="delivered orders" />
        <Stat label="Avg. order" value={taka(round2(aov))} />
        <Stat label="Last order" value={c.lastOrderAt ? `${daysBetween(c.lastOrderAt, now)} days ago` : "—"} />
        <Stat label="Orders every" value={avgGap ? `${num(avgGap, 0)} days` : "—"} hint="average gap" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Orders" pad={false}>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {c.orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                          {o.orderNo}
                        </Link>
                      </td>
                      <td>{fmtDate(o.createdAt)}</td>
                      <td className="text-xs">{o.items.map((i) => `${i.nameEn} ×${i.qty}`).join(", ")}</td>
                      <td>
                        <StatusBadge map={ORDER_STATUS} value={o.status} />
                      </td>
                      <td className="num">{taka(o.total)}</td>
                    </tr>
                  ))}
                  {!c.orders.length && (
                    <tr>
                      <td colSpan={5} className="text-center text-stone-500">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </Card>
          <ActivityLog items={c.activities} customerId={c.id} />
        </div>

        <div className="space-y-6">
          <Card title="Profile">
            <ActionForm action={updateCustomerAction} className="space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <label className="block">
                <span className="label">Name</span>
                <input name="name" defaultValue={c.name} className="input input-sm" />
              </label>
              <p className="text-sm">
                <span className="text-stone-500">Mobile:</span> {c.phone}
              </p>
              <label className="block">
                <span className="label">Email</span>
                <input name="email" type="email" defaultValue={c.email ?? ""} className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Tags (comma separated)</span>
                <input name="tags" defaultValue={c.tags} placeholder="vip, restaurant, weekly" className="input input-sm" />
              </label>
              <label className="block">
                <span className="label">Notes</span>
                <textarea name="notes" defaultValue={c.notes} className="input input-sm min-h-20" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="marketingOptIn" defaultChecked={c.marketingOptIn} /> Receives offer emails
              </label>
              <Submit>Save</Submit>
            </ActionForm>
          </Card>
          {fav.length > 0 && (
            <Card title="Usually buys">
              <ul className="space-y-1 text-sm">
                {fav.map(([n, q]) => (
                  <li key={n} className="flex justify-between">
                    <span>{n}</span>
                    <span className="text-stone-500">{q} packs</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Addresses">
            <ul className="space-y-2 text-sm">
              {c.addresses.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2">
                  <span>
                    {a.line}
                    {a.landmark && <span className="text-stone-500"> · {a.landmark}</span>}
                  </span>
                  <DeleteButton type="address" id={a.id} title="Delete this address?" />
                </li>
              ))}
              {!c.addresses.length && <li className="text-stone-500">None saved</li>}
            </ul>
          </Card>
          <Card title="Support tickets">
            <ul className="space-y-2 text-sm">
              {c.tickets.map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <Link href={`/admin/support/${t.id}`} className="truncate hover:underline">
                    {t.ticketNo} · {t.subject}
                  </Link>
                  <StatusBadge map={TICKET_STATUS} value={t.status} />
                </li>
              ))}
              {!c.tickets.length && <li className="text-stone-500">None</li>}
            </ul>
          </Card>
          {c.reviews.length > 0 && (
            <Card title="Reviews">
              <ul className="space-y-2 text-sm">
                {c.reviews.map((r) => (
                  <li key={r.id}>
                    {"★".repeat(r.rating)} {r.product.nameEn} — <span className="text-stone-600">{r.comment}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
