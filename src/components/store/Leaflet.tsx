import QRCode from "qrcode";
import { BENEFITS, COOK_IDEAS, NUTRITION, STORAGE_TIPS } from "@/lib/content";
import { BENEFIT_ICONS } from "@/components/brand/benefit-icons";
import type { Settings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";

export async function leafletQr(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0F2A21", light: "#FFFFFF" } });
}

import { LEAFLET_ID } from "./leaflet-id";
export { LEAFLET_ID };

/**
 * A4 benefits leaflet — exactly 210 × 297 mm, white paper, all content at least 12 mm from the edges
 * so nothing is cut when printed. Used on /leaflet (print, PDF & image download) and as a preview on the home page.
 */
export function BenefitsLeaflet({ s, qr, id = LEAFLET_ID, preview = false }: { s: Settings; qr: string; id?: string; preview?: boolean }) {
  // As a thumbnail on another page the title is not that page's heading
  const Title = preview ? "p" : "h1";
  const domain = siteUrl().replace(/^https?:\/\//, "").replace(/^www\./, "");
  const phone = s.store.phone && !/x/i.test(s.store.phone) ? s.store.phone : "";
  const ink = "#14231D";
  const body = "#33413B";
  const soft = "#5F6B66";
  return (
    <div
      id={id}
      className="relative flex flex-col overflow-hidden bg-white font-sans"
      style={{ width: "210mm", height: "297mm", color: ink, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <div className="flex flex-1 flex-col px-[46px] pt-[32px]">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/badge.svg" alt="" className="h-[38px] w-[38px] rounded-[10px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmark-green.svg" alt="FungiBd" className="h-[21px]" />
          </div>
          <span className="rounded-full bg-brand-tint px-3.5 py-1.5 text-[12px] font-semibold text-brand">{domain}</span>
        </div>

        {/* Title */}
        <div className="mt-[16px] flex items-center gap-7">
          <div className="flex-1">
            <p className="text-[12px] font-semibold tracking-wide text-brand">স্বাস্থ্য ও পুষ্টি · Health &amp; nutrition</p>
            <Title className="mt-1.5 font-bangla text-[36px] font-bold leading-[1.15]" style={{ color: ink }}>
              মাশরুমের ১০টি উপকারিতা
            </Title>
            <p className="mt-1 text-[16px] font-medium" style={{ color: soft }}>
              10 health benefits of eating mushrooms
            </p>
            <p className="mt-2 max-w-[470px] font-bangla text-[13px] leading-[1.6]" style={{ color: body }}>
              কম ক্যালরিতে প্রোটিন, আঁশ, ভিটামিন ও খনিজে ভরপুর — সপ্তাহে কয়েকদিন এক মুঠো মাশরুম রাখুন পরিবারের খাবারে।
            </p>
          </div>
          <div className="grid h-[120px] w-[120px] shrink-0 place-items-center rounded-full bg-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark.svg" alt="" className="h-[84px] w-auto" />
          </div>
        </div>

        {/* Key numbers */}
        <div className="mt-[16px] grid grid-cols-3 gap-3">
          {[
            ["৩৩ ক্যালরি", "প্রতি ১০০ গ্রামে · per 100 g"],
            ["০ মি.গ্রা.", "কোলেস্টেরল · cholesterol"],
            ["৯টি", "প্রয়োজনীয় অ্যামাইনো অ্যাসিড"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-[#EEF5F2] px-4 py-2.5">
              <p className="font-bangla text-[21px] font-bold leading-tight text-brand">{n}</p>
              <p className="mt-0.5 font-bangla text-[11.5px]" style={{ color: body }}>
                {l}
              </p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-[18px] grid grid-cols-2 gap-x-7 gap-y-[10px]">
          {BENEFITS.map((b) => {
            const Icon = BENEFIT_ICONS[b.icon];
            return (
              <div key={b.key} className="flex gap-3">
                <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="font-bangla text-[14.5px] font-bold leading-tight" style={{ color: ink }}>
                    {b.titleBn}
                  </p>
                  <p className="text-[10.5px] font-semibold text-brand">{b.titleEn}</p>
                  <p className="mt-0.5 font-bangla text-[11.5px] leading-[1.5]" style={{ color: body }}>
                    {b.textBn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nutrition + how to */}
        <div className="mt-[16px] grid grid-cols-[1fr_1.15fr] gap-4">
          <div className="rounded-xl border border-[#DCE5E1] px-4 py-3">
            <p className="font-bangla text-[13px] font-bold" style={{ color: ink }}>
              পুষ্টিগুণ · প্রতি ১০০ গ্রাম
            </p>
            <p className="text-[10px]" style={{ color: soft }}>
              Oyster mushroom, raw — USDA FoodData Central
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4">
              {NUTRITION.slice(0, 10).map((n) => (
                <div key={n.en} className="flex justify-between border-b border-[#EEF2F0] py-[3px] text-[11px]">
                  <span className="font-bangla" style={{ color: body }}>
                    {n.bn}
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: ink }}>
                    {n.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-[#F6F1E6] px-4 py-3">
            <p className="font-bangla text-[13px] font-bold" style={{ color: ink }}>
              তাজা রাখুন ও রান্না করুন
            </p>
            <ul className="mt-1.5 space-y-1">
              {STORAGE_TIPS.map((t) => (
                <li key={t.en} className="flex gap-2 font-bangla text-[11.5px] leading-snug" style={{ color: body }}>
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {t.bn}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COOK_IDEAS.map((c) => (
                <span key={c.en} className="rounded-full bg-white px-2.5 py-[3px] font-bangla text-[11px]" style={{ color: ink }}>
                  {c.bn}
                </span>
              ))}
            </div>
            <p className="mt-2 font-bangla text-[11.5px] font-semibold text-brand">টিপস: রান্নার আগে ৩০ মিনিট রোদে রাখলে ভিটামিন ডি বাড়ে।</p>
          </div>
        </div>

        <p className="mb-3 mt-auto pt-3 font-bangla text-[9.5px]" style={{ color: soft }}>
          সাধারণ পুষ্টি তথ্য, চিকিৎসা পরামর্শ নয়। General nutrition information, not medical advice.
        </p>
      </div>

      {/* Footer */}
      <div className="flex h-[104px] shrink-0 items-center gap-6 bg-brand px-[46px] text-white">
        <div className="flex-1">
          <p className="font-bangla text-[12.5px] font-semibold text-tan">খামার থেকে তাজা মাশরুম অর্ডার করুন</p>
          <p className="text-[28px] font-bold leading-tight tracking-tight">{domain}</p>
          <p className="mt-0.5 font-bangla text-[12px] text-white/90">
            ঢাকার ভিতরে হোম ডেলিভারি · ক্যাশ অন ডেলিভারি · প্রি-অর্ডার{phone ? ` · ${phone}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-[78px] w-[78px] rounded-lg bg-white p-[7px] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <span className="font-bangla text-[10px] text-white/85">স্ক্যান করে অর্ডার করুন</span>
        </div>
      </div>
    </div>
  );
}
