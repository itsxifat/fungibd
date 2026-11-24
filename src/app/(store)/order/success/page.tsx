import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { verifySig } from "@/lib/security";
import { OrderSummaryCard } from "@/components/store/OrderSummaryCard";

export const metadata: Metadata = { title: "অর্ডার সম্পন্ন · Order placed", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ o?: string; k?: string }> }) {
  const { o = "", k } = await searchParams;
  if (!verifySig(`success:${o}`, k)) notFound();
  const nos = o.split(",").filter(Boolean).slice(0, 5);
  const orders = await db.order.findMany({ where: { orderNo: { in: nos } }, include: { items: true, events: true }, orderBy: { createdAt: "asc" } });
  if (!orders.length) notFound();
  const email = orders[0].email;

  return (
    <div className="container-x max-w-3xl py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-brand" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে</h1>
        <p className="mt-2 text-muted">Thank you — your order has been placed.</p>
        <p className="mx-auto mt-4 max-w-lg font-bangla text-ink-soft">
          আমরা শীঘ্রই আপনার সাথে যোগাযোগ করে অর্ডারটি নিশ্চিত করব।{email && ` অর্ডারের বিস্তারিত ${email} ঠিকানায় ইমেইল করা হয়েছে।`}
        </p>
        {orders.length > 1 && (
          <p className="mx-auto mt-4 max-w-lg rounded-xl bg-cream/70 p-3 font-bangla text-sm text-ink-soft">
            আপনার কার্টে প্রি-অর্ডারের পণ্য থাকায় অর্ডারটি {orders.length}টি আলাদা ডেলিভারিতে ভাগ করা হয়েছে।
          </p>
        )}
      </div>
      <div className="mt-10 space-y-6">
        {orders.map((ord) => (
          <OrderSummaryCard key={ord.id} o={ord} showTimeline={false} />
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href={`/track?order=${orders[0].orderNo}&phone=${orders[0].phone}`} className="btn btn-primary">
          অর্ডার ট্র্যাক করুন
        </Link>
        <Link href="/shop" className="btn btn-outline">
          আরও কেনাকাটা করুন
        </Link>
      </div>
    </div>
  );
}
