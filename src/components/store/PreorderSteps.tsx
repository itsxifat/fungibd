import { CalendarCheck, CalendarClock, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { Icon: CalendarClock, bn: "আজই বুক করুন", text: "মাশরুম আর পরিমাণ বেছে নিন। অগ্রিম টাকা লাগে না।" },
  { Icon: CalendarCheck, bn: "হারভেস্টের দিন জানাব", text: "তোলার দিন ঠিক হলে ইমেইলে জানিয়ে দেব।" },
  { Icon: HandCoins, bn: "হাতে পেয়ে টাকা", text: "নির্ধারিত দিনে দরজায় ডেলিভারি, ক্যাশ অন ডেলিভারি।" },
];

/** How pre-order works — one quiet row of three steps, divided by hairlines (no boxed cards). */
export function PreorderSteps({ className }: { className?: string }) {
  return (
    <ol className={cn("grid divide-line sm:grid-cols-3 sm:divide-x max-sm:divide-y", className)}>
      {STEPS.map(({ Icon, bn, text }, i) => (
        <li key={bn} className="flex gap-3 py-4 sm:px-5 sm:py-1 sm:first:pl-0 sm:last:pr-0">
          <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="block font-bangla text-[15px] font-semibold">
              <span className="sr-only">ধাপ {i + 1}: </span>
              {bn}
            </span>
            <span className="mt-0.5 block font-bangla text-sm leading-relaxed text-ink-soft">{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
