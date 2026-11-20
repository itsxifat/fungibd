"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { ProductImage } from "@/components/brand/ProductImage";

export async function uploadFiles(files: FileList | File[], folder = "products") {
  const fd = new FormData();
  fd.set("folder", folder);
  for (const f of Array.from(files)) fd.append("file", f);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls as string[];
}

export function ImageUploader({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const real = value.filter((v) => !v.startsWith("art:"));
  const move = (i: number, d: number) => {
    const a = [...real];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {real.map((src, i) => (
          <div key={src} className="group relative">
            <ProductImage src={src} alt="" className="h-28 w-28 rounded-lg border border-stone-200" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white">Main</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1" aria-label="Move left">
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => onChange(real.filter((x) => x !== src))} className="rounded bg-white/90 p-1 text-red-600" aria-label="Remove image">
                <X className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1" aria-label="Move right">
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => input.current?.click()} className="grid h-28 w-28 place-items-center rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-brand hover:text-brand">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus className="h-5 w-5" /> Add photos</span>}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          if (!e.target.files?.length) return;
          setBusy(true);
          setErr("");
          try {
            const urls = await uploadFiles(e.target.files);
            onChange([...real, ...urls]);
          } catch (x) {
            setErr((x as Error).message);
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <p className="hint">JPG/PNG/WebP, resized and compressed automatically. First photo is the main image.</p>
    </div>
  );
}
