import Link from "next/link";
import { LogOut, MapPin, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth";
import { ORDER_STATUS, TICKET_STATUS, type OrderStatus } from "@/lib/constants";
import { fmtDate } from "@/lib/dates";
import { takaBn } from "@/lib/utils";
import { sign } from "@/lib/security";
import { ProfileForm } from "./AuthForms";
import { deleteAddressAction, logoutAction } from "./actions";

export const metadata = { title: "আমার অ্যাকাউন্ট · My account", robots: { index: false } };

export default async function AccountPage() {
  const c = await requireCustomer();
  const [orders, addresses, tickets] = await Promise.all([
    db.order.findMany({ where: { customerId: c.id }, orderBy: { createdAt: "desc" }, take: 30, include: { items: true } }),
    db.address.findMany({ where: { customerId: c.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.ticket.findMany({ where: { customerId: c.id }, orderBy: { updatedAt: "desc" }, take: 10 }),
  ]);
  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">স্বাগতম, {c.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">My account</p>
        </div>
        <form action={logoutAction}>
          <button className="btn btn-outline btn-sm">
            <LogOut className="h-4 w-4" /> লগআউট
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-line bg-white">
          <h2 className="border-b border-line px-5 py-4 font-semibold">আমার অর্ডার · Orders</h2>
          {orders.length ? (
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/track?order=${o.orderNo}&phone=${o.phone}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-cream/40">
                    <div>
                      <p className="font-semibold">
                        {o.orderNo} {o.type === "PREORDER" && <span className="chip ml-1 border border-line-strong text-ink-soft">প্রি-অর্ডার</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {fmtDate(o.createdAt)} · {o.items.map((i) => i.nameBn).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{takaBn(o.total)}</p>
                      <p className="font-bangla text-xs text-brand">{ORDER_STATUS[o.status as OrderStatus]?.bn}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-muted">
              এখনো কোনো অর্ডার নেই ·{" "}
              <Link href="/shop" className="text-brand underline">
                শপে যান
              </Link>
            </p>
          )}
        </section>

        <div className="space-y-8">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">প্রোফাইল · Profile</h2>
            <div className="mt-4">
              <ProfileForm c={{ name: c.name, email: c.email ?? "", phone: c.phone, marketingOptIn: c.marketingOptIn }} />
            </div>
          </section>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">সেভ করা ঠিকানা · Addresses</h2>
            <ul className="mt-3 space-y-3">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {a.line}
                  </span>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="rounded-md p-1 text-muted transition-colors duration-150 hover:text-red-600" aria-label="Delete address">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              ))}
              {!addresses.length && <li className="text-sm text-muted">অর্ডারের সময় ঠিকানা সেভ হবে</li>}
            </ul>
          </section>
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">সাপোর্ট · Support</h2>
              <Link href="/support" className="text-sm font-semibold text-brand hover:underline">
                নতুন মেসেজ
              </Link>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/support/ticket/${t.ticketNo}?k=${sign(`ticket:${t.ticketNo}`)}`} className="flex justify-between gap-2 hover:text-brand">
                    <span className="truncate">
                      {t.ticketNo} · {t.subject}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{TICKET_STATUS[t.status as keyof typeof TICKET_STATUS]?.bn}</span>
                  </Link>
                </li>
              ))}
              {!tickets.length && <li className="text-muted">কোনো টিকেট নেই</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
