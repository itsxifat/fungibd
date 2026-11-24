import Link from "next/link";
import { ArrowRight, Banknote, CalendarClock, CalendarDays, Download, Eye, Plus, Star, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings, type Settings } from "@/lib/settings";
import { getProducts, isPreorderOnly, nextHarvestDate, sortPreorders, type ProductDTO } from "@/lib/store-data";
import { FAQS } from "@/lib/content";
import { fmtDateBn } from "@/lib/dates";
import { bnDigits, siteUrl, taka } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { MotionStory } from "@/components/store/MotionStory";
import { BenefitsLeaflet, leafletQr } from "@/components/store/Leaflet";
import { ScaledLeaflet } from "@/components/store/ScaledLeaflet";
import { HarvestAlertForm } from "@/components/store/HarvestAlertForm";
import { SectionHeading } from "@/components/store/SectionHeading";
import { HeroSlider, type HeroSlideView } from "@/components/store/HeroSlider";
import { PreorderSteps } from "@/components/store/PreorderSteps";
import { DeliveryCoverage } from "@/components/store/DeliveryCoverage";
import { StructuredData } from "@/components/store/StructuredData";
import { absoluteUrl, storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata(
  "/", "Fresh Mushrooms in Dhaka · ঢাকায় তাজা মাশরুম",
  "নিজস্ব খামারের তাজা মাশরুম, প্রি-অর্ডারে। Pre-order farm-grown fresh mushrooms from FungiBd's next harvest, plus dried mushrooms and mushroom powder. Cash on delivery in Dhaka.",
);

const safeHref = (h: string) => (h.startsWith("/") || /^https?:\/\//.test(h) ? h : "");

/** Slides from Admin → Settings → Home page; otherwise the old hero photo plus pre-order (or shop) products. */
function heroSlides(s: Settings, featured: ProductDTO[]): HeroSlideView[] {
  const custom = (Array.isArray(s.home.heroSlides) ? s.home.heroSlides : []).filter((x) => x && typeof x.image === "string" && x.image);
  if (custom.length) return custom.map((x) => ({ image: x.image, title: x.title ?? "", caption: x.caption ?? "", href: safeHref(x.href ?? "") }));
  const out: HeroSlideView[] = [];
  if (s.home.heroImage) out.push({ image: s.home.heroImage, title: "", caption: "", href: "" });
  for (const p of featured.slice(0, 5)) {
    const v = p.variants.find((x) => x.mode !== "SOLD_OUT") ?? p.variants[0];
    const price = v ? `${bnDigits(taka(v.price))} · ${v.labelBn}` : "";
    const harvest = v?.preorderDate ? `হারভেস্ট ${fmtDateBn(new Date(v.preorderDate), { day: "numeric", month: "long" })}` : "";
    out.push({ image: p.image, title: p.nameBn, caption: [price, harvest].filter(Boolean).join(" · "), href: `/product/${p.slug}` });
  }
  return out;
}

export default async function HomePage() {
  const [s, products, reviews, zones] = await Promise.all([
    getSettings(),
    getProducts(),
    db.review.findMany({ where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 6, include: { product: { select: { nameBn: true } } } }),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] }),
  ]);
  const preorder = sortPreorders(products.filter(isPreorderOnly));
  const shop = products.filter((p) => !isPreorderOnly(p) && p.variants.some((v) => v.mode !== "SOLD_OUT"));
  const next = nextHarvestDate(products);
  const slides = heroSlides(s, preorder.length ? preorder : shop);
  const eyebrow = s.home.heroEyebrow || (next ? `পরের হারভেস্ট · ${fmtDateBn(next, { day: "numeric", month: "long", weekday: "long" })}` : "");
  const ctas = [
    { label: s.home.heroCtaLabel, href: safeHref(s.home.heroCtaHref), primary: true },
    { label: s.home.heroCta2Label, href: safeHref(s.home.heroCta2Href), primary: false },
  ].filter((c) => c.label && c.href);
  const free = s.delivery.freeDeliveryMin;
  const trust = [
    { Icon: CalendarClock, t: "অগ্রিম টাকা লাগে না", d: "প্রি-অর্ডারে শুধু বুক করুন" },
    { Icon: Banknote, t: "ক্যাশ অন ডেলিভারি", d: "হাতে পেয়ে টাকা দিন" },
    { Icon: CalendarDays, t: "পছন্দের দিনে ডেলিভারি", d: "দিন ও সময় আপনিই বাছবেন" },
    { Icon: Truck, t: free > 0 ? `${bnDigits(taka(free))}+ অর্ডারে ফ্রি ডেলিভারি` : "হোম ডেলিভারি", d: s.delivery.coverageNote || "আপনার দরজায়" },
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
      {/* Hero — text and slides are edited in Admin → Settings → Home page */}
      <section className="container-x grid items-center gap-8 pb-12 pt-8 sm:gap-10 sm:pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20 lg:pt-14">
        <div className="max-w-xl">
          {eyebrow && (
            <p className="flex items-center gap-2 font-bangla text-[15px] text-ink-soft">
              <CalendarClock className="size-[18px] shrink-0 text-muted" aria-hidden /> {eyebrow}
            </p>
          )}
          <h1 className="mt-4 font-display text-4xl leading-[1.2] sm:text-5xl lg:text-6xl">{s.home.heroTitleBn}</h1>
          {s.home.heroTitleEn && <p lang="en" className="mt-3 text-lg text-muted">{s.home.heroTitleEn}</p>}
          {s.home.heroSubBn && <p className="mt-5 max-w-[36rem] font-bangla text-lg leading-relaxed text-ink-soft">{s.home.heroSubBn}</p>}
          {ctas.length > 0 && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {ctas.map((c) => (
                <Link key={c.href + c.label} href={c.href} className={c.primary ? "btn btn-primary btn-lg" : "btn btn-outline btn-lg"}>
                  {c.label} {c.primary && <ArrowRight className="size-4" aria-hidden />}
                </Link>
              ))}
            </div>
          )}
        </div>
        {slides.length > 0 && <HeroSlider slides={slides} />}
      </section>

      {/* Trust strip */}
      <section aria-label="কেন FungiBd" className="border-y border-line">
        <ul className="container-x grid grid-cols-2 gap-x-4 gap-y-5 py-6 lg:grid-cols-4">
          {trust.map(({ Icon, t, d }) => (
            <li key={t} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 font-bangla">
                <span className="block text-[15px] font-semibold leading-snug">{t}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pre-order — every fresh harvest is sold this way */}
      {preorder.length > 0 && (
        <section id="preorder" className="scroll-mt-20 bg-brand-night text-cream">
          <div className="container-x py-16 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-end lg:gap-14">
              <div>
                <p className="eyebrow text-tan">প্রি-অর্ডার</p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-cream sm:text-4xl">পরের হারভেস্ট থেকে বুক করুন</h2>
                <p className="mt-4 max-w-lg font-bangla text-[16px] leading-relaxed text-cream/75">আমাদের খামারে যা তোলা হয়, সবই প্রি-অর্ডারে যায়। এখন জায়গা রেখে দিন — হারভেস্টের পর নির্ধারিত দিনে আপনার কাছে পৌঁছে দেব।</p>
              </div>
              <PreorderSteps dark className="sm:grid-cols-3" />
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {preorder.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {preorder.length > 4 && (
              <div className="mt-8 text-center">
                <Link href="/preorder" className="btn btn-cream">
                  সব প্রি-অর্ডার দেখুন ({bnDigits(preorder.length)}) <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Shop — mushroom-made products */}
      {shop.length > 0 && (
        <section id="shop" className="container-x scroll-mt-20 py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">শপ</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">মাশরুমের তৈরি পণ্য</h2>
              <p className="mt-3 font-bangla text-[16px] leading-relaxed text-ink-soft">শুকনো মাশরুম, পাউডার আর ঘরে চাষের কিট — স্টকে যা আছে, আজই অর্ডার করা যায়।</p>
            </div>
            <Link href="/shop" className="inline-flex min-h-11 items-center gap-1.5 font-bangla text-sm font-semibold text-brand hover:underline">
              শপে যান <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shop.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Benefits: film + leaflet */}
      <section id="benefits" className="scroll-mt-20 border-t border-line">
        <div className="container-x py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">উপকারিতা</p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">মাংসের মতো স্বাদ, সবজির মতো হালকা</h2>
            </div>
            <Link href="/benefits" className="inline-flex min-h-11 items-center gap-1.5 font-bangla text-sm font-semibold text-brand hover:underline">
              ১০টি উপকারিতাই পড়ুন <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-10">
            <MotionStory />
          </div>

          <div className="mt-16 grid items-center gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-12">
            <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-line shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <ScaledLeaflet>
                <BenefitsLeaflet s={s} qr={qr} />
              </ScaledLeaflet>
            </div>
            <div>
              <SectionHeading bn="উপকারিতার লিফলেট" en="Download, print or share with your family" />
              <p className="mt-5 max-w-lg font-bangla text-[16px] leading-relaxed text-ink-soft">এক পাতায় মাশরুমের ১০টি উপকারিতা, প্রতি ১০০ গ্রামের পুষ্টিগুণ, সংরক্ষণের নিয়ম আর রান্নার আইডিয়া।</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/leaflet?download=pdf" className="btn btn-primary">
                  <Download className="size-4" aria-hidden /> PDF ডাউনলোড
                </Link>
                <Link href="/leaflet" target="_blank" className="btn btn-outline">
                  <Eye className="size-4" aria-hidden /> লিফলেট দেখুন
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted">A4 সাইজ · প্রিন্ট বা হোয়াটসঅ্যাপে শেয়ার করার উপযোগী</p>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery coverage — scales from one area to hundreds across Bangladesh */}
      {zones.length > 0 && (
        <section id="delivery" className="scroll-mt-20 bg-cream/50">
          <div className="container-x py-16 sm:py-20">
            <DeliveryCoverage zones={zones.map((z) => ({ id: z.id, nameBn: z.nameBn, nameEn: z.nameEn, region: z.region, charge: z.charge }))} freeDeliveryMin={free} note={s.delivery.coverageNote} />
          </div>
        </section>
      )}

      {/* Reviews — only real, approved customer reviews */}
      {reviews.length > 0 && (
        <section className="border-t border-line">
          <div className="container-x py-16 sm:py-20">
            <SectionHeading bn="ক্রেতাদের মতামত" en="Customer reviews" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-2xl border border-line bg-white p-6">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-line-strong"} aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-3 font-bangla text-[15px] leading-relaxed">“{r.comment}”</blockquote>
                  <figcaption className="mt-4 text-sm text-muted">
                    {r.name} · {r.product.nameBn}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-line">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading bn="সাধারণ প্রশ্ন" en="Frequently asked questions" />
            <p className="mt-5 font-bangla text-ink-soft">
              আরও কিছু জানতে চান?{" "}
              <Link href="/support" className="font-semibold text-brand hover:underline">
                যোগাযোগ করুন
              </Link>
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.slice(0, 6).map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-bangla text-[16px] font-semibold">
                  {f.q}
                  <Plus className="mt-1 size-4 shrink-0 text-muted transition group-open:rotate-45" aria-hidden />
                </summary>
                <p className="mt-3 font-bangla text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Harvest alerts + wholesale */}
      <section className="container-x">
        <div className="rounded-[20px] bg-brand px-6 py-14 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl sm:text-4xl">নতুন হারভেস্টের খবর সবার আগে</h2>
          <p className="mx-auto mt-3 max-w-lg font-bangla text-white/80">প্রি-অর্ডার খুললে বা নতুন মাশরুম এলে জানিয়ে দেব।</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <HarvestAlertForm dark />
          </div>
          <p className="mt-8 font-bangla text-sm text-white/70">
            রেস্টুরেন্ট বা দোকানের জন্য নিয়মিত লাগবে?{" "}
            <Link href="/wholesale" className="font-semibold text-white underline-offset-4 hover:underline">
              পাইকারি দর জানুন
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
