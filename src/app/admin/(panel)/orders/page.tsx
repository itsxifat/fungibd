import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Bike, Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NEXT_STATUS, ORDER_SOURCES, ORDER_STATUS, ORDER_TYPE, type OrderStatus } from "@/lib/constants";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { taka } from "@/lib/utils";
import { Card, Empty, FilterTabs, PageHeader, Pagination, StatusBadge, TableWrap } from "@/components/admin/ui";
import { setStatusAction } from "./actions";

export const metadata = { title: "Orders" };
const PER = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.OrderWhereInput = {};
  if (sp.status && sp.status in ORDER_STATUS) where.status = sp.status;
  if (sp.type === "PREORDER") where.type = "PREORDER";
  if (sp.q) {
    const q = sp.q.trim();
    where.OR = [{ orderNo: { contains: q.toUpperCase() } }, { name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q.toLowerCase() } }];
  }
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: PER, skip: (page - 1) * PER, include: { items: true, rider: true } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: sp.status, type: sp.type, q: sp.q, ...patch })) if (v) p.set(k, v);
    return `/admin/orders?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm, pack and deliver orders. Customers get an email at every step."
        actions={
          <Link href="/admin/orders/new" className="btn btn-primary btn-sm rounded-lg">
            <Plus className="h-4 w-4" /> New order
          </Link>
        }
      />
      <Card pad={false}>
        <FilterTabs
          current={sp.type === "PREORDER" ? "PREORDER" : sp.status ?? "ALL"}
          items={[
            { key: "ALL", label: "All", href: href({ status: undefined, type: undefined, page: undefined }) },
            ...(["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"] as OrderStatus[]).map((s) => ({
              key: s,
              label: ORDER_STATUS[s].en,
              count: count(s),
              href: href({ status: s, type: undefined, page: undefined }),
            })),
            { key: "PREORDER", label: "Pre-orders", href: href({ type: "PREORDER", status: undefined, page: undefined }) },
          ]}
        />
        <form className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.type && <input type="hidden" name="type" value={sp.type} />}
          <Search className="h-4 w-4 text-stone-400" />
          <input name="q" defaultValue={sp.q} placeholder="Search order no., name, phone or email" className="h-8 flex-1 bg-transparent text-sm outline-none" aria-label="Search orders" />
        </form>
        {orders.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const next = NEXT_STATUS[o.status as OrderStatus].filter((s) => s !== "CANCELLED" && s !== "RETURNED")[0];
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                          {o.orderNo}
                        </Link>
                        <span className="block text-xs text-stone-500">
                          {fmtDateTime(o.createdAt)} · {ORDER_SOURCES[o.source as keyof typeof ORDER_SOURCES] ?? o.source}
                        </span>
                      </td>
                      <td>
                        {o.name}
                        <span className="block text-xs text-stone-500">{o.phone}</span>
                      </td>
                      <td className="max-w-[220px]">
                        <span className="line-clamp-2 text-xs text-stone-600">{o.items.map((i) => `${i.nameEn} ${i.variantLabel.split(" · ").pop()} ×${i.qty}`).join(", ")}</span>
                      </td>
                      <td className="text-xs">
                        {o.deliveryDate ? fmtDate(o.deliveryDate, { day: "numeric", month: "short", weekday: "short" }) : "—"}
                        <span className="block text-stone-500">{o.zoneName.split(" · ").pop()}</span>
                        {o.rider && <span className="flex items-center gap-1 text-stone-500"><Bike className="h-3.5 w-3.5" aria-hidden /> {o.rider.name}</span>}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge map={ORDER_STATUS} value={o.status} />
                          {o.type === "PREORDER" && <StatusBadge map={ORDER_TYPE} value={o.type} />}
                        </div>
                      </td>
                      <td className="num font-medium">{taka(o.total)}</td>
                      <td className="text-right">
                        {next && (
                          <form action={setStatusAction}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="to" value={next} />
                            <button className="btn btn-outline btn-sm whitespace-nowrap rounded-lg">→ {ORDER_STATUS[next].en}</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No orders found">Try another filter or search.</Empty>
        )}
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => href({ page: String(p) })} />
      </Card>
    </>
  );
}
