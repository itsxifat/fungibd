import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { cn, taka } from "@/lib/utils";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ticketReplyAdminAction, ticketUpdateAction } from "../../customers/actions";

export const metadata = { title: "Ticket" };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const t = await db.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } }, customer: true } });
  if (!t) notFound();
  const order = t.orderNo ? await db.order.findUnique({ where: { orderNo: t.orderNo } }) : null;
  return (
    <>
      <PageHeader
        back={{ href: "/admin/support", label: "Support" }}
        title={t.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {t.ticketNo} <StatusBadge map={TICKET_STATUS} value={t.status} /> <StatusBadge map={TICKET_PRIORITY} value={t.priority} /> opened {fmtDateTime(t.createdAt)}
          </span>
        }
        actions={<DeleteButton type="ticket" id={t.id} label="Delete ticket" redirectTo="/admin/support" title={`Delete ticket ${t.ticketNo}?`} description="The ticket and all its messages are removed." />}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {t.messages.map((m) => (
            <div key={m.id} className={cn("rounded-xl border p-4", m.isInternal ? "border-amber-200 bg-amber-50" : m.from === "STAFF" ? "border-brand/20 bg-brand-tint" : "border-stone-200 bg-white")}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-800">{m.authorName}</span> · {m.from === "STAFF" ? (m.isInternal ? "internal note" : "replied") : "customer"} · {fmtDateTime(m.createdAt)}
                </p>
                <DeleteButton type="ticketMessage" id={m.id} title="Delete this message?" />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
            </div>
          ))}
          <Card title="Reply">
            <ActionForm action={ticketReplyAdminAction} resetOnSuccess className="space-y-3">
              <input type="hidden" name="id" value={t.id} />
              <textarea name="body" className="input min-h-32" placeholder="Write your reply (Bangla or English). It will be emailed to the customer." />
              <div className="flex flex-wrap items-center gap-3">
                <select name="status" className="input input-sm w-auto" defaultValue="PENDING" aria-label="Set status">
                  <option value="PENDING">Set: waiting on customer</option>
                  <option value="RESOLVED">Set: resolved</option>
                  <option value="OPEN">Keep open</option>
                  <option value="CLOSED">Close ticket</option>
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="internal" /> Internal note only (not emailed)
                </label>
                <Submit>Send</Submit>
              </div>
            </ActionForm>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-stone-600">{t.email}</p>
            {t.phone && <p className="text-sm text-stone-600">{t.phone}</p>}
            {t.customer && (
              <Link href={`/admin/customers/${t.customer.id}`} className="mt-2 block text-sm text-brand hover:underline">
                {t.customer.totalOrders} orders · {taka(t.customer.totalSpent)} → profile
              </Link>
            )}
            {order && (
              <Link href={`/admin/orders/${order.id}`} className="mt-2 block text-sm text-brand hover:underline">
                Related order {order.orderNo}
              </Link>
            )}
          </Card>
          <Card title="Ticket">
            <ActionForm action={ticketUpdateAction} className="space-y-3">
              <input type="hidden" name="id" value={t.id} />
              <label className="block">
                <span className="label">Status</span>
                <select name="status" defaultValue={t.status} className="input input-sm">
                  {Object.entries(TICKET_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.en}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Priority</span>
                <select name="priority" defaultValue={t.priority} className="input input-sm">
                  {Object.entries(TICKET_PRIORITY).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.en}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Topic</span>
                <select name="category" defaultValue={t.category} className="input input-sm">
                  {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.en}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Assigned to</span>
                <input name="assignedTo" defaultValue={t.assignedTo} className="input input-sm" />
              </label>
              <Submit variant="outline">Update</Submit>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
