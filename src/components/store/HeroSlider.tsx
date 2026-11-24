"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { artFor } from "@/components/brand/ProductImage";
import { bnDigits, cn } from "@/lib/utils";

export type HeroSlideView = { image: string; title: string; caption: string; href: string };

const INTERVAL = 5500;

/** Home-page hero slider — slides come from Admin → Settings → Home page (or pre-order products by default). */
export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const count = slides.length;
  const multi = count > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const autoplay = multi && !reduced;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="ফিচার্ড · Featured"
      className="group/slider relative aspect-[5/4] w-full touch-pan-y select-none overflow-hidden rounded-[20px] bg-cream lg:aspect-auto lg:h-[540px]"
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
        const body = (
          <>
            {art ? (
              <div className="absolute inset-0 grid place-items-center" style={{ background: art.tint }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.src}
                  alt=""
                  draggable={false}
                  className={cn("h-[74%] w-[74%] object-contain transition-transform duration-[6000ms] ease-out", active ? "scale-100" : "scale-[1.04]")}
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image}
                alt=""
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out", active ? "scale-100" : "scale-[1.04]")}
              />
            )}
            {(s.title || s.caption) && (
              <div className={cn("absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-auto", multi ? "sm:max-w-[calc(100%-9.5rem)]" : "sm:max-w-[calc(100%-2.5rem)]")}>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 pl-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  <div className="min-w-0 flex-1">
                    {s.title && <p className="truncate font-display text-lg leading-snug text-ink sm:text-xl">{s.title}</p>}
                    {s.caption && <p className="truncate font-bangla text-sm text-ink-soft">{s.caption}</p>}
                  </div>
                  {s.href && (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-white">
                      <ArrowUpRight className="size-5" aria-hidden />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        );
        const label = `${bnDigits(i + 1)} / ${bnDigits(count)}${s.title ? ` · ${s.title}` : ""}`;
        const common = {
          role: "group" as const,
          "aria-roledescription": "slide",
          "aria-label": label,
          "aria-hidden": !active,
          inert: !active,
          className: cn("group/slide absolute inset-0 block transition-opacity duration-500 ease-[var(--ease)]", active ? "z-[1] opacity-100" : "z-0 opacity-0"),
        };
        return s.href ? (
          <Link key={i} href={s.href} draggable={false} {...common}>
            {body}
          </Link>
        ) : (
          <div key={i} {...common}>
            {body}
          </div>
        );
      })}

      {multi && (
        <>
          <div className="absolute inset-x-4 top-4 z-[2] flex gap-1.5 sm:inset-x-5 sm:top-5">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className="group/bar relative h-6 flex-1"
                aria-label={`স্লাইড ${bnDigits(i + 1)}${s.title ? ` · ${s.title}` : ""}`}
                aria-current={i === index}
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-ink/15 transition-[height] group-hover/bar:h-[5px]">
                  {i < index && <span className="absolute inset-0 bg-ink/70" />}
                  {i === index && (
                    <span
                      key={`${index}-${reduced}`}
                      className="absolute inset-0 origin-left bg-ink/70"
                      style={autoplay ? { animation: `hero-progress ${INTERVAL}ms linear forwards`, animationPlayState: paused ? "paused" : "running" } : undefined}
                      onAnimationEnd={autoplay ? () => go(index + 1) : undefined}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 z-[2] hidden gap-2 sm:bottom-5 sm:right-5 sm:flex">
            <button type="button" onClick={() => go(index - 1)} className="grid size-11 place-items-center rounded-[10px] border border-line bg-white text-ink transition-colors duration-150 hover:border-line-strong" aria-label="আগের স্লাইড · Previous">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="grid size-11 place-items-center rounded-[10px] border border-line bg-white text-ink transition-colors duration-150 hover:border-line-strong" aria-label="পরের স্লাইড · Next">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
