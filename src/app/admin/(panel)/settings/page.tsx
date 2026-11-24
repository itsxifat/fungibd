import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getSmtpPublic } from "@/lib/email/config";
import { SmtpForm } from "./SmtpForm";
import { HeroSlidesEditor } from "./HeroSlidesEditor";
import { EMAIL_PREVIEWS } from "@/lib/email/previews";
import { ADMIN_ROLES } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Badge, Card, PageHeader, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { UploadField } from "@/components/admin/UploadField";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { saveBrandAction, saveCrmAction, saveDeliveryAction, saveEmailAction, saveHomeAction, saveStoreAction, testEmailAction, userAction } from "./actions";

export const metadata = { title: "Settings" };

const TABS = [
  ["store", "Store"],
  ["brand", "Brand"],
  ["delivery", "Delivery"],
  ["home", "Home page"],
  ["email", "Email"],
  ["crm", "Customers"],
  ["team", "Team"],
  ["backup", "Backup"],
] as const;

const In = ({ label, name, value, hint, type = "text", className }: { label: string; name: string; value: string | number; hint?: string; type?: string; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="label">{label}</span>
    <input name={name} type={type} step={type === "number" ? "any" : undefined} defaultValue={value} className="input input-sm" />
    {hint && <span className="hint block">{hint}</span>}
  </label>
);

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireAdmin(["OWNER"]);
  const [{ tab = "store" }, s] = await Promise.all([searchParams, getSettings()]);
  const [users, emails, smtp] = await Promise.all([
    tab === "team" ? db.adminUser.findMany({ orderBy: { createdAt: "asc" } }) : [],
    tab === "email" ? db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }) : [],
    tab === "email" ? getSmtpPublic() : null,
  ]);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/settings?tab=${k}`} className={cn("-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm", tab === k ? "border-brand font-semibold" : "border-transparent text-stone-500 hover:text-stone-900")}>
            {l}
          </Link>
        ))}
      </div>

      {tab === "store" && (
        <Card title="Store information" className="max-w-3xl">
          <ActionForm action={saveStoreAction} className="grid gap-4 sm:grid-cols-2">
            <In label="Store name" name="name" value={s.store.name} />
            <In label="Contact email (shown on site & emails)" name="email" value={s.store.email} />
            <In label="Tagline (Bangla)" name="taglineBn" value={s.store.taglineBn} />
            <In label="Tagline (English)" name="taglineEn" value={s.store.taglineEn} />
            <In label="Phone" name="phone" value={s.store.phone} />
            <In label="WhatsApp number" name="whatsapp" value={s.store.whatsapp} hint="e.g. 8801XXXXXXXXX" />
            <In label="Address (shown on site)" name="address" value={s.store.address} />
            <In label="Farm address (internal)" name="farmAddress" value={s.store.farmAddress} />
            <In label="Opening hours (optional)" name="hours" value={s.store.hours} className="sm:col-span-2" />
            <In label="Facebook page URL" name="facebook" value={s.store.facebook} />
            <In label="Instagram URL" name="instagram" value={s.store.instagram} />
            <In label="YouTube URL" name="youtube" value={s.store.youtube} />
            <div className="sm:col-span-2">
              <Submit>Save</Submit>
            </div>
          </ActionForm>
        </Card>
      )}

      {tab === "brand" && (
        <Card title="Logo & colours" className="max-w-3xl">
          <ActionForm action={saveBrandAction} className="space-y-5">
            <div>
              <span className="label">Logo for light backgrounds (header)</span>
              <UploadField name="logoUrl" defaultValue={s.brand.logoUrl} folder="brand" />
            </div>
            <div>
              <span className="label">Logo for dark/green backgrounds</span>
              <UploadField name="logoDarkUrl" defaultValue={s.brand.logoDarkUrl} folder="brand" previewBg={s.brand.primary} />
            </div>
            <div>
              <span className="label">Email header logo (PNG works best in email apps)</span>
              <UploadField name="emailLogoUrl" defaultValue={s.brand.emailLogoUrl} folder="brand" previewBg={s.brand.primary} />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {(
                [
                  ["primary", "Primary (green)"],
                  ["accent", "Accent (tan)"],
                  ["background", "Cream"],
                  ["ink", "Text"],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="block">
                  <span className="label">{l}</span>
                  <span className="flex items-center gap-2">
                    <span className="h-8 w-8 shrink-0 rounded-md border border-stone-200" style={{ background: s.brand[k] }} />
                    <input name={k} defaultValue={s.brand[k]} className="input input-sm font-mono" pattern="#[0-9a-fA-F]{6}" />
                  </span>
                </label>
              ))}
            </div>
            <Submit>Save brand</Submit>
          </ActionForm>
        </Card>
      )}

      {tab === "delivery" && (
        <Card title="Delivery rules" className="max-w-3xl">
          <ActionForm action={saveDeliveryAction} className="grid gap-4 sm:grid-cols-2">
            <In label="Free delivery from (৳)" name="freeDeliveryMin" type="number" value={s.delivery.freeDeliveryMin} hint="0 = never free" />
            <In label="Minimum order (৳)" name="minOrder" type="number" value={s.delivery.minOrder} hint="0 = no minimum" />
            <In label="Same-day orders accepted until (hour, 0–23)" name="sameDayCutoffHour" type="number" value={s.delivery.sameDayCutoffHour} hint="After this hour, the earliest delivery day is tomorrow" />
            <In label="Customers can choose up to (days ahead)" name="daysAhead" type="number" value={s.delivery.daysAhead} />
            <label className="block sm:col-span-2">
              <span className="label">Time slots (one per line)</span>
              <textarea name="slots" defaultValue={s.delivery.slots.join("\n")} className="input input-sm min-h-24" />
            </label>
            <In label="Delivery area centre — latitude" name="centerLat" type="number" value={s.delivery.centerLat} />
            <In label="Delivery area centre — longitude" name="centerLng" type="number" value={s.delivery.centerLng} />
            <In label="Delivery radius (km)" name="radiusKm" type="number" value={s.delivery.radiusKm} hint="Map pins outside this circle are rejected at checkout" />
            <In label="Delivery coverage line (Bangla)" name="coverageNote" value={s.delivery.coverageNote} hint="Shown on the home page, footer and emails — e.g. “শুধুমাত্র ঢাকা সিটির ভিতরে ডেলিভারি”. Update it when you reach new cities." className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <Submit>Save</Submit>
            </div>
          </ActionForm>
          <p className="mt-4 text-xs text-stone-500">
            Delivery areas and charges are managed on the <Link href="/admin/delivery" className="text-brand underline">Delivery</Link> page.
          </p>
        </Card>
      )}

      {tab === "home" && (
        <ActionForm action={saveHomeAction} className="max-w-4xl space-y-6">
          <Card title="Top of the home page (hero)" description="The text on the left of the home page. Keep it short — one headline, one line, one or two buttons.">
            <div className="grid gap-4 sm:grid-cols-2">
              <In label="Announcement bar" name="announcement" value={s.home.announcement} hint="Thin bar above the menu on every page. Empty = hidden." className="sm:col-span-2" />
              <In label="Small label above the headline" name="heroEyebrow" value={s.home.heroEyebrow} hint="Empty = shows the next harvest date automatically" className="sm:col-span-2" />
              <In label="Headline (Bangla) *" name="heroTitleBn" value={s.home.heroTitleBn} className="sm:col-span-2" />
              <label className="block sm:col-span-2">
                <span className="label">Short text under the headline</span>
                <textarea name="heroSubBn" defaultValue={s.home.heroSubBn} className="input input-sm min-h-20" />
              </label>
              <In label="English line (optional)" name="heroTitleEn" value={s.home.heroTitleEn} hint="Small grey line under the headline. Empty = hidden." className="sm:col-span-2" />
              <In label="Main button — text" name="heroCtaLabel" value={s.home.heroCtaLabel} />
              <In label="Main button — link" name="heroCtaHref" value={s.home.heroCtaHref} hint="e.g. /preorder" />
              <In label="Second button — text" name="heroCta2Label" value={s.home.heroCta2Label} hint="Empty = hidden" />
              <In label="Second button — link" name="heroCta2Href" value={s.home.heroCta2Href} hint="e.g. /shop" />
            </div>
          </Card>
          <Card title="Hero slider" description="Pictures on the right of the home page. Customers can click them; they change every few seconds.">
            <HeroSlidesEditor
              name="heroSlides"
              defaultValue={s.home.heroSlides.length ? s.home.heroSlides : s.home.heroImage ? [{ image: s.home.heroImage, title: "", caption: "", href: "" }] : []}
            />
          </Card>
          <Card title="Benefits page">
            <In label="Extra video URL (optional)" name="benefitsVideoUrl" value={s.home.benefitsVideoUrl} hint="A YouTube link or an .mp4 link. Shown on the Benefits page below the motion video." />
          </Card>
          <Submit>Save home page</Submit>
        </ActionForm>
      )}

      {tab === "email" && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
            <Card
              title="Email server (SMTP)"
              description="The mailbox FungiBd sends order emails from."
              actions={smtp ? <Badge tone="green">{smtp.source === "admin" ? "Connected" : "Using .env settings"}</Badge> : <Badge tone="amber">Not set up — emails are not sent</Badge>}
            >
              <SmtpForm smtp={smtp} />
            </Card>
            <div className="space-y-6">
              <Card title="Send a test email">
                <ActionForm action={testEmailAction} className="space-y-3">
                  <In label="Send to" name="to" value={me.email} />
                  <Submit variant="outline">Send test</Submit>
                </ActionForm>
              </Card>
              <Card title="Preview emails" description="See exactly what customers receive — opens in a new tab, nothing is sent.">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EMAIL_PREVIEWS).map(([k, l]) => (
                    <a key={k} href={`/api/admin/email-preview?type=${k}`} target="_blank" rel="noreferrer" className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-700 hover:border-brand hover:text-brand">
                      {l}
                    </a>
                  ))}
                </div>
              </Card>
              <Card title="Tips for reaching the inbox">
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-600">
                  <li>Send from an address on your own domain, e.g. orders@fungibd.com.</li>
                  <li>Add the SPF and DKIM DNS records your email provider gives you for fungibd.com.</li>
                  <li>Gmail allows about 500 emails/day; Zoho and Brevo are better for marketing campaigns.</li>
                </ul>
              </Card>
            </div>
          </div>

          <Card title="Who gets emails" description="Choose which emails are sent and who receives shop alerts.">
            <ActionForm action={saveEmailAction} className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Emails to customers</p>
                {(
                  [
                    ["sendCustomerEmails", "Send emails to customers at all"],
                    ["onPlaced", "Order received (and pre-order booked)"],
                    ["onConfirmed", "Order confirmed"],
                    ["onOutForDelivery", "Out for delivery"],
                    ["onDelivered", "Delivered (with review link)"],
                    ["onCancelled", "Order cancelled"],
                  ] as const
                ).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm">
                    <input type="checkbox" name={k} defaultChecked={s.email[k]} className="h-4 w-4 accent-[var(--brand)]" /> {l}
                  </label>
                ))}
                <p className="text-xs text-stone-500">Pre-order “harvest ready” and support replies are always sent when you trigger them.</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Shop alerts (to you and your team)</p>
                <label className="block">
                  <span className="label">Alert email addresses — one per line or comma separated</span>
                  <textarea name="notifyAdminEmail" defaultValue={s.email.notifyAdminEmail.split(/\s*,\s*/).join("\n")} className="input min-h-24" placeholder={s.store.email} />
                  <span className="hint block">Empty = {s.store.email}</span>
                </label>
                {(
                  [
                    ["adminNewOrder", "New order placed on the website"],
                    ["adminNewTicket", "New support message"],
                    ["adminNewLead", "New wholesale inquiry"],
                  ] as const
                ).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2.5 text-sm">
                    <input type="checkbox" name={k} defaultChecked={s.email[k]} className="h-4 w-4 accent-[var(--brand)]" /> {l}
                  </label>
                ))}
              </div>
              <div className="lg:col-span-2">
                <Submit>Save email preferences</Submit>
              </div>
            </ActionForm>
          </Card>

          <Card title="Email log (latest 40)" pad={false}>
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>To</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap text-xs">{fmtDateTime(e.createdAt)}</td>
                      <td>{e.to}</td>
                      <td className="max-w-md truncate">{e.subject}</td>
                      <td>
                        <Badge tone={e.status === "SENT" ? "green" : e.status === "FAILED" ? "red" : "gray"}>{e.status.toLowerCase()}</Badge>
                        {e.error && <span className="block text-xs text-stone-500">{e.error.slice(0, 80)}</span>}
                      </td>
                    </tr>
                  ))}
                  {!emails.length && (
                    <tr>
                      <td colSpan={4} className="text-center text-stone-500">
                        No emails yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === "crm" && (
        <Card title="Customer segments" className="max-w-2xl">
          <ActionForm action={saveCrmAction} className="grid gap-4 sm:grid-cols-3">
            <In label="“At risk” after (days without order)" name="atRiskDays" type="number" value={s.crm.atRiskDays} />
            <In label="“Lost” after (days)" name="lostDays" type="number" value={s.crm.lostDays} />
            <In label="“Loyal” from (orders)" name="loyalOrders" type="number" value={s.crm.loyalOrders} />
            <div className="sm:col-span-3">
              <Submit>Save</Submit>
            </div>
          </ActionForm>
        </Card>
      )}

      {tab === "team" && (
        <Card title="Team members" pad={false}>
          <div className="divide-y divide-stone-200">
            {users.map((u) => (
              <ActionForm key={u.id} action={userAction} className="grid items-end gap-3 p-4 md:grid-cols-[1.2fr_1.4fr_1fr_1.2fr_auto_auto]">
                <input type="hidden" name="id" value={u.id} />
                <In label="Name" name="name" value={u.name} />
                <label className="block">
                  <span className="label">Email</span>
                  <input value={u.email} disabled className="input input-sm bg-stone-50" />
                  <span className="hint block">Last login {u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "never"}</span>
                </label>
                <label className="block">
                  <span className="label">Role</span>
                  <select name="role" defaultValue={u.role} className="input input-sm">
                    {Object.entries(ADMIN_ROLES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <In label="New password (optional)" name="password" type="password" value="" />
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={u.isActive} /> Active
                </label>
                <div className="flex items-center gap-1">
                  <Submit variant="outline">Save</Submit>
                  {u.id !== me.id && <DeleteButton type="user" id={u.id} title={`Remove ${u.name}?`} description="They will no longer be able to sign in to the admin panel." />}
                </div>
              </ActionForm>
            ))}
            <ActionForm action={userAction} resetOnSuccess className="grid items-end gap-3 bg-stone-50 p-4 md:grid-cols-[1.2fr_1.4fr_1fr_1.2fr_auto]">
              <In label="Name" name="name" value="" />
              <In label="Email" name="email" type="email" value="" />
              <label className="block">
                <span className="label">Role</span>
                <select name="role" defaultValue="STAFF" className="input input-sm">
                  {Object.entries(ADMIN_ROLES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <In label="Password (min 12)" name="password" type="password" value="" />
              <Submit>Add member</Submit>
            </ActionForm>
          </div>
        </Card>
      )}

      {tab === "backup" && (
        <Card title="Backup" className="max-w-2xl">
          <p className="text-sm leading-relaxed text-stone-600">
            All your data (orders, customers, farm records, finance) lives in one database file on the office server. Download a copy regularly and keep it somewhere safe (Google Drive, a USB drive). Uploaded photos are in the <code>uploads</code> folder — back that up too.
          </p>
          <a href="/api/admin/backup" className="btn btn-primary btn-sm mt-5 rounded-lg">
            <Download className="h-4 w-4" /> Download database backup
          </a>
          <p className="mt-3 text-xs text-stone-500">Automatic daily backups can be scheduled on the server — see DEPLOYMENT.md (npm run backup).</p>
        </Card>
      )}
    </>
  );
}
