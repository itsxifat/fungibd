import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS } from "@/lib/constants";
import { timeAgo } from "@/lib/dates";
import { Card, Empty, FilterTabs, PageHeader, StatusBadge, TableWrap } from "@/components/admin/ui";

export const metadata = { title: "Support" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status ?? "OPEN";
  const [tickets, counts] = await Promise.all([
    db.ticket.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    db.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const c = (s: string) => counts.find((x) => x.status === s)?._count._all ?? 0;
  const prio = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as Record<string, number>;
  const sorted = [...tickets].sort((a, b) => (prio[a.priority] ?? 2) - (prio[b.priority] ?? 2));

  return (
    <>
      <PageHeader title="Support" description="Messages from the website contact form and customers' accounts. Replies are emailed to the customer." />
      <Card pad={false}>
        <FilterTabs
          current={status}
          items={[
            ...Object.entries(TICKET_STATUS).map(([k, v]) => ({ key: k, label: v.en, count: c(k), href: `/admin/support?status=${k}` })),
            { key: "ALL", label: "All", href: "/admin/support?status=ALL" },
          ]}
        />
        {sorted.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>From</th>
                  <th>Topic</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Last message</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => (
                  <tr key={t.id}>
                    <td className="max-w-sm">
                      <Link href={`/admin/support/${t.id}`} className="font-medium hover:underline">
                        {t.subject}
                      </Link>
                      <span className="block truncate text-xs text-stone-500">
                        {t.ticketNo}
                        {t.orderNo && ` · order ${t.orderNo}`} · {t.messages[0]?.body.slice(0, 80)}
                      </span>
                    </td>
                    <td>
                      {t.name}
                      <span className="block text-xs text-stone-500">{t.email}</span>
                    </td>
                    <td className="text-xs">{TICKET_CATEGORY[t.category as keyof typeof TICKET_CATEGORY]?.en ?? t.category}</td>
                    <td>
                      <StatusBadge map={TICKET_PRIORITY} value={t.priority} />
                    </td>
                    <td>
                      <StatusBadge map={TICKET_STATUS} value={t.status} />
                    </td>
                    <td className="text-xs text-stone-500">
                      {t.messages[0]?.from === "CUSTOMER" ? "Customer" : "Us"} · {timeAgo(t.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="Nothing here">No tickets with this status.</Empty>
        )}
      </Card>
    </>
  );
}
