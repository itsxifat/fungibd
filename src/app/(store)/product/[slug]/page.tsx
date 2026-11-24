import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Banknote, Check, ChevronRight, Clock, Leaf, Snowflake, Star, Truck, UtensilsCrossed } from "lucide-react";
import { db } from "@/lib/db";
import { getProduct, getProducts, isPreorderOnly } from "@/lib/store-data";
import { getSettings } from "@/lib/settings";
import { bnDigits, parseJson, num } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import { AddToCart } from "@/components/store/AddToCart";
import { ProductCard } from "@/components/store/ProductCard";
import { Gallery } from "@/components/store/Gallery";
import { StructuredData } from "@/components/store/StructuredData";
import { breadcrumbData, productData, productPath, publicImage, storefrontMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const { dto, row } = p;
  const name = dto.nameEn || dto.nameBn;
  const description = [dto.shortEn || row.descriptionEn || dto.shortBn, "See pack sizes, prices and current availability for delivery in Dhaka."].filter(Boolean).join(" ");
  return storefrontMetadata(productPath(dto.slug), `${name} in Dhaka${dto.nameBn && dto.nameBn !== name ? ` · ${dto.nameBn}` : ""}`, description, dto.images.map(publicImage).find(Boolean));
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pack?: string }> }) {
  const [{ slug }, { pack }] = await Promise.all([params, searchParams]);
  const found = await getProduct(slug);
  if (!found) notFound();
  const { dto: p, row } = found;
  const [s, reviews, related] = await Promise.all([
    getSettings(),
    db.review.findMany({ where: { productId: p.id, isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    getProducts({ id: { not: p.id }, ...(row.categoryId ? { categoryId: row.categoryId } : {}) }),
  ]);
  const highlights = parseJson<string[]>(row.highlights, []);
  const pre = p.variants.some((v) => v.mode === "PREORDER");
  const preOnly = isPreorderOnly(p);
  const selectedPack = p.variants.find((variant) => variant.id === pack)?.id;
  const productMarkup = productData(p, p.shortEn || row.descriptionEn || p.shortBn || row.descriptionBn, s.store.name);

  return (
    <div className="container-x pb-10 pt-6">
      {productMarkup && <StructuredData data={productMarkup} />}
      <StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, preOnly ? { name: "Pre-order", path: "/preorder" } : { name: "Shop", path: "/shop" }, { name: p.nameEn || p.nameBn, path: productPath(p.slug) }])} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          হোম
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={preOnly ? "/preorder" : "/shop"} className="hover:text-brand">
          {preOnly ? "প্রি-অর্ডার" : "শপ"}
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-ink">{p.nameBn}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Gallery images={p.images} alt={p.nameEn} badge={p.badge} />

        <div className="lg:py-4">
          {p.rating.count > 0 && (
            <a href="#reviews" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < Math.round(p.rating.avg) ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-line-strong"} />
                ))}
              </span>
              {bnDigits(p.rating.avg.toFixed(1))} · {bnDigits(p.rating.count)}টি রিভিউ
            </a>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{p.nameBn}</h1>
          <p className="mt-1 text-lg text-muted">{p.nameEn}</p>
          <p className="mt-5 font-bangla text-lg leading-relaxed text-ink-soft">{p.shortBn}</p>
          <p className="mt-1 text-sm text-muted">{p.shortEn}</p>

          <div className="mt-8 rounded-2xl border border-line bg-white p-6">
            <AddToCart key={selectedPack ?? p.id} product={p} size="full" initialVariantId={selectedPack} />
            {pre && p.preorder.cap != null && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted">
                  <span className="font-bangla">এই হারভেস্টে বুক হয়েছে</span>
                  <span className="tabular-nums">
                    {bnDigits(num(p.preorder.booked, 2))} / {bnDigits(num(p.preorder.cap))} {p.stockUnit === "kg" ? "কেজি" : "পিস"}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (p.preorder.booked / p.preorder.cap) * 100)}%` }} />
                </div>
                {p.preorder.cutoff && <p className="mt-2 font-bangla text-xs text-muted">বুকিং বন্ধ হবে {fmtDateBn(new Date(p.preorder.cutoff), { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</p>}
                {p.preorder.note && <p className="mt-2 font-bangla text-sm text-ink-soft">{p.preorder.note}</p>}
              </div>
            )}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-bangla text-sm text-ink-soft">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-muted" aria-hidden />{" "}
              <Link href="/delivery" className="hover:text-ink hover:underline">
                {s.delivery.coverageNote || "হোম ডেলিভারি"}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Banknote className="size-4 text-muted" aria-hidden /> ক্যাশ অন ডেলিভারি
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-muted" aria-hidden /> নিজের পছন্দের দিন ও সময়
            </li>
          </ul>

          {highlights.length > 0 && (
            <ul className="mt-8 space-y-2.5">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2.5 font-bangla text-[15px]">
                  <Check className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* details */}
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2.5 font-display text-2xl">
            <Leaf className="size-[18px] text-muted" aria-hidden /> বিবরণ
          </h2>
          <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.descriptionBn}</p>
          {row.descriptionEn && <p className="mt-3 text-sm leading-relaxed text-muted">{row.descriptionEn}</p>}
        </section>
        {row.cookingTips && (
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="flex items-center gap-2.5 font-display text-2xl">
              <UtensilsCrossed className="size-[18px] text-muted" aria-hidden /> রান্নার টিপস
            </h2>
            <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.cookingTips}</p>
          </section>
        )}
        {row.storageTips && (
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="flex items-center gap-2.5 font-display text-2xl">
              <Snowflake className="size-[18px] text-muted" aria-hidden /> সংরক্ষণ
            </h2>
            <p className="mt-3 font-bangla leading-relaxed text-ink-soft">{row.storageTips}</p>
          </section>
        )}
      </div>

      {/* reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl">
          রিভিউ <span className="text-muted tabular-nums">· {bnDigits(p.rating.count)}</span>
        </h2>
        {reviews.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-line-strong"} />
                    ))}
                  </div>
                  <span className="font-bangla text-xs text-muted">{fmtDateBn(r.createdAt, { day: "numeric", month: "long", year: "numeric" })}</span>
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
          <p className="mt-4 font-bangla text-muted">এখনো কোনো রিভিউ নেই। অর্ডার ডেলিভারির পর ইমেইলে রিভিউ লিংক পাবেন।</p>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-3xl">
            আরও দেখুন
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
