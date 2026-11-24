import Link from "next/link";
import { ArrowRight, Banknote, CalendarClock, CalendarDays, Download, Eye, Plus, Star, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings, type Settings } from "@/lib/settings";
import { getProducts, isPreorderOnly, nextHarvestDate, sortPreorders, type ProductDTO } from "@/lib/store-data";
import { FAQS } from "@/lib/content";
import { fmtDateBn } from "@/lib/dates";
import { bnDigits, siteUrl, takaBn } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/brand/ProductImage";
import { AddToCart } from "@/components/store/AddToCart";
import { MotionStory } from "@/components/store/MotionStory";
import { BenefitsLeaflet, leafletQr } from "@/components/store/Leaflet";
import { ScaledLeaflet } from "@/components/store/ScaledLeaflet";
import { HarvestAlertForm } from "@/components/store/HarvestAlertForm";
import { HeroSlider, type HeroLead, type HeroSlideView } from "@/components/store/HeroSlider";
import { DeliveryCoverage } from "@/components/store/DeliveryCoverage";
import { StructuredData } from "@/components/store/StructuredData";
import { absoluteUrl, storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata(
  "/", "Fresh Mushrooms in Dhaka · ঢাকায় তাজা মাশরুম",
  "নিজস্ব খামারের তাজা মাশরুম, প্রি-অর্ডারে। Pre-order farm-grown fresh mushrooms from FungiBd's next harvest, plus dried mushrooms and mushroom powder. Cash on delivery in Dhaka.",
);

const safeHref = (h: string) => (h.startsWith("/") || /^https?:\/\//.test(h) ? h : "");

/** The owner's photo slides (Admin → Settings → Home page), or the older single hero photo. */
function ownerSlides(s: Settings): HeroSlideView[] {
  const custom = (Array.isArray(s.home.heroSlides) ? s.home.heroSlides : []).filter((x) => x && typeof x.image === "string" && x.image);
  if (custom.length) return custom.map((x) => ({ image: x.image, title: x.title ?? "", caption: x.caption ?? "", href: safeHref(x.href ?? "") }));
  return s.home.heroImage ? [{ image: s.home.heroImage, title: "", caption: "", href: "" }] : [];
}

function SectionHead({ title, sub, href, linkLabel = "সব দেখুন" }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <h2 className="font-display text-2xl leading-tight sm:text-[1.75rem]">{title}</h2>
        {sub && <p className="mt-1 font-bangla text-[15px] text-ink-soft">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-bangla text-[15px] font-medium text-brand transition-colors duration-150 hover:text-brand-deep">
          {linkLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [s, products, reviews, zones, categories] = await Promise.all([
    getSettings(),
    getProducts(),
    db.review.findMany({ where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 6, include: { product: { select: { nameBn: true } } } }),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, nameBn: true } }),
  ]);
  const preorder = sortPreorders(products.filter(isPreorderOnly));
  const shop = products.filter((p) => !isPreorderOnly(p) && p.variants.some((v) => v.mode !== "SOLD_OUT"));
  const next = nextHarvestDate(products);
  const nextLabel = next ? fmtDateBn(next, { weekday: "long", day: "numeric", month: "long" }) : "";
  const featured = preorder.find((p) => p.variants.some((v) => v.mode === "PREORDER"));

  const lead: HeroLead = {
    harvestLine: s.home.heroEyebrow || (nextLabel ? `পরের হারভেস্ট · ${nextLabel}` : ""),
    title: s.home.heroTitleBn,
    titleEn: s.home.heroTitleEn,
    sub: s.home.heroSubBn,
    ctas: [
      { label: s.home.heroCtaLabel, href: safeHref(s.home.heroCtaHref), primary: true },
      { label: s.home.heroCta2Label, href: safeHref(s.home.heroCta2Href), primary: false },
    ].filter((c) => c.label && c.href),
  };

  // Shop sections and category tiles come from live products only.
  const shopSections = categories
    .map((c) => ({ ...c, items: shop.filter((p) => p.categorySlug === c.slug) }))
    .filter((c) => c.items.length);
  const uncategorised = shop.filter((p) => !p.categorySlug || !categories.some((c) => c.slug === p.categorySlug));
  if (uncategorised.length) shopSections.push({ slug: "", nameBn: "আরও পণ্য", items: uncategorised });
  // A small shop reads better as one full section; split by category once there is enough to fill rows.
  const shopBlocks = shop.length > 8 ? shopSections : shop.length ? [{ slug: "", nameBn: "মাশরুমের তৈরি পণ্য", items: shop }] : [];
  const tiles = [
    ...(preorder.length ? [{ href: "/preorder", label: "তাজা মাশরুম", sub: "প্রি-অর্ডার", image: preorder[0].image }] : []),
    ...shopSections.filter((c) => c.slug).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.nameBn, sub: `${bnDigits(c.items.length)}টি পণ্য`, image: c.items[0].image })),
  ];

  const free = s.delivery.freeDeliveryMin;
  const trust = [
    { Icon: CalendarClock, t: "অগ্রিম টাকা লাগে না", d: "প্রি-অর্ডারে শুধু বুক করুন" },
    { Icon: Banknote, t: "ক্যাশ অন ডেলিভারি", d: "হাতে পেয়ে টাকা দিন" },
    { Icon: CalendarDays, t: "পছন্দের দিনে ডেলিভারি", d: "দিন ও সময় আপনিই বাছবেন" },
    { Icon: Truck, t: free > 0 ? `${takaBn(free)}+ অর্ডারে ফ্রি ডেলিভারি` : "হোম ডেলিভারি", d: s.delivery.coverageNote || "আপনার দরজায়" },
  ];
  const qr = await leafletQr(siteUrl());

  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: s.store.name, url: absoluteUrl("/"), inLanguage: ["bn-BD", "en"], publisher: { "@id": absoluteUrl("/#store") } },
          {
            "@type": "OnlineStore", "@id": absoluteUrl("/#store"), name: s.store.name, url: absoluteUrl("/"),
            logo: absoluteUrl("/brand/icon-512.png"), description: s.store.taglineEn, email: s.store.email || undefined,
            telephone: /\d{10,}/.test(s.store.phone.replace(/[^\d]/g, "")) ? s.store.phone : undefined,
            sameAs: [s.store.facebook, s.store.instagram, s.store.youtube].filter((url) => /^https?:\/\//i.test(url)),
          },
        ],
      }} />

      {/* Banner row: the owner's headline and photos, beside the next harvest */}
      <section id="banner" className="container-x pt-4 sm:pt-6">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <HeroSlider lead={lead} slides={ownerSlides(s)} />

          <aside aria-label="পরের হারভেস্ট" className="flex flex-col rounded-xl border border-line bg-card p-5">
            {featured ? (
              <>
                <h2 className="font-display text-xl leading-tight">পরের হারভেস্ট</h2>
                <p className="mt-1 flex items-center gap-2 font-bangla text-[15px] text-ink-soft">
                  <CalendarClock className="size-[18px] shrink-0 text-muted" aria-hidden />
                  {featured.variants.find((v) => v.preorderDate)?.preorderDate ? fmtDateBn(new Date(featured.variants.find((v) => v.preorderDate)!.preorderDate!), { weekday: "long", day: "numeric", month: "long" }) : "শিগগিরই"}
                </p>
                <Link href={`/product/${featured.slug}`} className="group mt-4 block">
                  <ProductImage src={featured.image} alt={featured.nameEn} className="h-36 w-full rounded-lg lg:h-40" imgClassName="h-[94%] w-[94%]" />
                  <span className="mt-3 block font-display text-lg leading-snug transition-colors duration-150 group-hover:text-brand">{featured.nameBn}</span>
                </Link>
                <div className="mt-auto pt-4">
                  <AddToCart product={featured} buyNow harvestLine={false} />
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-2xl leading-tight">পরের হারভেস্টের বুকিং শিগগিরই খুলবে</p>
                <p className="mt-2 font-bangla text-[15px] leading-relaxed text-ink-soft">বুকিং খুললেই জানিয়ে দেব। ইমেইল বা মোবাইল নম্বর দিন।</p>
                <div className="mt-auto pt-6">
                  <HarvestAlertForm interest="Pre-order opening alert" />
                </div>
              </>
            )}
          </aside>
        </div>

        <ul aria-label="কেন FungiBd" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-line bg-card px-4 py-4 sm:px-6 lg:grid-cols-4">
          {trust.map(({ Icon, t, d }) => (
            <li key={t} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <span className="min-w-0 font-bangla">
                <span className="block text-[15px] font-semibold leading-snug">{t}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Category tiles — stretch to fill the row whether there are two categories or ten */}
      {tiles.length > 1 && (
        <section aria-label="ক্যাটাগরি" className="container-x mt-10">
          <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] sm:px-0">
            {tiles.map((t) => (
              <li key={t.href} className="w-[15.5rem] shrink-0 snap-start sm:w-auto">
                <Link href={t.href} className="group flex items-center gap-3 rounded-xl border border-line bg-card p-2.5 pr-4 transition-colors duration-150 hover:border-line-strong">
                  <ProductImage src={t.image} alt="" className="size-16 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-display text-[17px] leading-tight transition-colors duration-150 group-hover:text-brand">{t.label}</span>
                    <span className="block font-bangla text-xs text-muted">{t.sub}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition-colors duration-150 group-hover:text-brand" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pre-order — every fresh harvest is sold this way */}
      {preorder.length > 0 && (
        <section id="preorder" className="container-x mt-14 scroll-mt-24">
          <SectionHead title="পরের হারভেস্টে বুক করুন" sub={nextLabel ? `পরের হারভেস্ট ${nextLabel}।` : undefined} href="/preorder" linkLabel={`সব প্রি-অর্ডার (${bnDigits(preorder.length)})`} />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {preorder.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} layout="wide" />
            ))}
          </div>
        </section>
      )}

      {/* Shop — one section per category of mushroom-made products */}
      {shopBlocks.map((c) => (
        <section key={c.slug || "more"} className="container-x mt-14">
          <SectionHead title={c.nameBn} href={c.slug ? `/shop?category=${c.slug}` : "/shop"} />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {c.items.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} buyNow />
            ))}
          </div>
        </section>
      ))}

      {/* Benefits: film + leaflet */}
      <section id="benefits" className="container-x mt-16 scroll-mt-24">
        <SectionHead title="মাংসের মতো স্বাদ, সবজির মতো হালকা" sub="এক মুঠো মাশরুমে কী থাকে — ৩০ সেকেন্ডে দেখুন।" href="/benefits" linkLabel="১০টি উপকারিতা" />
        <div className="mt-6">
          <MotionStory />
        </div>
        <div className="mt-6 grid items-center gap-8 rounded-xl border border-line bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12">
          {/* A picture of the printable leaflet; its full text is one click away ("লিফলেট দেখুন") */}
          <div aria-hidden inert className="mx-auto w-full max-w-[320px] overflow-hidden rounded-lg border border-line shadow-[0_8px_24px_rgba(22,37,31,0.06)]">
            <ScaledLeaflet>
              <BenefitsLeaflet s={s} qr={qr} preview />
            </ScaledLeaflet>
          </div>
          <div>
            <h3 className="font-display text-2xl">উপকারিতার লিফলেট</h3>
            <p className="mt-2 max-w-lg font-bangla text-[16px] leading-relaxed text-ink-soft">এক পাতায় মাশরুমের ১০টি উপকারিতা, প্রতি ১০০ গ্রামের পুষ্টিগুণ, সংরক্ষণের নিয়ম আর রান্নার আইডিয়া। প্রিন্ট করুন বা পরিবারের সাথে শেয়ার করুন।</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/leaflet?download=pdf" className="btn btn-primary">
                <Download className="size-4" aria-hidden /> PDF ডাউনলোড
              </Link>
              <Link href="/leaflet" target="_blank" className="btn btn-outline bg-white">
                <Eye className="size-4" aria-hidden /> লিফলেট দেখুন
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery coverage — scales from one area to hundreds across Bangladesh */}
      {zones.length > 0 && (
        <section id="delivery" className="container-x mt-16 scroll-mt-24">
          <DeliveryCoverage zones={zones.map((z) => ({ id: z.id, nameBn: z.nameBn, nameEn: z.nameEn, region: z.region, charge: z.charge }))} freeDeliveryMin={free} note={s.delivery.coverageNote} />
        </section>
      )}

      {/* Reviews — only real, approved customer reviews */}
      {reviews.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead title="ক্রেতাদের মতামত" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-xl border border-line bg-card p-5">
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={i < r.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-line-strong"} aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 font-bangla text-[15px] leading-relaxed">“{r.comment}”</blockquote>
                <figcaption className="mt-4 font-bangla text-sm text-muted">
                  {r.name} · {r.product.nameBn}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container-x mt-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl leading-tight sm:text-[1.75rem]">সাধারণ প্রশ্ন</h2>
            <p className="mt-2 font-bangla text-[15px] text-ink-soft">
              উত্তর না পেলে{" "}
              <Link href="/support" className="font-medium text-brand underline-offset-4 hover:underline">
                আমাদের লিখুন
              </Link>
            </p>
          </div>
          <div className="divide-y divide-line rounded-xl border border-line bg-card px-5">
            {FAQS.slice(0, 6).map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-bangla text-[16px] font-semibold">
                  {f.q}
                  <Plus className="size-4 shrink-0 text-muted transition-transform duration-150 group-open:rotate-45" aria-hidden />
                </summary>
                <p className="pb-1 pt-2 font-bangla text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Harvest alerts + wholesale */}
      <section className="container-x mt-16">
        <div className="grid items-center gap-6 rounded-xl bg-brand-deep px-6 py-10 text-white sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div>
            <h2 className="font-display text-2xl leading-tight sm:text-3xl">নতুন হারভেস্টের খবর সবার আগে</h2>
            <p className="mt-2 font-bangla text-white/75">প্রি-অর্ডার খুললে বা নতুন মাশরুম এলে জানিয়ে দেব।</p>
            <p className="mt-4 font-bangla text-sm text-white/65">
              রেস্টুরেন্ট বা দোকানের জন্য নিয়মিত লাগবে?{" "}
              <Link href="/wholesale" className="font-medium text-white underline underline-offset-4">
                পাইকারি দর জানুন
              </Link>
            </p>
          </div>
          <HarvestAlertForm dark />
        </div>
      </section>
    </>
  );
}
