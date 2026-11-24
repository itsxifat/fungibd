import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { COOK_IDEAS, NUTRITION, STORAGE_TIPS } from "@/lib/content";
import { MotionStory } from "@/components/store/MotionStory";
import { BenefitGrid } from "@/components/store/BenefitGrid";

export const metadata = { title: "মাশরুমের উপকারিতা · Benefits of mushrooms" };

function videoEmbed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return { kind: "youtube" as const, src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  return { kind: "file" as const, src: url };
}

export default async function BenefitsPage() {
  const s = await getSettings();
  const video = s.home.benefitsVideoUrl ? videoEmbed(s.home.benefitsVideoUrl) : null;
  return (
    <div className="container-x py-14">
      <h1 className="font-display text-4xl sm:text-5xl">মাশরুমের উপকারিতা</h1>
      <p className="mt-2 text-muted">Benefits of eating mushrooms</p>
      <div className="mt-10">
        <MotionStory />
      </div>

      {video && (
        <section id="video" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-2xl">ভিডিও · Video</h2>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-ink">
            {video.kind === "youtube" ? (
              <iframe src={video.src} title="FungiBd video" className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
            ) : (
              <video src={video.src} controls className="h-full w-full" preload="metadata" />
            )}
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="font-display text-2xl">১০টি উপকারিতা · 10 benefits</h2>
        <div className="mt-6">
          <BenefitGrid />
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold">পুষ্টিগুণ · প্রতি ১০০ গ্রাম</h2>
          <p className="text-xs text-muted">Oyster mushroom, raw · USDA FoodData Central</p>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {NUTRITION.map((n) => (
                <tr key={n.en} className="border-b border-line last:border-0">
                  <td className="py-2 font-bangla">
                    {n.bn} <span className="text-muted">· {n.en}</span>
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">{n.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold">সংরক্ষণের নিয়ম · Storage</h2>
          <ul className="mt-4 space-y-3 font-bangla text-sm">
            {STORAGE_TIPS.map((t) => (
              <li key={t.en}>
                {t.bn}
                <span className="block text-xs text-muted">{t.en}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-semibold">রান্নার আইডিয়া · Cooking ideas</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COOK_IDEAS.map((c) => (
              <span key={c.en} className="rounded-md bg-cream px-2.5 py-1 font-bangla text-sm">
                {c.bn}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/leaflet?download=pdf" className="btn btn-primary btn-sm">
              <Download className="h-4 w-4" /> লিফলেট PDF
            </Link>
            <Link href="/leaflet" target="_blank" className="btn btn-outline btn-sm">
              <Eye className="h-4 w-4" /> দেখুন
            </Link>
          </div>
        </div>
      </section>
      <p className="mt-8 text-xs text-muted">এই তথ্য সাধারণ পুষ্টি জ্ঞানের জন্য, চিকিৎসা পরামর্শ নয়। · General nutrition information, not medical advice.</p>
    </div>
  );
}
