import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/store-data";
import { ProductCard } from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "শপ · Shop fresh mushrooms" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; filter?: string; q?: string }> }) {
  const sp = await searchParams;
  const [cats, all] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), getProducts()]);
  const q = (sp.q ?? "").trim().toLowerCase();
  const products = all.filter((p) => {
    if (sp.category && p.categorySlug !== sp.category) return false;
    if (sp.filter === "preorder" && !p.variants.some((v) => v.mode === "PREORDER")) return false;
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
  const chip = (active: boolean) => cn("chip border px-4 py-2 text-sm transition", active ? "border-brand bg-brand text-cream" : "border-line-strong bg-white text-ink-soft hover:border-brand hover:text-brand");

  return (
    <div className="container-x pb-10 pt-10">
      <div className="flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">{sp.filter === "preorder" ? "প্রি-অর্ডার" : "সব মাশরুম"}</h1>
          <p className="mt-2 max-w-xl font-bangla text-ink-soft">
            {sp.filter === "preorder" ? "এখনই বুক করুন, হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি। টাকা দেবেন ডেলিভারির সময়।" : "আমাদের নিজস্ব খামারের মাশরুম — অনলাইনে অর্ডার করুন।"}
          </p>
        </div>
        <form action="/shop" className="flex w-full max-w-sm items-center gap-2 rounded-full border border-line-strong bg-white p-1.5 pl-4">
          <Search className="h-4 w-4 text-muted" />
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <label htmlFor="shop-q" className="sr-only">
            Search
          </label>
          <input id="shop-q" name="q" defaultValue={sp.q} placeholder="খুঁজুন · Search mushrooms" className="h-10 flex-1 bg-transparent text-sm outline-none" />
          <button className="btn btn-primary btn-sm">খুঁজুন</button>
        </form>
      </div>

      <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
        <Link href={href({ category: undefined })} className={chip(!sp.category)}>
          সব · All
        </Link>
        {cats.map((c) => (
          <Link key={c.id} href={href({ category: c.slug })} className={chip(sp.category === c.slug)}>
            {c.nameBn} · {c.nameEn}
          </Link>
        ))}
        <span className="mx-1 w-px shrink-0 bg-line" />
        <Link href={href({ filter: sp.filter === "instock" ? undefined : "instock" })} className={chip(sp.filter === "instock")}>
          আজ স্টকে আছে
        </Link>
        <Link href={href({ filter: sp.filter === "preorder" ? undefined : "preorder" })} className={chip(sp.filter === "preorder")}>
          প্রি-অর্ডার
        </Link>
      </div>

      {products.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl">কিছু পাওয়া যায়নি</p>
          <p className="text-muted">No mushrooms match these filters.</p>
          <Link href="/shop" className="btn btn-outline mt-6">
            সব দেখুন
          </Link>
        </div>
      )}
    </div>
  );
}
