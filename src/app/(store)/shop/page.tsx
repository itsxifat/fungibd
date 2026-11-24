import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getProducts, isPreorderOnly } from "@/lib/store-data";
import { ProductCard } from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "শপ · Mushroom products" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; filter?: string; q?: string }> }) {
  const sp = await searchParams;
  // Fresh mushrooms are sold by pre-order only — old "/shop?filter=preorder" links go to the pre-order page.
  if (sp.filter === "preorder") redirect("/preorder");

  const [cats, all] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), getProducts()]);
  const shopProducts = all.filter((p) => !isPreorderOnly(p));
  const hasPreorder = all.some(isPreorderOnly);
  const shopCats = cats.filter((c) => shopProducts.some((p) => p.categorySlug === c.slug));
  const q = (sp.q ?? "").trim().toLowerCase();
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
      <div className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">শপ</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">মাশরুমের তৈরি পণ্য</h1>
          <p className="mt-2 max-w-xl font-bangla text-ink-soft">আমাদের খামারের মাশরুম দিয়ে তৈরি — শুকনো মাশরুম, পাউডার আর ঘরে চাষের কিট। স্টকে যা আছে, আজই অর্ডার করা যায়।</p>
        </div>
        <form action="/shop" className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-line-strong bg-white p-1.5 pl-4">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <label htmlFor="shop-q" className="sr-only">
            Search
          </label>
          <input id="shop-q" name="q" defaultValue={sp.q} placeholder="খুঁজুন · Search" className="h-10 flex-1 bg-transparent text-sm outline-none" />
          <button className="btn btn-primary btn-sm">খুঁজুন</button>
        </form>
      </div>

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
            সব · All
          </Link>
          {shopCats.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={chip(sp.category === c.slug)}>
              {c.nameBn} · {c.nameEn}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Link href={href({ filter: sp.filter === "instock" ? undefined : "instock" })} className={chip(sp.filter === "instock")}>
            স্টকে আছে
          </Link>
        </div>
      )}

      {products.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
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
