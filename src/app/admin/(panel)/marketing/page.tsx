import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emailConfigured } from "@/lib/email/mailer";
import { COUPON_TYPES, SEGMENTS } from "@/lib/constants";
import { fmtDate, toLocalDateTimeValue } from "@/lib/dates";
import { Badge, Card, PageHeader, TableWrap } from "@/components/admin/ui";
import { ActionForm, Drawer, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { campaignAction, campaignRecipients, couponAction } from "./actions";

export const metadata = { title: "Marketing" };

const AUDIENCES: Record<string, string> = {
  ALL: "All customers (opted in)",
  ...Object.fromEntries(Object.entries(SEGMENTS).map(([k, v]) => [k, `${v.en} customers`])),
  LEADS: "All open leads",
  HARVEST_ALERT: "Harvest-alert subscribers",
};

export default async function MarketingPage() {
  await requireAdmin(["OWNER", "MANAGER"]);
  const [campaigns, coupons, counts] = await Promise.all([
    db.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    Promise.all(Object.keys(AUDIENCES).map(async (k) => [k, (await campaignRecipients(k)).length] as const)),
  ]);
  const size = Object.fromEntries(counts);
  const smtp = await emailConfigured();

  return (
    <>
      <PageHeader title="Marketing" description="Bring customers back with email campaigns and coupons. Every email has an unsubscribe link." />
      {!smtp && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">Email sending is not set up yet — campaigns will be logged but not delivered. Set it up in Settings → Email.</p>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card title="New email campaign">
          <ActionForm action={campaignAction} resetOnSuccess className="space-y-3">
            <label className="block">
              <span className="label">Send to</span>
              <select name="segment" className="input input-sm">
                {Object.entries(AUDIENCES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v} — {size[k] ?? 0} people
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Subject</span>
              <input name="subject" className="input input-sm" placeholder="e.g. নতুন হারভেস্ট এসেছে! 🍄" required />
            </label>
            <label className="block">
              <span className="label">Message</span>
              <textarea name="body" className="input input-sm min-h-40" placeholder={"বাংলা বা ইংরেজিতে লিখুন। Blank line = new paragraph.\n\nTip: include a coupon code like COMEBACK50 for at-risk customers."} required />
            </label>
            <input name="name" type="hidden" />
            <div className="flex flex-wrap gap-2">
              <button name="mode" value="test" className="btn btn-outline btn-sm rounded-lg">
                Send test to me
              </button>
              <button name="mode" value="draft" className="btn btn-outline btn-sm rounded-lg">
                Save draft
              </button>
              <button name="mode" value="send" className="btn btn-primary btn-sm rounded-lg">
                Send campaign
              </button>
            </div>
          </ActionForm>
          <p className="mt-3 text-xs text-stone-500">The email uses your brand header and adds a “Shop now” button and an unsubscribe link automatically.</p>
        </Card>

        <Card title="Campaigns" pad={false}>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-medium">{c.subject}</span>
                      <span className="block text-xs text-stone-500">{fmtDate(c.createdAt)}</span>
                    </td>
                    <td className="text-xs">{AUDIENCES[c.segment] ?? c.segment}</td>
                    <td>{c.status === "SENT" ? <Badge tone="green">sent to {c.sentCount}</Badge> : <Badge>draft</Badge>}</td>
                    <td className="text-right">
                      <DeleteButton type="campaign" id={c.id} title="Delete this campaign?" description="Only the campaign record is removed; emails already sent can't be recalled." />
                    </td>
                  </tr>
                ))}
                {!campaigns.length && (
                  <tr>
                    <td colSpan={4} className="text-center text-stone-500">
                      No campaigns yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      </div>

      <Card
        title="Coupons"
        className="mt-6"
        pad={false}
        actions={
          <Drawer label="New coupon" title="Create a coupon">
            <ActionForm action={couponAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Code</span>
                <input name="code" placeholder="EID20" className="input uppercase" required />
              </label>
              <label className="block">
                <span className="label">Type</span>
                <select name="type" className="input">
                  {Object.entries(COUPON_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Value (% or ৳)</span>
                <input name="value" type="number" step="0.01" className="input" />
              </label>
              <label className="block">
                <span className="label">Minimum order (৳)</span>
                <input name="minOrder" type="number" className="input" />
              </label>
              <label className="block">
                <span className="label">Max discount (৳)</span>
                <input name="maxDiscount" type="number" className="input" />
              </label>
              <label className="block">
                <span className="label">Uses per customer (0 = unlimited)</span>
                <input name="perCustomer" type="number" defaultValue={1} className="input" />
              </label>
              <label className="block">
                <span className="label">Total uses (optional)</span>
                <input name="usageLimit" type="number" className="input" />
              </label>
              <label className="block">
                <span className="label">Expires</span>
                <input name="expiresAt" type="datetime-local" className="input" />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Internal note</span>
                <input name="note" className="input" />
              </label>
              <div className="sm:col-span-2">
                <Submit>Create coupon</Submit>
              </div>
            </ActionForm>
          </Drawer>
        }
      >
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Valid</th>
                <th className="num">Used</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className={c.isActive ? "" : "opacity-60"}>
                  <td>
                    <span className="font-mono font-semibold">{c.code}</span>
                    <span className="block text-xs text-stone-500">{c.note}</span>
                  </td>
                  <td>{c.type === "PERCENT" ? `${c.value}%${c.maxDiscount ? ` (max ৳${c.maxDiscount})` : ""}` : c.type === "FIXED" ? `৳${c.value}` : "Free delivery"}</td>
                  <td className="text-xs">
                    Min ৳{c.minOrder} · {c.perCustomer || "∞"} per customer
                    {c.usageLimit != null && ` · ${c.usageLimit} total`}
                  </td>
                  <td className="text-xs">{c.expiresAt ? `until ${fmtDate(c.expiresAt)}` : "no expiry"}</td>
                  <td className="num">{c.usedCount}</td>
                  <td>
                    <ActionForm action={couponAction}>
                      {Object.entries({
                        id: c.id,
                        code: c.code,
                        type: c.type,
                        value: c.value,
                        minOrder: c.minOrder,
                        maxDiscount: c.maxDiscount ?? "",
                        usageLimit: c.usageLimit ?? "",
                        perCustomer: c.perCustomer,
                        startsAt: toLocalDateTimeValue(c.startsAt),
                        expiresAt: toLocalDateTimeValue(c.expiresAt),
                        note: c.note,
                      }).map(([k, v]) => (
                        <input key={k} type="hidden" name={k} value={String(v)} />
                      ))}
                      {!c.isActive && <input type="hidden" name="isActive" value="on" />}
                      <Submit variant="outline">{c.isActive ? "Disable" : "Enable"}</Submit>
                    </ActionForm>
                  </td>
                  <td className="text-right">
                    <DeleteButton type="coupon" id={c.id} title={`Delete coupon ${c.code}?`} description="Customers can no longer use this code. Past orders keep their discount." />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
