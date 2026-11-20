import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { LEAD_PIPELINE, LEAD_SOURCES, LEAD_STATUS, LEAD_TYPES } from "@/lib/constants";
import { addDays, fmtDate, startOfDay, startOfMonth } from "@/lib/dates";
import { taka , takaR } from "@/lib/utils";
import { Badge, Card, PageHeader, Stat } from "@/components/admin/ui";
import { ActionForm, Drawer, Submit } from "@/components/admin/client";
import { leadAction, leadStatusAction } from "../customers/actions";
import { LeadFields } from "./LeadFields";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const leads = await db.lead.findMany({ where: sp.type ? { type: sp.type } : {}, orderBy: [{ nextFollowUp: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }] });
  const open = leads.filter((l) => l.status !== "WON" && l.status !== "LOST");
  const tomorrow = addDays(startOfDay(), 1);
  const due = open.filter((l) => l.nextFollowUp && l.nextFollowUp < tomorrow);
  const wonMonth = leads.filter((l) => l.status === "WON" && l.updatedAt >= startOfMonth());

  return (
    <>
      <PageHeader
        title="Leads"
        description="Wholesale inquiries, harvest-alert signups, Facebook and phone enquiries — move them through the pipeline until they buy."
        actions={
          <Drawer label="Add lead" title="New lead" description="A possible buyer: restaurant, shop, or someone who asked about prices." width="max-w-2xl">
            <ActionForm action={leadAction}>
              <LeadFields />
              <div className="mt-5">
                <Submit>Create lead</Submit>
              </div>
            </ActionForm>
          </Drawer>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open leads" value={open.length} />
        <Stat label="Pipeline value / month" value={takaR(open.reduce((a, l) => a + l.estValue, 0))} hint="estimated" />
        <Stat label="Follow-ups due" value={due.length} tone={due.length ? "warn" : undefined} />
        <Stat label="Won this month" value={wonMonth.length} hint={taka(wonMonth.reduce((a, l) => a + l.estValue, 0)) + " / month"} />
      </div>
      <div className="mb-4 flex flex-wrap gap-1 text-xs">
        <Link href="/admin/leads" className={`rounded-md px-2.5 py-1 ${!sp.type ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>
          All types
        </Link>
        {Object.entries(LEAD_TYPES).map(([k, v]) => (
          <Link key={k} href={`/admin/leads?type=${k}`} className={`rounded-md px-2.5 py-1 ${sp.type === k ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"}`}>
            {v}
          </Link>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
        {LEAD_PIPELINE.map((st) => {
          const col = leads.filter((l) => l.status === st);
          return (
            <section key={st} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">
                  {LEAD_STATUS[st].en} <span className="font-normal text-stone-400">{col.length}</span>
                </h2>
                <span className="text-xs text-stone-500">{taka(col.reduce((a, l) => a + l.estValue, 0))}</span>
              </div>
              <div className="space-y-2">
                {col.map((l) => {
                  const overdue = l.nextFollowUp && l.nextFollowUp < tomorrow && st !== "WON" && st !== "LOST";
                  return (
                    <Card key={l.id} className={overdue ? "border-amber-300" : ""}>
                      <Link href={`/admin/leads/${l.id}`} className="block">
                        <p className="font-medium hover:underline">{l.company || l.name}</p>
                        {l.company && <p className="text-xs text-stone-500">{l.name}</p>}
                        <p className="mt-1 line-clamp-2 text-xs text-stone-600">{l.interest || l.message}</p>
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge>{LEAD_TYPES[l.type as keyof typeof LEAD_TYPES] ?? l.type}</Badge>
                        <Badge tone="gray">{LEAD_SOURCES[l.source as keyof typeof LEAD_SOURCES] ?? l.source}</Badge>
                        {l.estValue > 0 && <span className="text-xs font-medium">{taka(l.estValue)}/mo</span>}
                      </div>
                      {l.nextFollowUp && st !== "WON" && st !== "LOST" && <p className={`mt-2 text-xs ${overdue ? "font-semibold text-amber-700" : "text-stone-500"}`}>Follow up {fmtDate(l.nextFollowUp, { day: "numeric", month: "short" })}</p>}
                      <form action={leadStatusAction} className="mt-2 flex gap-1">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={st} className="input input-sm flex-1 py-1 text-xs" aria-label="Move to stage">
                          {LEAD_PIPELINE.map((k) => (
                            <option key={k} value={k}>
                              {LEAD_STATUS[k].en}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-outline btn-sm rounded-lg py-1 text-xs">Move</button>
                      </form>
                    </Card>
                  );
                })}
                {!col.length && <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-xs text-stone-400">Empty</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
