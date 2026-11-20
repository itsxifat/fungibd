"use client";
import { useEffect, useRef, useState } from "react";

const A4_WIDTH_PX = 793.7; // 210 mm at 96 dpi

/** Shows the A4 leaflet at the container's width. Uses CSS zoom (re-lays out text) so it stays sharp, not blurry. */
export function ScaledLeaflet({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / A4_WIDTH_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full">
      <div style={{ zoom: scale ?? 0.5, visibility: scale ? "visible" : "hidden" }}>{children}</div>
    </div>
  );
}
