import { BENEFITS } from "@/lib/content";
import { BENEFIT_ICONS } from "@/components/brand/benefit-icons";

export function BenefitGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {BENEFITS.map((b) => {
        const Icon = BENEFIT_ICONS[b.icon];
        return (
          <div key={b.key} className="h-full rounded-xl border border-line bg-white p-5">
            <Icon className="size-5 text-muted" strokeWidth={1.75} aria-hidden />
            <p className="mt-4 font-bangla text-[17px] font-semibold leading-snug">{b.titleBn}</p>
            <p className="text-xs text-muted">{b.titleEn}</p>
            <p className="mt-2 font-bangla text-sm leading-relaxed text-ink-soft">{b.textBn}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{b.textEn}</p>
          </div>
        );
      })}
    </div>
  );
}
