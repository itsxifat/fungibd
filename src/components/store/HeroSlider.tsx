"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { artFor } from "@/components/brand/ProductImage";
import { bnDigits, cn } from "@/lib/utils";

export type HeroSlideView = { image: string; title: string; caption: string; href: string };

const INTERVAL = 5500;

/**
 * Picture slider on the right of the home banner. Slides come from Admin → Settings → Home page → Hero slider;
 * with none uploaded the page passes the products instead. Swipe, arrows and progress appear only with more than one.
 */
export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
  const count = slides.length;
  const multi = count > 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const autoplay = multi && !reduced;
  if (!count) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="ছবি · Pictures"
      className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-xl bg-cream/70 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[440px]"
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
      {slides.map((s, i) => {
        const active = i === index;
        const art = artFor(s.image);
        const frame = {
          role: "group" as const,
          "aria-roledescription": "slide",
          "aria-label": `${bnDigits(i + 1)} / ${bnDigits(count)}${s.title ? ` · ${s.title}` : ""}`,
          "aria-hidden": !active,
          inert: !active,
          className: cn("absolute inset-0 block transition-opacity duration-500 ease-[var(--ease)]", active ? "z-[1] opacity-100" : "z-0 opacity-0"),
        };
        const body = (
          <>
            {art ? (
              <div className="absolute inset-0 grid place-items-center" style={{ background: art.tint }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art.src} alt="" draggable={false} className="h-[72%] w-[72%] object-contain" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt={s.title} draggable={false} loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
            )}
            {(s.title || s.caption) && (
              <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-[85%]">
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
          <Link key={i} href={s.href} draggable={false} {...frame}>
            {body}
          </Link>
        ) : (
          <div key={i} {...frame}>
            {body}
          </div>
        );
      })}

      {multi && (
        <>
          <div className="absolute right-3 top-3 z-[2] flex gap-1 rounded-full bg-ink/55 px-2 py-0.5">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} className="relative h-6 w-6" aria-label={`ছবি ${bnDigits(i + 1)}`} aria-current={i === index}>
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/35">
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
          <button type="button" onClick={() => go(index - 1)} className="absolute left-3 top-1/2 z-[2] hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-colors duration-150 hover:bg-white sm:grid" aria-label="আগের ছবি">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" onClick={() => go(index + 1)} className="absolute right-3 top-1/2 z-[2] hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-colors duration-150 hover:bg-white sm:grid" aria-label="পরের ছবি">
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
