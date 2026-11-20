import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifySig } from "@/lib/security";
import { ReviewForm } from "@/components/store/StoreForms";

export const metadata = { title: "রিভিউ দিন · Review", robots: { index: false } };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ order?: string; k?: string }> }) {
  const { order = "", k = "" } = await searchParams;
  if (!verifySig(`review:${order}`, k)) notFound();
  const o = await db.order.findUnique({ where: { orderNo: order }, include: { items: true } });
  if (!o) notFound();
  const seen = new Set<string>();
  const products = o.items.filter((i) => i.productId && !seen.has(i.productId) && seen.add(i.productId)).map((i) => ({ id: i.productId!, nameBn: i.nameBn, nameEn: i.nameEn }));
  return (
    <div className="container-x max-w-2xl py-14">
      <h1 className="font-display text-3xl">আপনার মতামত দিন</h1>
      <p className="mt-2 text-muted">How were your mushrooms? Order {o.orderNo}</p>
      <div className="mt-8">
        <ReviewForm orderNo={o.orderNo} k={k} products={products} />
      </div>
    </div>
  );
}
