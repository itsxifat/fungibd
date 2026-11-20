"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, ImageDown, Loader2, Printer } from "lucide-react";
import { LEAFLET_ID } from "@/components/store/leaflet-id";

async function render(kind: "pdf" | "png") {
  const node = document.getElementById(LEAFLET_ID);
  if (!node) return;
  await document.fonts.ready;
  const { toJpeg, toPng } = await import("html-to-image");
  // render at 3× (≈ 290 dpi) for a crisp print
  const opts = { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" };
  if (kind === "png") {
    const url = await toPng(node, opts);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FungiBd-mushroom-benefits.png";
    a.click();
    return;
  }
  const img = await toJpeg(node, { ...opts, quality: 0.95 });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);
  pdf.setProperties({ title: "FungiBd — মাশরুমের ১০টি উপকারিতা", author: "FungiBd" });
  pdf.save("FungiBd-mushroom-benefits.pdf");
}

export function LeafletToolbar({ auto }: { auto: "pdf" | "print" | null }) {
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const [err, setErr] = useState("");
  const run = useCallback(async (kind: "pdf" | "png") => {
    setBusy(kind);
    setErr("");
    try {
      await render(kind);
    } catch {
      setErr("ডাউনলোড করা যায়নি — “প্রিন্ট” বাটন দিয়ে PDF সেভ করুন। Download failed, use Print → Save as PDF.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    // development-only helper to check the rendered image without downloading
    if (process.env.NODE_ENV !== "production")
      (window as unknown as { __leafletPreview: () => Promise<string> }).__leafletPreview = async () => {
        const { toPng } = await import("html-to-image");
        await document.fonts.ready;
        return toPng(document.getElementById(LEAFLET_ID)!, { pixelRatio: 1, cacheBust: true, backgroundColor: "#ffffff" });
      };
    if (!auto) return;
    const t = setTimeout(() => (auto === "pdf" ? run("pdf") : window.print()), 700);
    return () => clearTimeout(t);
  }, [auto, run]);

  return (
    <div className="no-print mx-auto mb-6 flex max-w-[794px] flex-wrap items-center justify-between gap-3 px-4">
      <Link href="/" className="btn btn-ghost btn-sm">
        <ArrowLeft className="h-4 w-4" /> FungiBd
      </Link>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run("pdf")} disabled={busy !== null} className="btn btn-primary btn-sm">
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF ডাউনলোড
        </button>
        <button type="button" onClick={() => run("png")} disabled={busy !== null} className="btn btn-outline btn-sm bg-white">
          {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />} ছবি (PNG)
        </button>
        <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm bg-white">
          <Printer className="h-4 w-4" /> প্রিন্ট
        </button>
      </div>
      {err && <p className="w-full text-right text-xs text-red-600">{err}</p>}
    </div>
  );
}
