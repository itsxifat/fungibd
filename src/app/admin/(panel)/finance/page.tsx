import Link from "next/link";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { cashFlow, delta, inventoryValue, profitAndLoss, salesBreakdown, type PnL } from "@/lib/analytics";
import { addDays, addMonths, dateKey, fmtDate, previousRange, resolveRange, startOfMonth } from "@/lib/dates";
import { cn, num, pct, taka , takaR } from "@/lib/utils";
import { Card, PageHeader, RangeTabs, Stat, TableWrap } from "@/components/admin/ui";

export const metadata = { title: "Profit & loss" };

function Row({ label, cur, prev, bold, neg, indent, hint }: { label: string; cur: number; prev?: number; bold?: boolean; neg?: boolean; indent?: boolean; hint?: string }) {
  const d = prev != null ? delta(cur, prev) : null;
  return (
    <tr className={cn(bold && "bg-stone-50 font-semibold")}>
      <td className={cn(indent && "pl-8 text-stone-600")}>
        {label}
        {hint && <span className="block text-xs font-normal text-stone-400">{hint}</span>}
      </td>
      <td className={cn("num", bold && cur < 0 && "text-red-700")}>{neg && cur ? `(${taka(cur)})` : taka(cur)}</td>
      <td className="num text-stone-500">{prev != null ? (neg && prev ? `(${taka(prev)})` : taka(prev)) : ""}</td>
      <td className="num text-xs text-stone-500">{d == null ? "" : `${d >= 0 ? "+" : ""}${pct(d, 0)}`}</td>
    </tr>
  );
}

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const sp = await searchParams;
  const r = resolveRange(sp, "month");
  const prevR = previousRange(r.from, r.to);
  const months = Array.from({ length: 6 }, (_, i) => {
    const from = startOfMonth(addMonths(startOfMonth(), -i));
    return { from, to: i === 0 ? addDays(new Date(), 1) : startOfMonth(addMonths(startOfMonth(), -i + 1)) };
  });
  const [p, pp, cash, inv, breakdown, monthly] = await Promise.all([profitAndLoss(r), profitAndLoss(prevR), cashFlow(r), inventoryValue(), salesBreakdown(r), Promise.all(months.map((m) => profitAndLoss(m)))]);
  const q = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  const section = (cur: PnL, prev: PnL) => (
    <>
      <Row label="Product sales" cur={cur.grossSales} prev={prev.grossSales} hint={`${cur.orders} delivered orders`} />
      <Row label="Discounts" cur={-cur.discounts} prev={-prev.discounts} indent />
      <Row label="Delivery charges collected" cur={cur.deliveryIncome} prev={prev.deliveryIncome} indent />
      <Row label="Net revenue" cur={cur.netRevenue} prev={prev.netRevenue} bold />
      <Row label="Mushroom production cost" cur={-cur.cogs} prev={-prev.cogs} indent hint="cost per kg from batches × amount sold" />
      <Row label="Packaging" cur={-cur.packaging} prev={-prev.packaging} indent />
      <Row label="Delivery cost (riders / courier)" cur={-cur.deliveryCost} prev={-prev.deliveryCost} indent />
      <Row label="Spoilage (stock written off)" cur={-cur.spoilageLoss} prev={-prev.spoilageLoss} indent />
      <Row label="Wasted supplies" cur={-cur.supplyWasteLoss} prev={-prev.supplyWasteLoss} indent />
      <Row label="Cancelled & returned order losses" cur={-(cur.cancelLoss + cur.returnLoss)} prev={-(prev.cancelLoss + prev.returnLoss)} indent />
      <Row label="Gross profit" cur={cur.grossProfit} prev={prev.grossProfit} bold hint={`margin ${pct(cur.grossMargin)}`} />
      {cur.expenseLines.map((e) => (
        <Row key={e.category} label={e.label} cur={-e.amount} prev={-(prev.expenseLines.find((x) => x.category === e.category)?.amount ?? 0)} indent />
      ))}
      <Row label="Operating expenses" cur={-cur.opex} prev={-prev.opex} bold />
      <Row label="Net profit" cur={cur.netProfit} prev={prev.netProfit} bold hint={`margin ${pct(cur.netMargin)}`} />
    </>
  );

  return (
    <>
      <PageHeader
        title="Profit & loss"
        description={`${r.label} · ${fmtDate(r.from)} – ${fmtDate(addDays(r.to, -1))}`}
        actions={
          <>
            <RangeTabs base="/admin/finance" current={r.key} from={sp.from} to={sp.to} />
            <a href={`/api/admin/export?type=pnl&${q}`} className="btn btn-outline btn-sm rounded-lg">
              <Download className="h-4 w-4" /> CSV
            </a>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Net revenue" value={takaR(p.netRevenue)} delta={delta(p.netRevenue, pp.netRevenue)} />
        <Stat label="Gross profit" value={takaR(p.grossProfit)} delta={delta(p.grossProfit, pp.grossProfit)} hint={pct(p.grossMargin)} />
        <Stat label="Expenses" value={takaR(p.opex)} delta={delta(p.opex, pp.opex)} href="/admin/finance/expenses" />
        <Stat label="Net profit" value={takaR(p.netProfit)} delta={delta(p.netProfit, pp.netProfit)} hint={pct(p.netMargin)} tone={p.netProfit < 0 ? "warn" : undefined} />
        <Stat label="Net cash in hand" value={takaR(cash.net)} hint="cash in − cash out" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Statement" pad={false}>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th className="num">This period</th>
                  <th className="num">Previous</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>{section(p, pp)}</tbody>
            </table>
          </TableWrap>
          <p className="border-t border-stone-200 px-5 py-3 text-xs leading-relaxed text-stone-500">
            Revenue counts orders when they are delivered. Supply purchases are not counted as expenses here — they become cost when used in a batch (through cost per kg) or when packaging is used. This avoids counting the same money twice. Record rent, salaries, electricity etc. under Expenses.
          </p>
        </Card>

        <div className="space-y-6">
          <Card title="Cash flow">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Cash collected from orders</dt><dd className="font-medium text-emerald-700">{taka(cash.cashIn)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Supplies & packaging bought</dt><dd>({taka(cash.supplies)})</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Expenses paid</dt><dd>({taka(cash.expenses)})</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Rider / courier payments</dt><dd>({taka(cash.delivery)})</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold"><dt>Net cash</dt><dd className={cash.net < 0 ? "text-red-700" : ""}>{taka(cash.net)}</dd></div>
            </dl>
          </Card>
          <Card title="Stock on hand (at cost)">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-stone-600">Mushrooms & products</dt><dd>{taka(inv.mushrooms)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Supplies & packaging</dt><dd>{taka(inv.supplies)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold"><dt>Total</dt><dd>{taka(inv.total)}</dd></div>
            </dl>
          </Card>
          <Card title="Margin by product" pad={false}>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Sales</th>
                    <th className="num">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.products.map((x) => (
                    <tr key={x.name}>
                      <td>
                        {x.name}
                        <span className="block text-xs text-stone-500">
                          {num(x.amount)} {x.unit}
                        </span>
                      </td>
                      <td className="num">{taka(x.revenue)}</td>
                      <td className="num">{pct(x.margin, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      </div>

      <Card title="Last 6 months" pad={false} className="mt-6">
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Orders</th>
                <th className="num">Net revenue</th>
                <th className="num">Gross profit</th>
                <th className="num">Expenses</th>
                <th className="num">Net profit</th>
                <th className="num">Net margin</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => (
                <tr key={i}>
                  <td>
                    <Link href={`/admin/finance?from=${dateKey(months[i].from)}&to=${dateKey(addDays(months[i].to, -1))}`} className="hover:underline">
                      {fmtDate(months[i].from, { month: "long", year: "numeric" })}
                    </Link>
                  </td>
                  <td className="num">{m.orders}</td>
                  <td className="num">{taka(m.netRevenue)}</td>
                  <td className="num">{taka(m.grossProfit)}</td>
                  <td className="num">{taka(m.opex)}</td>
                  <td className={cn("num font-medium", m.netProfit < 0 && "text-red-700")}>{taka(m.netProfit)}</td>
                  <td className="num">{pct(m.netMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
