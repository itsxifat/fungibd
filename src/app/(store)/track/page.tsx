import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/utils";
import { OrderSummaryCard } from "@/components/store/OrderSummaryCard";

export const metadata: Metadata = { title: "অর্ডার ট্র্যাক · Track order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const sp = await searchParams;
  const orderNo = (sp.order ?? "").trim().toUpperCase();
  const phone = normalizePhone(sp.phone ?? "");
  const searched = Boolean(sp.order || sp.phone);
  const order = orderNo && phone ? await db.order.findFirst({ where: { orderNo, phone }, include: { items: true, events: { orderBy: { createdAt: "asc" } } } }) : null;

  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="font-display text-4xl">অর্ডার ট্র্যাক করুন</h1>
      <p className="mt-2 text-muted">Track your order with the order number and mobile number.</p>
      <form className="mt-8 grid gap-3 rounded-xl border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="order">
            অর্ডার নম্বর · Order no.
          </label>
          <input id="order" name="order" defaultValue={sp.order} placeholder="FB1234" className="input uppercase" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            মোবাইল · Mobile
          </label>
          <input id="phone" name="phone" defaultValue={sp.phone} placeholder="01XXXXXXXXX" inputMode="tel" className="input" required />
        </div>
        <button className="btn btn-primary h-[46px]">
          <Search className="h-4 w-4" /> খুঁজুন
        </button>
      </form>
      <div className="mt-8">
        {order ? (
          <OrderSummaryCard o={order} />
        ) : (
          searched && <p className="rounded-xl bg-red-50 p-4 font-bangla text-sm text-red-700">এই তথ্যে কোনো অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও মোবাইল নম্বর আবার দেখুন। · No order found.</p>
        )}
      </div>
    </div>
  );
}
