import Link from "next/link";
import { db } from "@/lib/db";
import { storefrontMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { taka } from "@/lib/utils";

export const metadata = storefrontMetadata(
  "/delivery", "Mushroom Delivery in Dhaka · ডেলিভারি এলাকা",
  "Check where FungiBd delivers mushrooms in Dhaka. See available neighborhoods, delivery fees, and how cash on delivery works.",
);

export default async function DeliveryPage() {
  const [settings, zones] = await Promise.all([
    getSettings(),
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true, nameEn: true, charge: true } }),
  ]);

  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="font-display text-4xl">ঢাকায় মাশরুম ডেলিভারি</h1>
      <p lang="en" className="mt-2 text-lg text-muted">Mushroom delivery in Dhaka</p>
      <section className="mt-8 rounded-xl border border-line bg-white p-6">
        <h2 className="text-xl font-semibold">সক্রিয় ডেলিভারি এলাকা · Delivery areas</h2>
        {zones.length ? (
          <ul className="mt-3 divide-y divide-line">
            {zones.map((zone) => (
              <li key={zone.id} className="flex justify-between gap-4 py-3">
                <span>{[zone.nameBn, zone.nameEn].filter(Boolean).join(" · ")}</span>
                <span className="font-semibold tabular-nums">{taka(zone.charge)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-muted">এখন কোনো ডেলিভারি এলাকা চালু নেই। · Delivery is currently unavailable.</p>}
        {zones.length > 0 && settings.delivery.freeDeliveryMin > 0 && (
          <p className="mt-3 text-sm text-ink-soft">{taka(settings.delivery.freeDeliveryMin)} বা তার বেশি মূল্যের যোগ্য অর্ডারে ডেলিভারি ফ্রি। · Free delivery on eligible orders from {taka(settings.delivery.freeDeliveryMin)}.</p>
        )}
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">কীভাবে অর্ডার করবেন · How to order</h2>
        <p className="mt-2 text-ink-soft">চেকআউটে আপনার এলাকা ও সময় বেছে নিন, ঠিকানা লিখুন এবং পণ্য হাতে পেয়ে টাকা দিন।</p>
        <p lang="en" className="mt-2 text-ink-soft">Choose your area and delivery time at checkout. Enter your address and pay in cash when your order arrives.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">মাশরুম দেখুন · Shop mushrooms</Link>
          <Link href="/policies" className="btn btn-outline">অর্ডার নীতি · Order policies</Link>
        </div>
      </section>
    </div>
  );
}
