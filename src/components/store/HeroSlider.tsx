"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { artFor } from "@/components/brand/ProductImage";
import { bnDigits, cn } from "@/lib/utils";

export type HeroSlideView = { image: string; title: string; caption: string; href: string };
export type HeroLead = { harvestLine: string; title: string; titleEn: string; sub: string; ctas: { label: string; href: string; primary: boolean }[] };

const INTERVAL = 6000;

/**
 * Home banner: slide 1 is the owner's headline (Admin → Settings → Home page) on brand green;
 * the owner's uploaded photos follow. Swipe, arrows and progress bars appear only with more than one slide.
 */
export function HeroSlider({ lead, slides }: { lead: HeroLead; slides: HeroSlideView[] }) {
  const total = slides.length + 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const multi = total > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);
  const autoplay = multi && !reduced;
  const frame = (i: number) => ({
    role: "group" as const,
    "aria-roledescription": "slide",
    "aria-label": `${bnDigits(i + 1)} / ${bnDigits(total)}`,
    "aria-hidden": i !== index,
    inert: i !== index,
  });
  const fade = (i: number) => cn("absolute inset-0 transition-opacity duration-500 ease-[var(--ease)]", i === index ? "z-[1] opacity-100" : "z-0 opacity-0");

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="FungiBd"
      className="relative h-[380px] w-full touch-pan-y select-none overflow-hidden rounded-xl bg-brand-deep sm:h-[400px] lg:h-auto lg:min-h-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (!d || !multi) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
          swiped.current = true;
          go(index + (dx < 0 ? 1 : -1));
        }
      }}
      onClickCapture={(e) => {
        if (swiped.current) {
          e.preventDefault();
          swiped.current = false;
        }
      }}
    >
      {/* Slide 1 — the owner's headline banner */}
      <div {...frame(0)} className={cn(fade(0), "grid items-center sm:grid-cols-[1.15fr_1fr]")}>
        <div className={cn("relative z-[1] px-6 pt-8 sm:py-10 sm:pl-10 lg:pl-12", multi ? "pb-14" : "pb-8")}>
          <h1 className="max-w-[16ch] font-display text-[2rem] leading-[1.2] text-white sm:text-[2.6rem] lg:text-5xl">{lead.title}</h1>
          {lead.titleEn && (
            <p lang="en" className="mt-2 text-base text-white/65">
              {lead.titleEn}
            </p>
          )}
          {lead.sub && <p className="mt-4 max-w-[38ch] font-bangla text-[16px] leading-relaxed text-white/80 sm:text-[17px]">{lead.sub}</p>}
          {lead.ctas.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              {lead.ctas.map((c) => (
                <Link key={c.href + c.label} href={c.href} className={c.primary ? "btn btn-cta btn-lg" : "btn btn-lg border border-white/35 text-white hover:border-white hover:bg-white/10"}>
                  {c.label} {c.primary && <ArrowRight className="size-4" aria-hidden />}
                </Link>
              ))}
            </div>
          )}
          {lead.harvestLine && (
            <p className="mt-5 flex items-center gap-2 font-bangla text-[15px] text-white/75">
              <CalendarClock className="size-[18px] shrink-0" aria-hidden /> {lead.harvestLine}
            </p>
          )}
        </div>
        <div aria-hidden className="relative hidden h-full sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/oyster-hd.svg" alt="" className="absolute bottom-6 right-6 w-[88%] max-w-[420px]" draggable={false} />
        </div>
      </div>

      {/* Owner's photo slides */}
      {slides.map((s, k) => {
        const i = k + 1;
        const art = artFor(s.image);
        const body = (
          <>
            {art ? (
              <div className="absolute inset-0 grid place-items-center" style={{ background: art.tint }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art.src} alt="" draggable={false} className="h-[76%] w-[76%] object-contain" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {(s.title || s.caption) && (
              <div className={cn("absolute bottom-5 left-5 right-5 sm:right-auto", multi ? "sm:max-w-[calc(100%-9rem)]" : "sm:max-w-[calc(100%-2.5rem)]")}>
                <div className="flex items-center gap-3 rounded-xl bg-white p-3 pl-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  <div className="min-w-0 flex-1">
                    {s.title && <p className="truncate font-display text-lg leading-snug text-ink sm:text-xl">{s.title}</p>}
                    {s.caption && <p className="truncate font-bangla text-sm text-ink-soft">{s.caption}</p>}
                  </div>
                  {s.href && (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-white">
                      <ArrowRight className="size-5" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        );
        return s.href ? (
          <Link key={i} href={s.href} draggable={false} {...frame(i)} className={cn(fade(i), "block")}>
            {body}
          </Link>
        ) : (
          <div key={i} {...frame(i)} className={fade(i)}>
            {body}
          </div>
        );
      })}

      {multi && (
        <div className="absolute inset-x-5 bottom-4 z-[2] flex items-center justify-between gap-4 sm:inset-x-8">
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} className="group/bar relative h-6 w-7" aria-label={`স্লাইড ${bnDigits(i + 1)}`} aria-current={i === index}>
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/30">
                  {i < index && <span className="absolute inset-0 bg-white" />}
                  {i === index && (
                    <span
                      key={`${index}-${reduced}`}
                      className="absolute inset-0 origin-left bg-white"
                      style={autoplay ? { animation: `hero-progress ${INTERVAL}ms linear forwards`, animationPlayState: paused ? "paused" : "running" } : undefined}
                      onAnimationEnd={autoplay ? () => go(index + 1) : undefined}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => go(index - 1)} className="grid size-10 place-items-center rounded-full bg-white/90 text-ink transition-colors duration-150 hover:bg-white" aria-label="আগের স্লাইড">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="grid size-10 place-items-center rounded-full bg-white/90 text-ink transition-colors duration-150 hover:bg-white" aria-label="পরের স্লাইড">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
