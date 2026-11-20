import { getSettings } from "@/lib/settings";
import { num } from "@/lib/utils";

export const metadata = { title: "ডেলিভারি ও অর্ডার নীতি · Policies" };

export default async function PoliciesPage() {
  const s = await getSettings();
  const sections = [
    {
      h: "ডেলিভারি এলাকা · Delivery area",
      p: "আমরা শুধুমাত্র ঢাকা সিটির ভিতরে ডেলিভারি দিই। ডেলিভারি চার্জ এলাকাভেদে ভিন্ন এবং চেকআউটে দেখানো হয়।" + (s.delivery.freeDeliveryMin > 0 ? ` ৳${num(s.delivery.freeDeliveryMin)} বা তার বেশি অর্ডারে ডেলিভারি ফ্রি।` : ""),
    },
    { h: "ডেলিভারির সময় · Delivery time", p: "চেকআউটে আপনি ডেলিভারির দিন ও সময় বেছে নেন। অর্ডার নিশ্চিত হওয়ার পর প্রতিটি আপডেট ইমেইলে জানানো হয়।" },
    { h: "প্রি-অর্ডার · Pre-orders", p: "প্রি-অর্ডারের পণ্য হারভেস্টের পর নির্ধারিত তারিখে ডেলিভারি দেওয়া হয়। কোনো কারণে তারিখ পরিবর্তন হলে আমরা ইমেইল বা ফোনে জানাব।" },
    { h: "পেমেন্ট · Payment", p: "ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।" },
    { h: "অর্ডার বাতিল · Cancellation", p: "ডেলিভারির জন্য রওনা হওয়ার আগে আমাদের ফোন বা সাপোর্ট পেজের মাধ্যমে জানালে অর্ডার বাতিল বা পরিবর্তন করা যাবে।" },
    { h: "সমস্যা হলে · Issues with your order", p: "পণ্য নিয়ে কোনো সমস্যা হলে ডেলিভারির দিনেই সাপোর্ট পেজে ছবিসহ জানান। আমরা দ্রুত যোগাযোগ করব।" },
    { h: "গোপনীয়তা · Privacy", p: "আপনার নাম, ফোন, ইমেইল ও ঠিকানা শুধুমাত্র অর্ডার ডেলিভারি ও যোগাযোগের জন্য ব্যবহার করা হয়। অফার ইমেইল যেকোনো সময় বন্ধ করা যায়।" },
  ];
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="font-display text-4xl">ডেলিভারি ও অর্ডার নীতি</h1>
      <p className="mt-2 text-muted">Delivery, order and privacy policy</p>
      <div className="mt-10 space-y-8">
        {sections.map((x) => (
          <section key={x.h}>
            <h2 className="font-semibold">{x.h}</h2>
            <p className="mt-2 font-bangla leading-relaxed text-ink-soft">{x.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-muted">
        প্রশ্ন থাকলে: {s.store.phone} · {s.store.email}
      </p>
    </div>
  );
}
