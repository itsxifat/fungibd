import { BENEFITS } from "@/lib/content";
import { BENEFIT_ICONS } from "@/components/brand/benefit-icons";
import { Reveal } from "./Reveal";

export function BenefitGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {BENEFITS.map((b, i) => {
        const Icon = BENEFIT_ICONS[b.icon];
        return (
          <Reveal key={b.key} delay={(i % 5) * 0.06} className="h-full">
            <div className="group h-full rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tint text-brand transition group-hover:bg-brand group-hover:text-cream">
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <p className="mt-4 font-bangla text-[17px] font-bold leading-tight">{b.titleBn}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{b.titleEn}</p>
              <p className="mt-2 font-bangla text-sm leading-relaxed text-ink-soft">{b.textBn}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{b.textEn}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
