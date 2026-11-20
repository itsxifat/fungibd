import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifySig } from "@/lib/security";
import { TICKET_STATUS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { TicketReplyForm } from "@/components/store/StoreForms";

export const metadata = { title: "সাপোর্ট টিকেট · Support ticket", robots: { index: false } };

export default async function TicketPage({ params, searchParams }: { params: Promise<{ no: string }>; searchParams: Promise<{ k?: string }> }) {
  const [{ no }, { k = "" }] = await Promise.all([params, searchParams]);
  if (!verifySig(`ticket:${no}`, k)) notFound();
  const t = await db.ticket.findUnique({ where: { ticketNo: no }, include: { messages: { where: { isInternal: false }, orderBy: { createdAt: "asc" } } } });
  if (!t) notFound();
  return (
    <div className="container-x max-w-3xl py-14">
      <p className="text-sm text-muted">টিকেট {t.ticketNo}</p>
      <h1 className="mt-1 font-display text-3xl">{t.subject}</h1>
      <p className="mt-2 font-bangla text-sm text-brand">{TICKET_STATUS[t.status as keyof typeof TICKET_STATUS]?.bn}</p>
      <ol className="mt-8 space-y-4">
        {t.messages.map((m) => (
          <li key={m.id} className={cn("rounded-2xl p-5", m.from === "STAFF" ? "bg-brand-tint" : "border border-line bg-white")}>
            <p className="text-xs text-muted">
              {m.from === "STAFF" ? `FungiBd · ${m.authorName}` : m.authorName} · {fmtDateTime(m.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap font-bangla">{m.body}</p>
          </li>
        ))}
      </ol>
      {t.status !== "CLOSED" && (
        <div className="mt-8 rounded-2xl border border-line bg-white p-5">
          <TicketReplyForm ticketNo={t.ticketNo} k={k} />
        </div>
      )}
    </div>
  );
}
