import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banknote, Check, ChevronRight, Clock, Leaf, Snowflake, Star, Truck, UtensilsCrossed } from "lucide-react";
import { db } from "@/lib/db";
import { getProduct, getProducts } from "@/lib/store-data";
import { getSettings } from "@/lib/settings";
import { parseJson, num } from "@/lib/utils";
import { fmtDate } from "@/lib/dates";
import { AddToCart } from "@/components/store/AddToCart";
import { ProductCard } from "@/components/store/ProductCard";
import { Gallery } from "@/components/store/Gallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return { title: `${p.dto.nameBn} · ${p.dto.nameEn}`, description: `${p.dto.shortBn} ${p.dto.shortEn}` };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getProduct(slug);
  if (!found) notFound();
  const { dto: p, row } = found;
  const [, reviews, related] = await Promise.all([
    getSettings(),
    db.review.findMany({ where: { productId: p.id, isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    getProducts({ id: { not: p.id }, ...(row.categoryId ? { categoryId: row.categoryId } : {}) }),
  ]);
  const highlights = parseJson<string[]>(row.highlights, []);
  const pre = p.variants.some((v) => v.mode === "PREORDER");

  return (
    <div className="container-x pb-10 pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          হোম
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-brand">
          শপ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">{p.nameBn}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Gallery images={p.images} alt={p.nameEn} badge={pre ? "প্রি-অর্ডার · Pre-order" : p.badge} />

        <div className="lg:py-4">
          {p.rating.count > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < Math.round(p.rating.avg) ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-line-strong"} />
                ))}
              </span>
              {p.rating.avg.toFixed(1)} · {p.rating.count} reviews
            </a>
          )}
          <h1 className="mt-2 font-display text-5xl leading-tight sm:text-6xl">{p.nameBn}</h1>
          <p className="mt-1 text-lg text-muted">{p.nameEn}</p>
          <p className="mt-5 font-bangla text-lg leading-relaxed text-ink-soft">{p.shortBn}</p>
          <p className="mt-1 text-sm text-muted">{p.shortEn}</p>

          <div className="mt-8 rounded-[1.75rem] border border-line bg-white p-6">
            <AddToCart product={p} size="full" />
            {pre && p.preorder.cap != null && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted">
                  <span>এই হারভেস্টে বুক হয়েছে · Booked</span>
                  <span>
                    {num(p.preorder.booked, 2)} / {num(p.preorder.cap)} {p.stockUnit}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (p.preorder.booked / p.preorder.cap) * 100)}%` }} />
                </div>
                {p.preorder.cutoff && <p className="mt-2 text-xs text-muted">Pre-order closes {fmtDate(new Date(p.preorder.cutoff), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>}
                {p.preorder.note && <p className="mt-2 font-bangla text-sm text-ink-soft">{p.preorder.note}</p>}
              </div>
            )}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-bangla text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand" /> ঢাকার ভিতরে হোম ডেলিভারি
            </li>
            <li className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-brand" /> ক্যাশ অন ডেলিভারি
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" /> নিজের পছন্দের দিন ও সময়
            </li>
          </ul>

          {highlights.length > 0 && (
            <ul className="mt-8 space-y-2.5">
              {highlights.map((h) => (
                <li key={h} className="flex gap-3 font-bangla text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-cream">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* details */}
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <section className="rounded-[1.75rem] border border-line bg-white p-7 lg:col-span-1">
          <h2 className="flex items-center gap-2 font-display text-2xl">
            <Leaf className="h-5 w-5 text-brand" /> বিবরণ
          </h2>
          <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.descriptionBn}</p>
          {row.descriptionEn && <p className="mt-3 text-sm leading-relaxed text-muted">{row.descriptionEn}</p>}
        </section>
        {row.cookingTips && (
          <section className="rounded-[1.75rem] bg-tan/30 p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <UtensilsCrossed className="h-5 w-5 text-brand" /> রান্নার টিপস
            </h2>
            <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.cookingTips}</p>
          </section>
        )}
        {row.storageTips && (
          <section className="rounded-[1.75rem] bg-brand-tint p-7">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Snowflake className="h-5 w-5 text-brand" /> সংরক্ষণ
            </h2>
            <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.storageTips}</p>
          </section>
        )}
      </div>

      {/* reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl">
          রিভিউ <span className="text-muted">· Reviews ({reviews.length})</span>
        </h2>
        {reviews.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-3xl border border-line bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-line-strong"} />
                    ))}
                  </div>
                  <span className="text-xs text-muted">{fmtDate(r.createdAt)}</span>
                </div>
                <blockquote className="mt-3 font-bangla leading-relaxed">{r.comment}</blockquote>
                <figcaption className="mt-3 text-sm text-muted">
                  — {r.name}
                  {r.area ? `, ${r.area}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">এখনো কোনো রিভিউ নেই। অর্ডার ডেলিভারির পর ইমেইলে রিভিউ লিংক পাবেন। · No reviews yet.</p>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">
            আরও দেখুন <span className="text-muted">· You may also like</span>
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
