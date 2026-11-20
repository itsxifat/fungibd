import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { segmentOf, segmentWhere } from "@/lib/crm";
import { SEGMENTS, type Segment } from "@/lib/constants";
import { daysBetween, fmtDate } from "@/lib/dates";
import { num, pct, round2, taka , takaR } from "@/lib/utils";
import { Badge, Card, Empty, FilterTabs, PageHeader, Pagination, Stat, StatusBadge, TableWrap } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const PER = 30;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ seg?: string; q?: string; sort?: string; page?: string }> }) {
  await requireAdmin();
  const [sp, s] = await Promise.all([searchParams, getSettings()]);
  const now = new Date();
  const page = Math.max(1, Number(sp.page) || 1);
  const seg = sp.seg && sp.seg in SEGMENTS ? (sp.seg as Segment) : null;
  const where: Prisma.CustomerWhereInput = { ...(seg ? segmentWhere(seg, s.crm, now) : {}) };
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { phone: { contains: sp.q } }, { email: { contains: sp.q.toLowerCase() } }, { tags: { contains: sp.q.toLowerCase() } }];
  const orderBy: Prisma.CustomerOrderByWithRelationInput = sp.sort === "spent" ? { totalSpent: "desc" } : sp.sort === "orders" ? { totalOrders: "desc" } : sp.sort === "new" ? { createdAt: "desc" } : { lastOrderAt: { sort: "desc", nulls: "last" } };

  const segKeys = Object.keys(SEGMENTS) as Segment[];
  const [customers, total, segCounts, agg, buyers, repeaters] = await Promise.all([
    db.customer.findMany({ where, orderBy, take: PER, skip: (page - 1) * PER }),
    db.customer.count({ where }),
    Promise.all(segKeys.map((k) => db.customer.count({ where: segmentWhere(k, s.crm, now) }))),
    db.customer.aggregate({ where: { totalOrders: { gt: 0 } }, _avg: { totalOrders: true, totalSpent: true } }),
    db.customer.count({ where: { totalOrders: { gt: 0 } } }),
    db.customer.count({ where: { totalOrders: { gte: 2 } } }),
  ]);
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ seg: sp.seg, q: sp.q, sort: sp.sort, ...patch })) if (v) p.set(k, v);
    return `/admin/customers?${p}`;
  };
  const atRisk = segCounts[segKeys.indexOf("AT_RISK")];

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered or signed up. Segments update automatically from order history." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Customers who ordered" value={num(buyers)} />
        <Stat label="Repeat purchase rate" value={pct(buyers ? repeaters / buyers : 0)} hint={`${repeaters} ordered 2+ times`} />
        <Stat label="Avg. orders / customer" value={num(agg._avg.totalOrders ?? 0, 1)} />
        <Stat label="Avg. lifetime value" value={takaR(round2(agg._avg.totalSpent ?? 0))} />
        <Stat label="At risk of leaving" value={atRisk} tone={atRisk ? "warn" : undefined} href="/admin/marketing" hint="send a win-back email →" />
      </div>

      <Card pad={false}>
        <FilterTabs
          current={seg ?? "ALL"}
          items={[
            { key: "ALL", label: "All", href: href({ seg: undefined, page: undefined }) },
            ...segKeys.map((k, i) => ({ key: k, label: SEGMENTS[k].en, count: segCounts[i], href: href({ seg: k, page: undefined }) })),
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <form className="flex flex-1 items-center gap-2">
            {sp.seg && <input type="hidden" name="seg" value={sp.seg} />}
            <Search className="h-4 w-4 text-stone-400" />
            <input name="q" defaultValue={sp.q} placeholder="Search name, phone, email or tag" className="h-8 flex-1 bg-transparent text-sm outline-none" aria-label="Search customers" />
          </form>
          <div className="flex gap-1 text-xs">
            {[
              ["", "Recent"],
              ["spent", "Top spenders"],
              ["orders", "Most orders"],
              ["new", "Newest"],
            ].map(([k, l]) => (
              <Link key={k} href={href({ sort: k || undefined, page: undefined })} className={`rounded-md px-2 py-1 ${(sp.sort ?? "") === k ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                {l}
              </Link>
            ))}
          </div>
        </div>
        {customers.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Segment</th>
                  <th className="num">Orders</th>
                  <th className="num">Spent</th>
                  <th>Last order</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <span className="block text-xs text-stone-500">
                        {c.phone}
                        {c.hasAccount && " · account"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge map={SEGMENTS} value={segmentOf(c, s.crm, now)} />
                    </td>
                    <td className="num">{c.totalOrders}</td>
                    <td className="num">{taka(c.totalSpent)}</td>
                    <td className="text-xs">{c.lastOrderAt ? `${fmtDate(c.lastOrderAt)} · ${daysBetween(c.lastOrderAt, now)}d ago` : "—"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {c.tags
                          .split(",")
                          .filter(Boolean)
                          .map((t) => (
                            <Badge key={t}>{t}</Badge>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No customers here" />
        )}
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => href({ page: String(p) })} />
      </Card>
      <p className="mt-4 text-xs text-stone-500">
        Segments: New = 1 order within {s.crm.atRiskDays} days · Active = 2+ orders · Loyal = {s.crm.loyalOrders}+ orders · At risk = no order for {s.crm.atRiskDays}–{s.crm.lostDays} days · Lost = over {s.crm.lostDays} days. Change in Settings.
      </p>
    </>
  );
}
