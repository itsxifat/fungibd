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
      <div className="border-b border-line pb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">পরের হারভেস্ট থেকে বুক করুন</h1>
          <p className="mt-3 max-w-xl font-bangla text-[17px] leading-relaxed text-ink-soft">
            আমাদের খামারের সব তাজা মাশরুম প্রি-অর্ডারে বিক্রি হয়। এখন বুক করে রাখুন — হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি।
          </p>
          {next && (
            <p className="mt-5 flex items-center gap-2 font-bangla text-[15px] text-ink-soft">
              <CalendarClock className="size-[18px] text-muted" aria-hidden /> পরের হারভেস্ট · {fmtDateBn(next, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          )}
        </div>
        <PreorderSteps className="mt-8 rounded-xl border border-line bg-card px-5 sm:py-5" />
      </div>

      {products.length ? (
        <>
        <h2 className="sr-only">প্রি-অর্ডারের মাশরুম</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} layout="wide" />
          ))}
        </div>
        </>
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
