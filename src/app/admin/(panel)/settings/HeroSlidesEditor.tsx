"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { uploadFiles } from "@/components/admin/ImageUploader";
import { ProductImage } from "@/components/brand/ProductImage";
import type { HeroSlide } from "@/lib/settings";

const MAX = 8;
const blank = (): HeroSlide => ({ image: "", title: "", caption: "", href: "" });

/** Home-page hero slides: photo + title + small text + link. Saved as JSON in a hidden input. */
export function HeroSlidesEditor({ name, defaultValue }: { name: string; defaultValue: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(defaultValue);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const update = (i: number, patch: Partial<HeroSlide>) => setSlides((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setSlides((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const a = [...s];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(slides.filter((s) => s.image))} />
      {slides.length === 0 && <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-600">No pictures yet — the slider shows your products automatically.</p>}
      <ol className="space-y-3">
        {slides.map((s, i) => (
          <li key={i} className="grid gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[150px_1fr_auto]">
            <label className="relative block aspect-[5/4] w-full cursor-pointer overflow-hidden rounded-lg border border-dashed border-stone-300 hover:border-brand sm:w-[150px]">
              {s.image ? (
                <ProductImage src={s.image} alt="" className="h-full w-full" />
              ) : (
                <span className="grid h-full place-items-center text-xs text-stone-500">
                  <span className="flex flex-col items-center gap-1">
                    <ImagePlus className="h-5 w-5" /> Upload photo
                  </span>
                </span>
              )}
              {busy === i && (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBusy(i);
                  setErr("");
                  try {
                    const [url] = await uploadFiles([f], "site");
                    update(i, { image: url });
                  } catch (x) {
                    setErr((x as Error).message);
                  } finally {
                    setBusy(null);
                    e.target.value = "";
                  }
                }}
              />
              <span className="sr-only">Slide {i + 1} photo</span>
            </label>
            <div className="grid content-start gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="label">Title</span>
                <input value={s.title} onChange={(e) => update(i, { title: e.target.value })} className="input input-sm" placeholder="ঝিনুক মাশরুম" maxLength={120} />
              </label>
              <label className="block">
                <span className="label">Small text</span>
                <input value={s.caption} onChange={(e) => update(i, { caption: e.target.value })} className="input input-sm" placeholder="৳৯০ থেকে · হারভেস্ট ২৫ নভেম্বর" maxLength={160} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Opens when clicked (optional)</span>
                <input value={s.href} onChange={(e) => update(i, { href: e.target.value })} className="input input-sm" placeholder="/product/oyster-mushroom or /preorder" />
              </label>
              {!s.image && <p className="text-xs text-amber-700 sm:col-span-2">Add a photo — slides without a photo are not shown.</p>}
            </div>
            <div className="flex gap-1 sm:flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30" aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-30" aria-label="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setSlides((x) => x.filter((_, j) => j !== i))} className="rounded-lg border border-stone-200 p-2 text-red-600 hover:bg-red-50" aria-label="Remove slide">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setSlides((s) => [...s, blank()])} disabled={slides.length >= MAX} className="btn btn-outline btn-sm mt-3 rounded-lg bg-white">
        <Plus className="h-4 w-4" /> Add slide
      </button>
      <span className="hint ml-3">Up to {MAX} slides · wide photos (about 1200 × 1000) look best.</span>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
