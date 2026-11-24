"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { bnDigits, cn } from "@/lib/utils";

/*
 * "এক মুঠো মাশরুমে কী থাকে?" — a ~30 second brand film built from code (no video file to host).
 * Facts come from USDA FoodData Central (raw oyster mushroom, per 100 g) — same as the leaflet.
 */

const EASE = [0.2, 0.7, 0.1, 1] as const;

const SCENES = [
  { key: "intro", dur: 4800, chapter: "এক মুঠো মাশরুমে কী থাকে?" },
  { key: "kcal", dur: 4800, chapter: "হালকা খাবার" },
  { key: "protein", dur: 4800, chapter: "উদ্ভিজ্জ প্রোটিন" },
  { key: "heart", dur: 4800, chapter: "হার্টের জন্য হালকা" },
  { key: "sun", dur: 6000, chapter: "রোদের ভিটামিন" },
  { key: "outro", dur: 7000, chapter: "পরের হারভেস্ট থেকে বুক করুন" },
] as const;
type SceneKey = (typeof SCENES)[number]["key"];
const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return bnDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
};

/* ───────────── building blocks ───────────── */

function Lines({ lines, delay = 0.35, className, accentLast = false }: { lines: string[]; delay?: number; className?: string; accentLast?: boolean }) {
  return (
    <span className={cn("block", className)}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.14em] pt-[0.06em]">
          <motion.span className={cn("block", accentLast && i === lines.length - 1 && "text-tan")} initial={{ y: "115%" }} animate={{ y: 0 }} transition={{ delay: delay + i * 0.14, duration: 0.95, ease: EASE }}>
            {l}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Fade({ children, delay = 0, className, as = "p" }: { children: React.ReactNode; delay?: number; className?: string; as?: "p" | "div" }) {
  const anim = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.9, ease: EASE } };
  return as === "div" ? (
    <motion.div className={className} {...anim}>
      {children}
    </motion.div>
  ) : (
    <motion.p className={className} {...anim}>
      {children}
    </motion.p>
  );
}

function CountUp({ to, delay = 0.5, duration = 1.7 }: { to: number; delay?: number; duration?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, duration, reduce]);
  return <span className="tabular-nums">{bnDigits(v)}</span>;
}

function Ring({ value, delay = 0.45, duration = 1.8, className, children }: { value: number; delay?: number; duration?: number; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative aspect-square", className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(244,237,219,.12)" strokeWidth="1.4" />
        <motion.circle cx="60" cy="60" r="56" fill="none" stroke="var(--tan)" strokeWidth="2.2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: value }} transition={{ delay, duration, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Two-column scene on wide screens, stacked (visual on top) on phones. */
function Split({ visual, children }: { visual: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid grid-rows-[minmax(0,1fr)_auto] gap-[3cqw] px-[6cqw] pb-[24cqw] pt-[15cqw] sm:grid-cols-2 sm:grid-rows-1 sm:items-center sm:gap-[4cqw] sm:px-[7cqw] sm:pb-[9cqw] sm:pt-[6cqw]">
      <div className="relative grid min-h-0 place-items-center sm:order-2">{visual}</div>
      <div className="relative">{children}</div>
    </div>
  );
}

const headline = "mt-[1.5cqw] font-display text-[7.2cqw] leading-[1.2] text-cream sm:mt-[1cqw] sm:text-[4.2cqw]";
const sub = "mt-[2.4cqw] font-bangla text-[3.6cqw] leading-relaxed text-cream/75 sm:mt-[1.6cqw] sm:max-w-[36cqw] sm:text-[1.5cqw]";
const unit = "mt-[1cqw] font-bangla text-[3cqw] text-cream/70 sm:mt-[0.5cqw] sm:text-[1.15cqw]";

/* ───────────── scenes ───────────── */

function Intro() {
  return (
    <Split
      visual={
        <div className="relative grid place-items-center">
          <motion.div aria-hidden className="absolute aspect-square w-[52cqw] rounded-full bg-[radial-gradient(circle,rgba(244,237,219,.14),transparent_65%)] sm:w-[40cqw]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2, ease: EASE }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img src="/art/oyster-hd.svg" alt="" className="relative w-[44cqw] sm:w-[34cqw]" initial={{ scale: 1.14, y: "4%", opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ duration: 5.5, ease: [0.16, 0.8, 0.2, 1] }} />
        </div>
      }
    >
      <p className={headline}>
        <Lines lines={["এক মুঠো মাশরুমে", "কী থাকে?"]} />
      </p>
      <Fade className={sub} delay={1.1}>
        What&apos;s inside a handful of mushrooms.
      </Fade>
    </Split>
  );
}

function Kcal() {
  return (
    <Split
      visual={
        <Ring value={0.33} className="w-[36cqw] sm:w-[27cqw]">
          <span className="font-display text-[12cqw] leading-none text-cream sm:text-[8.5cqw]">
            <CountUp to={33} />
          </span>
          <span className={unit}>ক্যালরি · প্রতি ১০০ গ্রামে</span>
        </Ring>
      }
    >
      <p className={headline}>
        <Lines lines={["হালকা, তবু", "পেট ভরা"]} accentLast />
      </p>
      <Fade className={sub} delay={1.1}>
        ১০০ গ্রাম ঝিনুক মাশরুমে মাত্র ৩৩ ক্যালরি — আর আঁশ থাকায় অনেকক্ষণ খিদে লাগে না।
      </Fade>
    </Split>
  );
}

function Protein() {
  return (
    <Split
      visual={
        <div className="flex flex-col items-center text-center">
          <p className="font-display text-[15cqw] leading-none text-cream sm:text-[10cqw]">
            <CountUp to={9} duration={1.4} />
            <span className="text-cream/35">/৯</span>
          </p>
          <div className="mt-[3cqw] flex gap-[1.8cqw] sm:mt-[2cqw] sm:gap-[1.1cqw]" aria-hidden>
            {Array.from({ length: 9 }).map((_, i) => (
              <motion.span
                key={i}
                className="block aspect-square w-[3.4cqw] rounded-full sm:w-[1.7cqw]"
                initial={{ backgroundColor: "rgba(244,237,219,0.14)", scale: 0.8 }}
                animate={{ backgroundColor: "rgba(211,191,164,1)", scale: [0.8, 1.35, 1] }}
                transition={{ delay: 0.55 + i * 0.15, duration: 0.55, ease: EASE }}
              />
            ))}
          </div>
          <p className={unit}>প্রয়োজনীয় অ্যামাইনো অ্যাসিড</p>
        </div>
      }
    >
      <p className={headline}>
        <Lines lines={["দরকারি ৯টি অ্যামাইনো", "অ্যাসিডই আছে"]} accentLast />
      </p>
      <Fade className={sub} delay={1.1}>
        মাছ-মাংস কম খাওয়ার দিনের জন্য চমৎকার।
      </Fade>
    </Split>
  );
}

function Heart() {
  return (
    <Split
      visual={
        <Ring value={1} duration={2.2} className="w-[36cqw] sm:w-[27cqw]">
          <span className="font-display text-[14cqw] leading-none text-cream sm:text-[10cqw]">০</span>
          <span className={unit}>মি.গ্রা. কোলেস্টেরল</span>
        </Ring>
      }
    >
      <p className={headline}>
        <Lines lines={["কোলেস্টেরল", "একদম নেই"]} accentLast />
      </p>
      <Fade className={sub} delay={1.1}>
        ১০০ গ্রামে চর্বি মাত্র ০.৪ গ্রাম, সোডিয়াম কম — আর আছে ৪২০ মি.গ্রা. পটাশিয়াম।
      </Fade>
    </Split>
  );
}

function Sun() {
  return (
    <>
      <motion.div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_80%_at_72%_40%,rgba(240,199,114,.20),transparent_70%)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.6, ease: EASE }} />
      <Split
        visual={
          <div className="relative aspect-square w-[42cqw] sm:w-[33cqw]">
            <motion.div
              aria-hidden
              className="absolute -inset-[30%] [mask-image:radial-gradient(circle_at_64%_35%,#000,transparent_60%)]"
              style={{ background: "repeating-conic-gradient(from 0deg at 64% 35%, rgba(255,231,176,.10) 0deg 5deg, transparent 5deg 16deg)", transformOrigin: "64% 35%", animation: "ms-spin 60s linear infinite" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2.2 }}
            />
            <motion.div
              aria-hidden
              className="absolute right-[2%] top-0 aspect-square w-[52%] rounded-full"
              style={{ background: "radial-gradient(circle, #FFE9B8 0%, #F0C772 42%, rgba(240,199,114,0) 70%)" }}
              initial={{ y: "55%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 2.8, ease: EASE }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/art/oyster-hd.svg"
              alt=""
              className="absolute bottom-0 left-[2%] w-[80%]"
              initial={{ filter: "sepia(0) saturate(1) brightness(0.92)" }}
              animate={{ filter: "sepia(0.22) saturate(1.3) brightness(1.06)" }}
              transition={{ delay: 1.4, duration: 3, ease: "easeOut" }}
            />
          </div>
        }
      >
        <p className={headline}>
          <Lines lines={["রান্নার আগে", "৩০ মিনিট রোদে রাখুন"]} accentLast />
        </p>
        <Fade className={sub} delay={1.1}>
          রোদ পেলে মাশরুম নিজেই ভিটামিন ডি তৈরি করে — হাড় আর দাঁতের যত্নে।
        </Fade>
        <Fade as="div" delay={1.5} className="mt-[3cqw] flex items-center gap-[2.4cqw] sm:mt-[2cqw] sm:gap-[1cqw]">
          <Ring value={1} delay={1.6} duration={4} className="w-[10cqw] sm:w-[3.6cqw]" />
          <span className="font-bangla text-[3.4cqw] text-cream/80 sm:text-[1.25cqw]">৩০ মিনিট · রোদে</span>
        </Fade>
      </Split>
    </>
  );
}

function Outro() {
  const art = ["/art/oyster-hd.svg", "/art/milky.svg", "/art/shiitake.svg", "/art/pink.svg"];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[6cqw] pb-[22cqw] pt-[13cqw] text-center sm:pb-[9cqw] sm:pt-[5cqw]">
      <div className="flex items-end justify-center gap-[1.5cqw]" aria-hidden>
        {art.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img key={src} src={src} alt="" className="w-[17cqw] sm:w-[9cqw]" initial={{ y: "35%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.14, duration: 1.1, ease: EASE }} />
        ))}
      </div>
      <p className="mt-[3cqw] font-display text-[6.6cqw] leading-[1.22] text-cream sm:mt-[2cqw] sm:text-[3.7cqw]">
        <Lines lines={["খামারের তাজা মাশরুম,", "পরের হারভেস্ট থেকে বুক করুন"]} delay={0.8} accentLast />
      </p>
      <Fade as="div" delay={1.6} className="mt-[4cqw] flex flex-wrap justify-center gap-2 sm:mt-[2.4cqw] sm:gap-3">
        <Link href="/preorder" className="btn btn-cream max-sm:px-4 max-sm:py-2.5 max-sm:text-sm">
          প্রি-অর্ডার করুন
        </Link>
        <Link href="/leaflet?download=pdf" className="btn border border-cream/30 text-cream hover:bg-cream/10 max-sm:px-4 max-sm:py-2.5 max-sm:text-sm">
          লিফলেট (PDF)
        </Link>
      </Fade>
      <Fade delay={2.2} className="mt-[3cqw] max-w-[80cqw] text-[2.5cqw] leading-relaxed text-cream/45 sm:mt-[1.6cqw] sm:max-w-[50cqw] sm:text-[0.85cqw]">
        পুষ্টিতথ্য: USDA FoodData Central (কাঁচা ঝিনুক মাশরুম, প্রতি ১০০ গ্রাম)। এটি চিকিৎসা-পরামর্শ নয়।
      </Fade>
    </div>
  );
}

const RENDER: Record<SceneKey, () => React.ReactElement> = { intro: Intro, kcal: Kcal, protein: Protein, heart: Heart, sun: Sun, outro: Outro };

/** One still shaft of light from the grow-room window and a soft vignette — no looping decoration. */
function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-1/4 left-[52%] h-[150%] w-[26cqw] rotate-[16deg] bg-gradient-to-b from-cream/[0.08] to-transparent blur-2xl" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_50%,rgba(0,0,0,.45)_100%)]" />
    </div>
  );
}

/* ───────────── player ───────────── */

export function MotionStory() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  const [fs, setFs] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const elapsed = useRef(0);
  const scene = SCENES[idx];
  const Scene = RENDER[scene.key];
  const before = SCENES.slice(0, idx).reduce((a, s) => a + s.dur, 0);

  const go = useCallback((i: number) => {
    elapsed.current = 0;
    setProgress(0);
    setEnded(false);
    setIdx(Math.max(0, Math.min(SCENES.length - 1, i)));
  }, []);

  // playback clock
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const p = Math.min(1, elapsed.current / scene.dur);
      setProgress(p);
      if (p >= 1) {
        if (idx < SCENES.length - 1) go(idx + 1);
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
  }, [playing, idx, scene.dur, go]);

  // autoplay when most of the film is on screen; pause when scrolled away
  useEffect(() => {
    const el = boxRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.55) {
          if (!userPaused.current && !ended) setPlaying(true);
        } else setPlaying(false);
      },
      { threshold: [0, 0.55, 0.85] },
    );
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
    <MotionConfig reducedMotion="user">
      <div
        ref={boxRef}
        tabIndex={0}
        role="region"
        aria-roledescription="video"
        aria-label="মাশরুমের উপকারিতা — ৩০ সেকেন্ডের ভিডিও · Benefits of mushrooms"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === " " || e.key === "k") {
            e.preventDefault();
            toggle();
          }
          if (e.key === "ArrowRight") go(idx + 1);
          if (e.key === "ArrowLeft") go(idx - 1);
        }}
        className={cn(
          "@container group relative isolate w-full overflow-hidden bg-[#06261d] text-cream outline-none focus-visible:ring-2 focus-visible:ring-tan",
          fs ? "h-screen rounded-none" : "aspect-[4/5] rounded-[20px] sm:aspect-video",
        )}
      >
        <Atmosphere />

        {/* brand watermark */}
        <div className="pointer-events-none absolute left-[5cqw] top-[5cqw] z-10 flex items-center gap-[1.6cqw] opacity-80 sm:left-[3cqw] sm:top-[3cqw] sm:gap-[0.6cqw]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.svg" alt="" className="h-[6.5cqw] w-auto sm:h-[2.3cqw]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-cream.svg" alt="" className="h-[4.2cqw] w-auto sm:h-[1.5cqw]" />
        </div>

        <AnimatePresence>
          <motion.div
            key={idx}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <Scene />
          </motion.div>
        </AnimatePresence>

        {/* Big play button before the first play (and when motion is reduced) */}
        {!playing && idx === 0 && progress === 0 && (
          <button type="button" onClick={toggle} className="absolute inset-0 z-20 grid place-items-center bg-black/20" aria-label="ভিডিও চালান · Play">
            <span className="grid size-20 place-items-center rounded-full bg-cream text-brand-deep shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors duration-150 group-hover:bg-white sm:size-24">
              <Play className="ml-1 size-9 fill-current" aria-hidden />
            </span>
          </button>
        )}

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 z-30 px-[4cqw] pb-[3cqw] pt-10 sm:px-[3cqw] sm:pb-[2cqw]">
          <div className="flex gap-1">
            {SCENES.map((s, i) => (
              <button key={s.key} type="button" onClick={() => go(i)} className="group/seg relative h-5 flex-1" aria-label={`দৃশ্য ${bnDigits(i + 1)} · ${s.chapter}`}>
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-cream/20">
                  <span className="block h-full rounded-full bg-cream" style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }} />
                </span>
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <button type="button" onClick={toggle} className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-brand-deep transition-colors duration-150 hover:bg-white" aria-label={ended ? "আবার দেখুন · Replay" : playing ? "থামান · Pause" : "চালান · Play"}>
              {ended ? <RotateCcw className="size-4" aria-hidden /> : playing ? <Pause className="size-4 fill-current" aria-hidden /> : <Play className="ml-0.5 size-4 fill-current" aria-hidden />}
            </button>
            <span className="min-w-0 flex-1 truncate font-bangla text-xs text-cream/80 sm:text-sm">{scene.chapter}</span>
            <span className="shrink-0 text-xs tabular-nums text-cream/60">
              {clock(before + progress * scene.dur)} / {clock(TOTAL)}
            </span>
            <button type="button" onClick={toggleFs} className="grid size-11 shrink-0 place-items-center rounded-full text-cream/80 transition-colors duration-150 hover:bg-cream/10" aria-label={fs ? "ফুলস্ক্রিন বন্ধ · Exit fullscreen" : "ফুলস্ক্রিন · Fullscreen"}>
              {fs ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
