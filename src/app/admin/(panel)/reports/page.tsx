import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { dailySeries, salesBreakdown } from "@/lib/analytics";
import { addDays, fmtDate, resolveRange } from "@/lib/dates";
import { ORDER_SOURCES } from "@/lib/constants";
import { num, pct, taka } from "@/lib/utils";
import { Card, PageHeader, RangeTabs, Stat, TableWrap } from "@/components/admin/ui";
import { DailyBars, RankBars } from "@/components/admin/charts";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const sp = await searchParams;
  const r = resolveRange(sp, "30d");
  const [b, series] = await Promise.all([salesBreakdown(r), dailySeries(r)]);
  const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  const exp = (type: string, label: string) => (
    <a href={`/api/admin/export?type=${type}&${q}`} className="btn btn-outline btn-sm justify-start rounded-lg">
      <Download className="h-4 w-4" /> {label}
    </a>
  );
  const totalRev = b.products.reduce((a, p) => a + p.revenue, 0);

  return (
    <>
      <PageHeader title="Reports" description={`${r.label} · ${fmtDate(r.from)} – ${fmtDate(addDays(r.to, -1))}`} actions={<RangeTabs base="/admin/reports" current={r.key} from={sp.from} to={sp.to} />} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders" value={b.customers.totalOrders} />
        <Stat label="Unique customers" value={b.customers.unique} />
        <Stat label="New customers" value={b.customers.newCustomers} />
        <Stat label="Repeat orders" value={b.customers.returningOrders} hint={pct(b.customers.totalOrders ? b.customers.returningOrders / b.customers.totalOrders : 0) + " of orders"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Product performance" pad={false}>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Packs</th>
                  <th className="num">Quantity</th>
                  <th className="num">Sales</th>
                  <th className="num">Share</th>
                  <th className="num">Cost</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                {b.products.map((p) => (
                  <tr key={p.name}>
                    <td>
                      {p.name}
                      <span className="block text-xs text-stone-500">{p.nameBn}</span>
                    </td>
                    <td className="num">{p.units}</td>
                    <td className="num">
                      {num(p.amount)} {p.unit}
                    </td>
                    <td className="num">{taka(p.revenue)}</td>
                    <td className="num">{pct(totalRev ? p.revenue / totalRev : 0, 0)}</td>
                    <td className="num">{taka(p.cost)}</td>
                    <td className="num">{pct(p.margin, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
        <div className="space-y-6">
          <Card title="Download (CSV for Excel)">
            <div className="grid gap-2">
              {exp("orders", "Orders (with costs & profit)")}
              {exp("products", "Product sales")}
              {exp("pnl", "Profit & loss")}
              {exp("expenses", "Expenses")}
              {exp("customers", "All customers")}
              {exp("leads", "All leads")}
            </div>
          </Card>
          <Card title="Where orders come from">
            <RankBars rows={b.sources.map((s) => ({ label: ORDER_SOURCES[s.source as keyof typeof ORDER_SOURCES] ?? s.source, value: s.count }))} unit="orders" />
          </Card>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Orders per day">
          <DailyBars data={series} dataKey="orders" label="Orders" />
        </Card>
        <Card title="Sales by area" pad={false}>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th className="num">Orders</th>
                  <th className="num">Sales</th>
                </tr>
              </thead>
              <tbody>
                {b.zones.map((z) => (
                  <tr key={z.zone}>
                    <td>{z.zone}</td>
                    <td className="num">{z.orders}</td>
                    <td className="num">{taka(z.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>
    </>
  );
}
