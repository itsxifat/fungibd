"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import type { Benefit } from "@/lib/content";
import { BENEFIT_ICONS } from "@/components/brand/benefit-icons";
import { bnDigits, cn } from "@/lib/utils";

type Scene = { kind: "intro" } | { kind: "benefit"; b: Benefit; i: number } | { kind: "outro" };
const DUR = { intro: 4600, benefit: 4400, outro: 6500 };

const words = (s: string) => s.split(" ");

function IntroScene() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.img
        src="/brand/mark.svg"
        alt=""
        className="h-20 w-20 sm:h-28 sm:w-28"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 12 }}
      />
      <motion.p className="mt-5 text-[11px] font-bold uppercase tracking-[0.3em] text-tan sm:text-xs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        FungiBd presents
      </motion.p>
      <h3 className="mt-3 font-display text-4xl leading-tight text-cream sm:text-6xl md:text-7xl">
        {words("মাশরুম কেন খাবেন?").map((w, i) => (
          <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.6 + i * 0.18, duration: 0.6 }}>
            {w}
          </motion.span>
        ))}
      </h3>
      <motion.p className="mt-3 text-lg text-cream/80 sm:text-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        10 reasons to eat mushrooms every week
      </motion.p>
      <motion.div className="mt-6 h-1 rounded-full bg-tan" initial={{ width: 0 }} animate={{ width: 96 }} transition={{ delay: 1.8, duration: 0.8 }} />
    </div>
  );
}

function BenefitScene({ b, i, total }: { b: Benefit; i: number; total: number }) {
  const Icon = BENEFIT_ICONS[b.icon];
  const flip = i % 2 === 1;
  return (
    <div className={cn("relative z-10 grid h-full grid-rows-[auto_1fr] items-center gap-4 px-6 py-8 sm:grid-cols-2 sm:grid-rows-1 sm:gap-10 sm:px-14", flip && "sm:[&>*:first-child]:order-2")}>
      {/* Animated icon medallion */}
      <div className="relative mx-auto grid aspect-square w-[40%] place-items-center sm:w-[62%]">
        <motion.div
          className="absolute inset-0 rounded-full border border-white/15"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        />
        <motion.div
          className="absolute inset-[14%] rounded-full bg-cream"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
        />
        <motion.div className="relative" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 14 }}>
          <Icon className="h-12 w-12 text-brand sm:h-20 sm:w-20" strokeWidth={1.5} />
        </motion.div>
      </div>
      {/* Copy */}
      <div className="text-center sm:text-left">
        <motion.p className="text-sm font-medium tracking-widest text-tan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          {bnDigits(String(i + 1).padStart(2, "0"))} / {bnDigits(total)}
        </motion.p>
        <h3 className="mt-2 font-display text-3xl leading-tight text-cream sm:text-5xl" aria-live="polite">
          {words(b.titleBn).map((w, k) => (
            <motion.span key={k} className="mr-[0.22em] inline-block" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.12, duration: 0.5 }}>
              {w}
            </motion.span>
          ))}
        </h3>
        <motion.p className="mt-1 text-base text-cream/70 sm:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          {b.titleEn}
        </motion.p>
        <motion.p className="mx-auto mt-3 max-w-md font-bangla text-[15px] leading-relaxed text-cream/90 sm:mx-0 sm:mt-5 sm:text-lg" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          {b.textBn}
        </motion.p>
        <motion.div
          className="mt-4 inline-flex items-baseline gap-2 rounded-xl border border-white/15 px-4 py-2 sm:mt-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
        >
          <span className="font-display text-2xl font-semibold text-tan sm:text-3xl">{b.stat}</span>
          <span className="text-xs text-cream/75 sm:text-sm">{b.statLabel}</span>
        </motion.div>
      </div>
    </div>
  );
}

function OutroScene() {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.p className="text-xs font-bold uppercase tracking-[0.3em] text-tan" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Fresh from our farm
      </motion.p>
      <motion.h3 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-cream sm:text-6xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        প্রতিদিনের খাবারে রাখুন তাজা মাশরুম
      </motion.h3>
      <motion.p className="mt-3 text-lg text-cream/75 sm:text-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Add a handful to your meals, three times a week.
      </motion.p>
      <motion.div className="mt-7 flex flex-wrap justify-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
        <Link href="/shop" className="btn btn-cream btn-lg">
          এখনই অর্ডার করুন · Order now
        </Link>
        <Link href="/leaflet" className="btn btn-lg border border-cream/30 text-cream hover:bg-cream/10">
          লিফলেট ডাউনলোড
        </Link>
      </motion.div>
      <p className="mt-6 max-w-lg text-[11px] text-cream/50">পুষ্টি তথ্য: USDA FoodData Central (ঝিনুক মাশরুম, প্রতি ১০০ গ্রাম)। এটি চিকিৎসা পরামর্শ নয়। · Nutrition info only, not medical advice.</p>
    </div>
  );
}

export function MotionStory({ benefits }: { benefits: Benefit[] }) {
  const scenes: Scene[] = [{ kind: "intro" }, ...benefits.map((b, i) => ({ kind: "benefit" as const, b, i })), { kind: "outro" }];
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  const [fs, setFs] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const elapsed = useRef(0);
  const scene = scenes[idx];
  const dur = DUR[scene.kind];

  const go = useCallback(
    (i: number) => {
      elapsed.current = 0;
      setProgress(0);
      setEnded(false);
      setIdx(Math.max(0, Math.min(scenes.length - 1, i)));
    },
    [scenes.length],
  );

  // playback clock
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const p = Math.min(1, elapsed.current / dur);
      setProgress(p);
      if (p >= 1) {
        if (idx < scenes.length - 1) go(idx + 1);
        else {
          setPlaying(false);
          setEnded(true);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, idx, dur, go, scenes.length]);

  // autoplay when visible
  useEffect(() => {
    const el = boxRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > 0.45) {
        if (!userPaused.current && !ended) setPlaying(true);
      } else setPlaying(false);
    }, { threshold: [0, 0.45, 0.8] });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, ended]);

  useEffect(() => {
    const on = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggle = () => {
    if (ended) {
      go(0);
      userPaused.current = false;
      setPlaying(true);
      return;
    }
    userPaused.current = playing;
    setPlaying(!playing);
  };
  const toggleFs = () => {
    if (!document.fullscreenElement) boxRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="region"
      aria-roledescription="motion video"
      aria-label="Benefits of mushrooms — animated story"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          toggle();
        }
        if (e.key === "ArrowRight") go(idx + 1);
        if (e.key === "ArrowLeft") go(idx - 1);
      }}
      className={cn(
        "group relative isolate w-full overflow-hidden bg-brand text-cream outline-none",
        fs ? "h-screen rounded-none" : "aspect-[4/5] rounded-[1.75rem] sm:aspect-video",
      )}
    >


      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0 pb-16"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
          transition={{ duration: 0.45 }}
        >
          {scene.kind === "intro" && <IntroScene />}
          {scene.kind === "benefit" && <BenefitScene b={scene.b} i={scene.i} total={benefits.length} />}
          {scene.kind === "outro" && <OutroScene />}
        </motion.div>
      </AnimatePresence>

      {/* Big play overlay before first play */}
      {!playing && idx === 0 && progress === 0 && (
        <button type="button" onClick={toggle} className="absolute inset-0 z-20 grid place-items-center bg-brand-night/30" aria-label="Play">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-cream text-brand-deep shadow-2xl transition group-hover:scale-110 sm:h-24 sm:w-24">
            <Play className="ml-1 h-9 w-9 fill-current" />
          </span>
        </button>
      )}

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/50 to-transparent px-4 pb-4 pt-10 sm:px-6">
        <div className="flex gap-1">
          {scenes.map((_, i) => (
            <button key={i} type="button" onClick={() => go(i)} className="group/seg relative h-4 flex-1" aria-label={`Scene ${i + 1}`}>
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-cream/25 transition-all group-hover/seg:h-[5px]">
                <span className="block h-full rounded-full bg-cream" style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-brand-deep" aria-label={ended ? "Replay" : playing ? "Pause" : "Play"}>
            {ended ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
          <span className="truncate text-xs text-cream/80 sm:text-sm">
            {scene.kind === "benefit" ? `${scene.b.titleBn} · ${scene.b.titleEn}` : scene.kind === "intro" ? "মাশরুমের ১০টি উপকারিতা · 10 benefits" : "FungiBd · fungibd.com"}
          </span>
          <button type="button" onClick={toggleFs} className="ml-auto grid h-9 w-9 place-items-center rounded-full text-cream/80 hover:bg-cream/10" aria-label="Fullscreen">
            {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
