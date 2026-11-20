import Link from "next/link";
import { Package, Search, ShoppingBag, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS, LEAD_STATUS } from "@/lib/constants";
import { fmtDate } from "@/lib/dates";
import { normalizePhone, taka } from "@/lib/utils";
import { Card, Empty, PageHeader, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = ((await searchParams).q ?? "").trim();
  if (!q) return <PageHeader title="Search" description="Type an order number, name, phone or email in the search box above." />;
  const phone = normalizePhone(q);
  const like = { contains: q };
  const [orders, customers, leads, products] = await Promise.all([
    db.order.findMany({ where: { OR: [{ orderNo: { contains: q.toUpperCase() } }, { name: like }, { phone: { contains: phone ?? q } }, { email: { contains: q.toLowerCase() } }] }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.customer.findMany({ where: { OR: [{ name: like }, { phone: { contains: phone ?? q } }, { email: { contains: q.toLowerCase() } }, { tags: { contains: q.toLowerCase() } }] }, orderBy: { lastOrderAt: { sort: "desc", nulls: "last" } }, take: 10 }),
    db.lead.findMany({ where: { OR: [{ name: like }, { company: like }, { phone: { contains: phone ?? q } }, { email: { contains: q.toLowerCase() } }] }, take: 8 }),
    db.product.findMany({ where: { OR: [{ nameEn: like }, { nameBn: like }, { slug: { contains: q.toLowerCase() } }] }, take: 8 }),
  ]);
  const total = orders.length + customers.length + leads.length + products.length;
  const Row = ({ href, title, sub, right }: { href: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) => (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-stone-50">
        <span className="min-w-0">
          <span className="block truncate font-medium">{title}</span>
          {sub && <span className="block truncate text-xs text-stone-500">{sub}</span>}
        </span>
        {right}
      </Link>
    </li>
  );
  return (
    <>
      <PageHeader title={`Results for “${q}”`} description={`${total} found`} />
      {total === 0 ? (
        <Card>
          <Empty title="Nothing found" icon={Search}>
            Try an order number like FB1234, a phone number or part of a name.
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {orders.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-stone-400" /> Orders</span>} pad={false}>
              <ul className="divide-y divide-black/[0.05]">
                {orders.map((o) => (
                  <Row key={o.id} href={`/admin/orders/${o.id}`} title={`${o.orderNo} · ${o.name}`} sub={`${fmtDate(o.createdAt)} · ${o.phone} · ${taka(o.total)}`} right={<StatusBadge map={ORDER_STATUS} value={o.status} />} />
                ))}
              </ul>
            </Card>
          )}
          {customers.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><Users className="h-4 w-4 text-stone-400" /> Customers</span>} pad={false}>
              <ul className="divide-y divide-black/[0.05]">
                {customers.map((c) => (
                  <Row key={c.id} href={`/admin/customers/${c.id}`} title={c.name} sub={`${c.phone}${c.email ? ` · ${c.email}` : ""}`} right={<span className="text-xs text-stone-500">{c.totalOrders} orders</span>} />
                ))}
              </ul>
            </Card>
          )}
          {leads.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-stone-400" /> Leads</span>} pad={false}>
              <ul className="divide-y divide-black/[0.05]">
                {leads.map((l) => (
                  <Row key={l.id} href={`/admin/leads/${l.id}`} title={l.company || l.name} sub={`${l.name} · ${l.phone}`} right={<StatusBadge map={LEAD_STATUS} value={l.status} />} />
                ))}
              </ul>
            </Card>
          )}
          {products.length > 0 && (
            <Card title={<span className="flex items-center gap-2"><Package className="h-4 w-4 text-stone-400" /> Products</span>} pad={false}>
              <ul className="divide-y divide-black/[0.05]">
                {products.map((p) => (
                  <Row key={p.id} href={`/admin/products/${p.id}`} title={p.nameEn} sub={p.nameBn} />
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
