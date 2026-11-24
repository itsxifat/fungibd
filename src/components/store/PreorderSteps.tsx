import { CalendarCheck, CalendarClock, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { Icon: CalendarClock, bn: "আজই বুক করুন", text: "পছন্দের মাশরুম আর পরিমাণ বেছে নিন। অগ্রিম টাকা লাগে না।" },
  { Icon: CalendarCheck, bn: "হারভেস্টের দিন জানাব", text: "তোলার দিন ঠিক হলে ইমেইলে জানিয়ে দেব।" },
  { Icon: HandCoins, bn: "হাতে পেয়ে টাকা", text: "নির্ধারিত দিনে দরজায় ডেলিভারি, ক্যাশ অন ডেলিভারি।" },
];

/** How pre-order works — three short steps. `dark` for green/dark sections. */
export function PreorderSteps({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <ol className={cn("grid gap-3", className)}>
      {STEPS.map(({ Icon, bn, text }, i) => (
        <li key={bn} className={cn("flex gap-2.5 rounded-xl p-4", dark ? "bg-cream/[0.06] ring-1 ring-cream/10" : "border border-line bg-white")}>
          <Icon className={cn("mt-0.5 size-[18px] shrink-0", dark ? "text-cream/60" : "text-muted")} aria-hidden />
          <span>
            <span className={cn("block font-bangla font-semibold", dark && "text-cream")}>
              <span className="sr-only">ধাপ {i + 1}: </span>
              {bn}
            </span>
            <span className={cn("mt-0.5 block font-bangla text-sm leading-relaxed", dark ? "text-cream/70" : "text-ink-soft")}>{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
