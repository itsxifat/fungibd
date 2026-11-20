import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { LEAD_STATUS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { normalizePhone } from "@/lib/utils";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { convertLeadAction, leadAction } from "../../customers/actions";
import { LeadFields } from "../LeadFields";

export const metadata = { title: "Lead" };

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const l = await db.lead.findUnique({ where: { id }, include: { activities: { orderBy: { createdAt: "desc" } }, customer: true } });
  if (!l) notFound();
  const phone = normalizePhone(l.phone);
  return (
    <>
      <PageHeader
        back={{ href: "/admin/leads", label: "Leads" }}
        title={l.company || l.name}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge map={LEAD_STATUS} value={l.status} /> added {fmtDateTime(l.createdAt)}
          </span>
        }
        actions={
          <>
            {phone && (
              <>
                <a href={`tel:${phone}`} className="btn btn-outline btn-sm rounded-lg">
                  <Phone className="h-4 w-4" /> Call
                </a>
                <a href={`https://wa.me/88${phone}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm rounded-lg">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
            {l.customer ? (
              <Link href={`/admin/customers/${l.customer.id}`} className="btn btn-primary btn-sm rounded-lg">
                Open customer
              </Link>
            ) : (
              <form action={convertLeadAction}>
                <input type="hidden" name="id" value={l.id} />
                <button className="btn btn-primary btn-sm rounded-xl">
                  <UserPlus className="h-4 w-4" /> Convert to customer
                </button>
              </form>
            )}
            <DeleteButton type="lead" id={l.id} label="Delete" redirectTo="/admin/leads" title="Delete this lead?" description="The lead and its interaction history are removed." />
          </>
        }
      />
      {sp.error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{sp.error}</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Details">
          <ActionForm action={leadAction}>
            <input type="hidden" name="id" value={l.id} />
            <LeadFields l={l} />
            <div className="mt-4">
              <Submit>Save</Submit>
            </div>
          </ActionForm>
        </Card>
        <ActivityLog items={l.activities} leadId={l.id} />
      </div>
    </>
  );
}
