"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LatLng } from "./google-maps";

/**
 * Google map with a fixed centre pin: the customer moves the map (or taps a spot) and the pin marks the point
 * under it. Needs loadGoogleMaps() to have resolved. Calls onFail if the map library cannot start.
 */
export function GoogleMapView({ value, center, radiusKm, onPick, onFail }: { value: LatLng | null; center: LatLng; radiusKm: number; onPick: (p: LatLng) => void; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const handlers = useRef({ onPick, onFail });
  const initial = useRef({ value, center, radiusKm });
  const touched = useRef(value !== null);
  const skipIdle = useRef(false);
  const [ready, setReady] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    handlers.current = { onPick, onFail };
  });

  useEffect(() => {
    let cancelled = false;
    const listeners: google.maps.MapsEventListener[] = [];
    (async () => {
      try {
        const { Map, Circle } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled || !box.current) return;
        const { value: v, center: c, radiusKm: r } = initial.current;
        const m = new Map(box.current, { center: v ?? c, zoom: v ? 17 : 13, gestureHandling: "greedy", disableDefaultUI: true, zoomControl: true, clickableIcons: false });
        new Circle({ map: m, center: c, radius: r * 1000, clickable: false, strokeColor: "#02604A", strokeOpacity: 0.8, strokeWeight: 1.5, fillColor: "#02604A", fillOpacity: 0.04 });
        listeners.push(
          m.addListener("dragstart", () => {
            touched.current = true;
            setLifted(true);
          }),
          m.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            touched.current = true;
            m.panTo(e.latLng);
          }),
          m.addListener("idle", () => {
            setLifted(false);
            if (skipIdle.current) {
              skipIdle.current = false;
              return;
            }
            const ctr = m.getCenter();
            if (touched.current && ctr) handlers.current.onPick({ lat: ctr.lat(), lng: ctr.lng() });
          }),
        );
        map.current = m;
        setReady(true);
      } catch {
        if (!cancelled) handlers.current.onFail();
      }
    })();
    return () => {
      cancelled = true;
      listeners.forEach((l) => l.remove());
    };
  }, []);

  // Search results and "my location" move the map to the new pin without picking it a second time.
  useEffect(() => {
    const m = map.current;
    if (!m || !value) return;
    const ctr = m.getCenter();
    if (ctr && Math.abs(ctr.lat() - value.lat) < 1e-7 && Math.abs(ctr.lng() - value.lng) < 1e-7) return;
    touched.current = true;
    skipIdle.current = true;
    m.panTo(value);
    if ((m.getZoom() ?? 0) < 16) m.setZoom(17);
  }, [value, ready]);

  return (
    <div className="relative">
      <div ref={box} className="h-[300px] w-full bg-paper sm:h-[340px]" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-paper">
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden />
        </div>
      )}
      {ready && (
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-[1]">
          <span className="absolute left-1/2 top-0 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/30" />
          <svg
            width="42"
            height="52"
            viewBox="0 0 42 52"
            className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 transition-transform duration-150 ease-[var(--ease)]", lifted && "-translate-y-2", !value && "opacity-85")}
          >
            <path d="M21 51s17-17.6 17-30A17 17 0 0 0 4 21c0 12.4 17 30 17 30Z" fill="#02604A" stroke="#F4EDDB" strokeWidth="3" />
            <circle cx="21" cy="20" r="7" fill="#F4EDDB" />
          </svg>
        </div>
      )}
    </div>
  );
}
