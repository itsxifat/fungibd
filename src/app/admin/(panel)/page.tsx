import Link from "next/link";
import { AlertTriangle, Banknote, CalendarClock, ChartLine, CircleDollarSign, ClipboardCheck, LifeBuoy, Package, Plus, Receipt, ShoppingBag, Sprout, TrendingUp, Truck, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cashFlow, dailySeries, delta, inventoryValue, liveOps, profitAndLoss, salesBreakdown } from "@/lib/analytics";
import { previousRange, resolveRange, dateKey, addDays, fmtDate, timeAgo } from "@/lib/dates";
import { ORDER_STATUS, ORDER_TYPE } from "@/lib/constants";
import { num, pct, taka, takaR } from "@/lib/utils";
import { Badge, Card, PageHeader, RangeTabs, Stat, StatusBadge, TableWrap } from "@/components/admin/ui";
import { DailyBars, RankBars, TrendChart } from "@/components/admin/charts";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string; denied?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const r = resolveRange(sp, "30d");
  const prev = previousRange(r.from, r.to);
  const showMoney = admin.role !== "STAFF";

  const [pnl, pnlPrev, series, seriesPrev, breakdown, ops, inv, cash, recent, preProducts] = await Promise.all([
    profitAndLoss(r),
    profitAndLoss(prev),
    dailySeries(r),
    dailySeries(prev),
    salesBreakdown(r),
    liveOps(),
    inventoryValue(),
    cashFlow(r),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { preorderEnabled: true, isActive: true }, orderBy: { preorderDate: "asc" } }),
  ]);
  const booked = series.reduce((a, d) => a + d.booked, 0);
  const orders = series.reduce((a, d) => a + d.orders, 0);
  const bookedPrev = seriesPrev.reduce((a, d) => a + d.booked, 0);
  const ordersPrev = seriesPrev.reduce((a, d) => a + d.orders, 0);
  const aov = orders ? booked / orders : 0;
  const aovPrev = ordersPrev ? bookedPrev / ordersPrev : 0;

  return (
    <>
      <PageHeader
        title={`Hello, ${admin.name.split(" ")[0]} 👋`}
        description={fmtDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <>
            <Link href="/admin/production" className="btn btn-outline btn-sm rounded-xl bg-white">
              <Sprout className="h-4 w-4" /> Record harvest
            </Link>
            {showMoney && (
              <Link href="/admin/finance/expenses" className="btn btn-outline btn-sm rounded-xl bg-white">
                <Receipt className="h-4 w-4" /> Add expense
              </Link>
            )}
          </>
        }
      />
      {sp.denied && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">You don&apos;t have access to that page. Ask the owner to change your role.</p>}

      {/* Today */}
      <h2 className="mb-3 text-[15px] font-semibold">Today&apos;s work</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="New orders to confirm" value={ops.pending} href="/admin/orders?status=PENDING" tone={ops.pending ? "warn" : undefined} icon={ShoppingBag} color="amber" />
        <Stat label="Deliveries today" value={ops.todayDeliveries} href="/admin/delivery" icon={Truck} color="sky" />
        <Stat label="Confirmed, to pack" value={ops.toPack} href="/admin/orders?status=CONFIRMED" icon={Package} color="violet" />
        <Stat label="Out for delivery" value={ops.outForDelivery} href="/admin/orders?status=OUT_FOR_DELIVERY" icon={ClipboardCheck} color="green" />
        <Stat label="Open pre-orders" value={ops.openPreorders} href="/admin/preorders" icon={CalendarClock} color="brand" />
        <Stat label="Open support tickets" value={ops.openTickets} href="/admin/support" tone={ops.openTickets ? "warn" : undefined} hint={ops.followUps ? `${ops.followUps} lead follow-ups due` : undefined} icon={LifeBuoy} color="rose" />
      </div>

      {/* KPIs */}
      <div className="mb-3 mt-9 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Performance</h2>
        <RangeTabs base="/admin" current={r.key} params={{}} from={sp.from} to={sp.to} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Orders placed" value={num(orders)} delta={delta(orders, ordersPrev)} hint="vs previous period" icon={ShoppingBag} />
        <Stat label="Sales booked" value={takaR(booked)} delta={delta(booked, bookedPrev)} hint="non-cancelled orders" icon={Banknote} color="sky" />
        <Stat label="Avg. order value" value={takaR(aov)} delta={delta(aov, aovPrev)} icon={Wallet} color="violet" />
        {showMoney ? (
          <>
            <Stat label="Revenue (delivered)" value={takaR(pnl.netRevenue)} delta={delta(pnl.netRevenue, pnlPrev.netRevenue)} hint={`${pnl.orders} delivered`} icon={CircleDollarSign} color="green" />
            <Stat label="Gross profit" value={takaR(pnl.grossProfit)} delta={delta(pnl.grossProfit, pnlPrev.grossProfit)} hint={`${pct(pnl.grossMargin)} margin`} icon={TrendingUp} color="green" />
            <Stat label="Net profit" value={takaR(pnl.netProfit)} delta={delta(pnl.netProfit, pnlPrev.netProfit)} hint={`after ${takaR(pnl.opex)} expenses`} href="/admin/finance" icon={ChartLine} color={pnl.netProfit < 0 ? "rose" : "green"} />
          </>
        ) : (
          <>
            <Stat label="New customers" value={breakdown.customers.newCustomers} icon={Users} />
            <Stat label="Repeat orders" value={breakdown.customers.returningOrders} />
            <Stat label="Pre-orders" value={series.reduce((a, d) => a + d.preorders, 0)} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {showMoney && (
          <Card title="Revenue & gross profit (by delivery day)" className="xl:col-span-2">
            <TrendChart
              data={series}
              series={[
                { key: "revenue", label: "Revenue" },
                { key: "grossProfit", label: "Gross profit" },
              ]}
            />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-900">View as table</summary>
              <TableWrap>
                <table className="table mt-2">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="num">Orders</th>
                      <th className="num">Revenue</th>
                      <th className="num">Gross profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.filter((d) => d.orders || d.revenue).map((d) => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td className="num">{d.orders}</td>
                        <td className="num">{taka(d.revenue)}</td>
                        <td className="num">{taka(d.grossProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </details>
          </Card>
        )}
        <Card title="Orders per day" className={showMoney ? "" : "xl:col-span-3"}>
          <DailyBars data={series} dataKey="orders" label="Orders" />
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-4 text-center text-xs text-stone-500">
            <div>
              <p className="text-base font-semibold text-stone-900">{breakdown.customers.unique}</p>customers
            </div>
            <div>
              <p className="text-base font-semibold text-stone-900">{breakdown.customers.newCustomers}</p>new
            </div>
            <div>
              <p className="text-base font-semibold text-stone-900">{breakdown.customers.returningOrders}</p>repeat orders
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Top products (sales)">
          {breakdown.products.length ? (
            <RankBars rows={breakdown.products.slice(0, 6).map((p) => ({ label: p.name, value: p.revenue, sub: `${num(p.amount)} ${p.unit}` }))} />
          ) : (
            <p className="text-sm text-stone-500">No sales in this period.</p>
          )}
        </Card>
        <Card title="Sales by area">
          {breakdown.zones.length ? <RankBars rows={breakdown.zones.slice(0, 6).map((z) => ({ label: z.zone.split(" · ").pop() ?? z.zone, value: z.revenue, sub: `${z.orders} orders` }))} /> : <p className="text-sm text-stone-500">No sales yet.</p>}
        </Card>
        <Card title="Attention needed">
          <ul className="space-y-2.5 text-sm">
            {ops.lowStock.map((p) => (
              <li key={p.id} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <Link href="/admin/inventory" className="hover:underline">
                  {p.nameEn} low: {num(p.stockQty)} {p.stockUnit} left
                </Link>
              </li>
            ))}
            {ops.lowSupplies.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <Link href="/admin/supplies" className="hover:underline">
                  Reorder {s.name}: {num(s.stockQty)} {s.unit} left
                </Link>
              </li>
            ))}
            {ops.newLeads > 0 && (
              <li>
                <Link href="/admin/leads" className="hover:underline">
                  {ops.newLeads} new leads waiting for contact
                </Link>
              </li>
            )}
            {!ops.lowStock.length && !ops.lowSupplies.length && !ops.newLeads && <li className="text-stone-500">All good — nothing urgent.</li>}
          </ul>
          {showMoney && (
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-stone-500">Stock value (at cost)</p>
                <p className="font-semibold">{taka(inv.total)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Net cash ({r.label.toLowerCase()})</p>
                <p className="font-semibold">{taka(cash.net)}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-xs font-medium text-brand hover:underline">All orders</Link>} pad={false} className="xl:col-span-2">
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                        {o.orderNo}
                      </Link>
                      <span className="ml-2 text-xs text-stone-500">{timeAgo(o.createdAt)}</span>
                    </td>
                    <td>
                      {o.name}
                      <span className="block text-xs text-stone-500">{o.zoneName.split(" · ").pop()}</span>
                    </td>
                    <td className="space-x-1">
                      <StatusBadge map={ORDER_STATUS} value={o.status} />
                      {o.type === "PREORDER" && <StatusBadge map={ORDER_TYPE} value={o.type} />}
                    </td>
                    <td className="num">{taka(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
        <Card title="Pre-order capacity" actions={<Link href="/admin/preorders" className="text-xs font-medium text-brand hover:underline">Manage</Link>}>
          {preProducts.length ? (
            <ul className="space-y-4">
              {preProducts.map((p) => (
                <li key={p.id} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{p.nameEn}</span>
                    <span className="text-stone-500">{p.preorderDate ? fmtDate(p.preorderDate, { day: "numeric", month: "short" }) : "No date"}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-[#0a7d5e]" style={{ width: `${p.preorderCap ? Math.min(100, (p.preorderBooked / p.preorderCap) * 100) : 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {num(p.preorderBooked)} {p.stockUnit} booked{p.preorderCap != null ? ` of ${num(p.preorderCap)}` : " (no limit)"} · {p.preorderMode === "ALWAYS" ? <Badge tone="gold">Pre-order only</Badge> : "when sold out"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Pre-order is off for all products.</p>
          )}
        </Card>
      </div>
      <p className="mt-6 text-xs text-stone-400">Data as of {dateKey(new Date())}. Revenue & profit count orders when delivered; “sales booked” counts orders when placed.</p>
    </>
  );
}
