import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { getProducts, isPreorderOnly, nextHarvestDate, sortPreorders } from "@/lib/store-data";
import { fmtDateBn } from "@/lib/dates";
import { ProductCard } from "@/components/store/ProductCard";
import { HarvestAlertForm } from "@/components/store/HarvestAlertForm";
import { PreorderSteps } from "@/components/store/PreorderSteps";

export const metadata: Metadata = { title: "প্রি-অর্ডার · Pre-order fresh mushrooms" };

export default async function PreorderPage() {
  const all = await getProducts();
  const products = sortPreorders(all.filter(isPreorderOnly));
  const next = nextHarvestDate(products);

  return (
    <div className="container-x pb-10 pt-10">
      <div className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">প্রি-অর্ডার</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">পরের হারভেস্ট থেকে বুক করুন</h1>
          <p className="mt-3 max-w-xl font-bangla text-[17px] leading-relaxed text-ink-soft">
            আমাদের খামারের সব তাজা মাশরুম প্রি-অর্ডারে বিক্রি হয়। এখন বুক করে রাখুন — হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি।
          </p>
          {next && (
            <p className="mt-5 flex items-center gap-2 font-bangla text-[15px] text-ink-soft">
              <CalendarClock className="size-[18px] text-muted" aria-hidden /> পরের হারভেস্ট · {fmtDateBn(next, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
        </div>
        <PreorderSteps className="sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3" />
      </div>

      {products.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-xl text-center">
          <p className="font-display text-2xl">এই মুহূর্তে প্রি-অর্ডার বন্ধ</p>
          <p className="mt-2 font-bangla text-ink-soft">পরের হারভেস্টের বুকিং খুললেই জানিয়ে দেব।</p>
          <div className="mt-6 text-left">
            <HarvestAlertForm interest="Pre-order opening alert" />
          </div>
        </div>
      )}
    </div>
  );
}
