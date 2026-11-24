import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getProducts, isPreorderOnly } from "@/lib/store-data";
import { ProductCard } from "@/components/store/ProductCard";
import { bnDigits, cn } from "@/lib/utils";
import { storefrontMetadata } from "@/lib/seo";

type ShopSearch = { category?: string; filter?: string; q?: string };
const shopMetadata = storefrontMetadata(
  "/shop", "Mushroom Products · মাশরুমের তৈরি পণ্য",
  "Dried mushrooms, mushroom powder and grow-at-home kits made from FungiBd's own harvest. In stock items ship now, cash on delivery in supported areas of Dhaka.",
);

export async function generateMetadata({ searchParams }: { searchParams: Promise<ShopSearch> }): Promise<Metadata> {
  const { category, filter, q } = await searchParams;
  return category || filter || q ? { ...shopMetadata, robots: { index: false, follow: true } } : shopMetadata;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearch> }) {
  const sp = await searchParams;
  // Fresh mushrooms are sold by pre-order only — old "/shop?filter=preorder" links go to the pre-order page.
  if (sp.filter === "preorder") redirect("/preorder");

  const [cats, all] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), getProducts()]);
  const shopProducts = all.filter((p) => !isPreorderOnly(p));
  const hasPreorder = all.some(isPreorderOnly);
  const shopCats = cats.filter((c) => shopProducts.some((p) => p.categorySlug === c.slug));
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const products = shopProducts.filter((p) => {
    if (sp.category && p.categorySlug !== sp.category) return false;
    if (sp.filter === "instock" && !p.variants.some((v) => v.mode === "IN_STOCK")) return false;
    if (q && !`${p.nameEn} ${p.nameBn} ${p.shortEn} ${p.shortBn}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category: sp.category, filter: sp.filter, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) => cn("chip rounded-lg border px-3.5 py-2 text-sm transition-colors duration-150", active ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink");

  return (
    <div className="container-x pb-10 pt-10">
      <div className="border-b border-line pb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">মাশরুমের তৈরি পণ্য</h1>
          <p className="mt-2 max-w-xl font-bangla text-ink-soft">
            আমাদের খামারের মাশরুম দিয়ে তৈরি — শুকনো মাশরুম, পাউডার আর ঘরে চাষের কিট। স্টকে যা আছে, আজই অর্ডার করা যায়।{" "}
            <Link href="/delivery" className="font-medium text-brand underline underline-offset-2">ডেলিভারি এলাকা দেখুন</Link>
          </p>
        </div>
      </div>

      {q && (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-bangla text-[15px] text-ink-soft">
          <Search className="size-4 text-muted" aria-hidden />
          “{sp.q}” খোঁজার ফলাফল · {bnDigits(products.length)}টি পণ্য
          <Link href={href({ q: undefined })} className="font-medium text-brand underline-offset-4 hover:underline">
            খোঁজা মুছুন
          </Link>
        </p>
      )}

      {hasPreorder && (
        <Link href="/preorder" className="group mt-6 flex items-center gap-3 rounded-xl border border-line bg-cream/50 px-5 py-4 transition-colors duration-150 hover:border-line-strong">
          <CalendarClock className="size-5 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-bangla font-semibold">তাজা মাশরুম খুঁজছেন?</span>
            <span className="block font-bangla text-sm text-ink-soft">তাজা মাশরুম শুধু প্রি-অর্ডারে পাওয়া যায় — পরের হারভেস্ট থেকে বুক করুন।</span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-ink-soft" aria-hidden />
        </Link>
      )}

      {shopCats.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
          <Link href={href({ category: undefined })} className={chip(!sp.category)}>
            সব
          </Link>
          {shopCats.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={chip(sp.category === c.slug)}>
              {c.nameBn}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Link href={href({ filter: sp.filter === "instock" ? undefined : "instock" })} className={chip(sp.filter === "instock")}>
            স্টকে আছে
          </Link>
        </div>
      )}

      <h2 className="sr-only">পণ্যের তালিকা</h2>
      {products.length ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} buyNow />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl">কিছু পাওয়া যায়নি</p>
          <p className="text-muted">No products match these filters.</p>
          <Link href="/shop" className="btn btn-outline mt-6">
            সব দেখুন
          </Link>
        </div>
      )}
    </div>
  );
}
