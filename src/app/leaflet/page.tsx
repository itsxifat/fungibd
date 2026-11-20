import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import { BenefitsLeaflet, leafletQr } from "@/components/store/Leaflet";
import { LeafletToolbar } from "./toolbar";

export const metadata = { title: "মাশরুমের উপকারিতা — লিফলেট · Leaflet" };

export default async function LeafletPage({ searchParams }: { searchParams: Promise<{ print?: string; download?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const qr = await leafletQr(siteUrl());
  const auto = sp.download === "pdf" || sp.print === "1" ? "pdf" : sp.print === "browser" ? "print" : null;
  return (
    <div className="min-h-dvh bg-[#E9ECEA] py-8 print:bg-white print:py-0">
      <style>{`
        @page { size: A4 portrait; margin: 0 }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important }
          .sheet { box-shadow: none !important; margin: 0 !important; zoom: 1 !important }
        }
        @media screen and (max-width: 840px) { .sheet { zoom: calc((100vw - 24px) / 794) } }
      `}</style>
      <LeafletToolbar auto={auto} />
      <div className="sheet mx-auto w-fit shadow-[0_20px_60px_-20px_rgba(20,35,29,.35)]">
        <BenefitsLeaflet s={s} qr={qr} />
      </div>
    </div>
  );
}
