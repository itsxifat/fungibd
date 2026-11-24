import Link from "next/link";
import { ArrowRight, Check, Download, Eye, Plus, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getProducts } from "@/lib/store-data";
import { BENEFITS, FAQS, HOW_IT_WORKS } from "@/lib/content";
import { bnDigits, num, siteUrl } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { MotionStory } from "@/components/store/MotionStory";
import { BenefitsLeaflet, leafletQr } from "@/components/store/Leaflet";
import { ScaledLeaflet } from "@/components/store/ScaledLeaflet";
import { HarvestAlertForm } from "@/components/store/HarvestAlertForm";
import { SectionHeading } from "@/components/store/SectionHeading";
import { StructuredData } from "@/components/store/StructuredData";
import { absoluteUrl, storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata(
  "/", "Fresh Mushrooms in Dhaka · ঢাকায় তাজা মাশরুম",
  "নিজস্ব খামারের ঝিনুক মাশরুম। Order farm-grown oyster mushrooms online from FungiBd. Check pack prices, availability and delivery in Uttara, Dhaka.",
);

export default async function HomePage() {
  const [s, products, reviews, zones] = await Promise.all([
    getSettings(),
    getProducts(),
    db.review.findMany({ where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 6, include: { product: { select: { nameBn: true } } } }),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const available = products.filter((p) => p.variants.some((v) => v.mode === "IN_STOCK"));
  const preorders = products.filter((p) => p.variants.some((v) => v.mode === "PREORDER") && !p.variants.some((v) => v.mode === "IN_STOCK"));
  const featured = (available.length ? available : products).slice(0, 8);
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
      {/* Hero */}
      <section className="container-x grid items-center gap-10 pb-16 pt-10 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-16">
        <div>
          <p className="text-sm font-semibold text-brand">নিজস্ব খামারে চাষ · Grown on our own farm</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.2] sm:text-5xl lg:text-[3.5rem]">{s.home.heroTitleBn}</h1>
          <p lang="en" className="mt-3 text-lg text-muted">{s.home.heroTitleEn}</p>
          <p className="mt-6 max-w-lg font-bangla text-[17px] leading-relaxed text-ink-soft">{s.home.heroSubBn}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary btn-lg">
              অর্ডার করুন <ArrowRight className="h-4 w-4" />
            </Link>
            {preorders.length > 0 && (
              <Link href="/shop?filter=preorder" className="btn btn-outline btn-lg">
                প্রি-অর্ডার
              </Link>
            )}
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-bangla text-sm text-ink-soft">
            {["ঢাকার ভিতরে হোম ডেলিভারি", "ক্যাশ অন ডেলিভারি", "প্রি-অর্ডার সুবিধা"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-brand">
          {s.home.heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.home.heroImage} alt="FungiBd mushrooms" className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/mark.svg" alt="" aria-hidden className="absolute left-1/2 top-1/2 h-[46%] -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
      </section>

      {/* Products */}
      <section className="border-t border-line">
        <div className="container-x py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading bn="আমাদের মাশরুম" en="Shop fresh mushrooms" />
            <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              সব দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Pre-order */}
      {preorders.length > 0 && (
        <section className="bg-cream/60">
          <div className="container-x py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <SectionHeading bn="প্রি-অর্ডার" en="Reserve from the next harvest" />
                <p className="mt-5 max-w-md font-bangla text-[16px] leading-relaxed text-ink-soft">
                  কিছু মাশরুম আমরা সীমিত পরিমাণে চাষ করি। এখনই বুক করে রাখুন — হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি দেওয়া হবে। টাকা দেবেন ডেলিভারির সময়।
                </p>
                <ol className="mt-8 space-y-4">
                  {["এখনই বুক করুন — অগ্রিম টাকা লাগবে না", "হারভেস্টের তারিখ ইমেইলে জানানো হবে", "নির্ধারিত দিনে ডেলিভারি, ক্যাশ অন ডেলিভারি"].map((t, i) => (
                    <li key={t} className="flex items-center gap-3 font-bangla text-[15px]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand text-sm font-semibold text-brand">{bnDigits(i + 1)}</span>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {preorders.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits: motion video + leaflet */}
      <section id="benefits" className="scroll-mt-24">
        <div className="container-x py-20">
          <SectionHeading center bn="মাশরুম কেন খাবেন?" en="The benefits of mushrooms — a one-minute motion video" />
          <div className="mt-10">
            <MotionStory benefits={BENEFITS} />
          </div>

          <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
            <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-xl border border-line shadow-[0_20px_50px_-30px_rgba(22,37,31,.35)]">
              <ScaledLeaflet>
                <BenefitsLeaflet s={s} qr={qr} />
              </ScaledLeaflet>
            </div>
            <div>
              <SectionHeading bn="উপকারিতার লিফলেট" en="Download, print or share with your family" />
              <p className="mt-5 max-w-lg font-bangla text-[16px] leading-relaxed text-ink-soft">
                এক পাতায় মাশরুমের ১০টি উপকারিতা, প্রতি ১০০ গ্রামের পুষ্টিগুণ, সংরক্ষণের নিয়ম আর রান্নার আইডিয়া।
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/leaflet?download=pdf" className="btn btn-primary">
                  <Download className="h-4 w-4" /> PDF ডাউনলোড
                </Link>
                <Link href="/leaflet" target="_blank" className="btn btn-outline">
                  <Eye className="h-4 w-4" /> লিফলেট দেখুন
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted">A4 সাইজ · প্রিন্ট বা হোয়াটসঅ্যাপে শেয়ার করার উপযোগী</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line">
        <div className="container-x py-20">
          <SectionHeading center bn="কীভাবে অর্ডার করবেন" en="How it works" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.en} className="text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand-tint text-lg font-semibold text-brand">{bnDigits(i + 1)}</span>
                <p className="mt-4 font-bangla text-lg font-semibold">{h.bn}</p>
                <p className="mx-auto mt-2 max-w-xs font-bangla text-[15px] leading-relaxed text-ink-soft">{h.textBn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery areas */}
      <section className="bg-cream/60">
        <div className="container-x grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading bn="ডেলিভারি এলাকা" en="We deliver inside Dhaka city only" />
            <p className="mt-5 max-w-md font-bangla text-[16px] leading-relaxed text-ink-soft">
              চেকআউটে আপনার এলাকা বেছে নিন, ম্যাপে বাসা পিন করুন অথবা বিস্তারিত ঠিকানা লিখুন।
              {s.delivery.freeDeliveryMin > 0 && ` ৳${num(s.delivery.freeDeliveryMin)} বা তার বেশি অর্ডারে ডেলিভারি ফ্রি।`}
            </p>
            <Link href="/delivery" className="mt-4 inline-block text-sm font-semibold text-brand underline underline-offset-2">ডেলিভারি এলাকা ও চার্জ · Delivery areas and fees</Link>
          </div>
          <ul className="flex flex-wrap content-start gap-2">
            {zones.map((z) => (
              <li key={z.id} className="rounded-full border border-line bg-white px-3.5 py-1.5 font-bangla text-sm text-ink-soft">
                {z.nameBn} <span className="text-muted">· ৳{z.charge}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reviews — only real, approved customer reviews */}
      {reviews.length > 0 && (
        <section className="border-t border-line">
          <div className="container-x py-20">
            <SectionHeading bn="ক্রেতাদের মতামত" en="Customer reviews" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-2xl border border-line bg-white p-6">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-line-strong"} />
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
        <div className="container-x grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr]">
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
                  <Plus className="mt-1 h-4 w-4 shrink-0 text-muted transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 font-bangla text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Updates signup */}
      <section className="container-x">
        <div className="rounded-[2rem] bg-brand px-6 py-14 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl sm:text-4xl">নতুন হারভেস্ট ও অফারের খবর পান</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/75">Get notified about new harvests and pre-order openings.</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <HarvestAlertForm dark />
          </div>
        </div>
      </section>
    </>
  );
}
