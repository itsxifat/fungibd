import { Check } from "lucide-react";
import { WholesaleForm } from "@/components/store/StoreForms";
import { storefrontMetadata } from "@/lib/seo";

export const metadata = storefrontMetadata("/wholesale", "Wholesale Mushrooms in Dhaka · পাইকারি মাশরুম", "Request bulk or recurring mushroom supply from FungiBd for restaurants, hotels, caterers and shops in Dhaka.");

export default function WholesalePage() {
  return (
    <div className="container-x py-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-4xl">পাইকারি ও নিয়মিত অর্ডার</h1>
          <p className="mt-2 text-muted">For restaurants, hotels, caterers and shops in Dhaka.</p>
          <p className="mt-6 font-bangla leading-relaxed text-ink-soft">
            রেস্টুরেন্ট, হোটেল, ক্যাটারিং বা দোকানের জন্য বেশি পরিমাণে বা নিয়মিত মাশরুম দরকার? ফর্মটি পূরণ করুন — আমরা আপনার সাথে যোগাযোগ করে দাম ও ডেলিভারির বিষয়ে কথা বলব।
          </p>
          <ul className="mt-6 space-y-3 font-bangla text-[15px]">
            {["আপনার প্রয়োজন অনুযায়ী পরিমাণ", "নির্দিষ্ট দিনে নিয়মিত ডেলিভারি (ঢাকা ও আশপাশে)", "সরাসরি আমাদের খামার থেকে"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <Check className="size-4 text-muted" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <section className="rounded-xl border border-line bg-white p-6">
          <WholesaleForm />
        </section>
      </div>
    </div>
  );
}
