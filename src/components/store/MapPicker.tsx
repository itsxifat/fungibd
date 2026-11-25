"use client";
// Loaded only in the browser (see CheckoutForm: dynamic import with ssr:false)
import { useEffect, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Hand, Loader2, MapPin, Search, TriangleAlert } from "lucide-react";
import { cleanAreas, deliveryBounds, distanceKm, insideDeliveryArea, type DeliveryArea, type DeliveryShape } from "@/lib/geo";
import { GoogleMapView } from "./GoogleMapView";
import { googleReverse, googleSearch, loadGoogleMaps, onGoogleAuthFailure, type PlaceResult } from "./google-maps";

const pin = L.divIcon({
  className: "",
  html: `<svg width="42" height="52" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg"><path d="M21 51s17-17.6 17-30A17 17 0 0 0 4 21c0 12.4 17 30 17 30Z" fill="#02604A" stroke="#F4EDDB" stroke-width="3"/><circle cx="21" cy="20" r="7" fill="#F4EDDB"/></svg>`,
  iconSize: [42, 52],
  iconAnchor: [21, 50],
});

export type Pin = { lat: number; lng: number };

// Free OpenStreetMap search and reverse lookup (through /api/geo), used without a Google key or when Google fails.
async function osmSearch(q: string): Promise<PlaceResult[]> {
  const r = (await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`).then((x) => x.json())) as { results?: { lat: number; lng: number; label: string }[] };
  return (r.results ?? []).map((x) => ({ key: `${x.lat},${x.lng}`, label: x.label, resolve: async () => ({ pin: { lat: x.lat, lng: x.lng }, label: x.label }) }));
}
async function osmReverse(p: Pin): Promise<string> {
  const r = (await fetch(`/api/geo/reverse?lat=${p.lat}&lng=${p.lng}`).then((x) => x.json())) as { label?: string };
  return r.label ?? "";
}

function Clicks({ onPick }: { onPick: (p: Pin) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}
function Fly({ to }: { to: Pin | null }) {
  const map = useMap();
  const last = useRef<string>("");
  useEffect(() => {
    if (!to) return;
    const k = `${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
    if (k === last.current) return;
    last.current = k;
    map.flyTo([to.lat, to.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [to, map]);
  return null;
}

export default function MapPicker({
  value,
  onChange,
  center,
  radiusKm,
  areas = [],
  onAddress,
  googleKey = "",
}: {
  value: Pin | null;
  onChange: (p: Pin) => void;
  center: Pin;
  radiusKm: number;
  /** Delivery areas drawn in Admin; while there are none, the circle (center + radiusKm) is used. */
  areas?: DeliveryArea[];
  onAddress?: (label: string) => void;
  /** Admin → Settings → Delivery. Empty = free OpenStreetMap map. */
  googleKey?: string;
}) {
  const [engine, setEngine] = useState<"loading" | "google" | "osm">(googleKey ? "loading" : "osm");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState<"search" | "locate" | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [label, setLabel] = useState("");
  const shape: DeliveryShape = { centerLat: center.lat, centerLng: center.lng, radiusKm, areas };
  const drawn = cleanAreas(areas);
  const outside = value ? !insideDeliveryArea(value.lat, value.lng, shape) : false;
  const useGoogle = engine === "google";
  const lastLookup = useRef<Pin | null>(null);
  const lookupSeq = useRef(0);

  // Load Google when a key is set; any failure (bad key, blocked, slow) switches to the free map.
  useEffect(() => {
    if (!googleKey) return;
    let live = true;
    const off = onGoogleAuthFailure(() => live && setEngine("osm"));
    loadGoogleMaps(googleKey)
      .then(() => live && setEngine((e) => (e === "loading" ? "google" : e)))
      .catch(() => live && setEngine("osm"));
    return () => {
      live = false;
      off();
    };
  }, [googleKey]);

  const showLabel = (l: string) => {
    setLabel(l);
    onAddress?.(l);
  };

  const pick = async (p: Pin, knownLabel?: string) => {
    onChange(p);
    setResults([]);
    if (knownLabel) {
      lastLookup.current = p;
      return showLabel(knownLabel);
    }
    // Small nudges (under ~15 m) keep the address we already have; saves lookups.
    const last = lastLookup.current;
    if (last && distanceKm(p.lat, p.lng, last.lat, last.lng) < 0.015) return;
    lastLookup.current = p;
    const seq = ++lookupSeq.current;
    let l = useGoogle ? await googleReverse(p).catch(() => "") : "";
    if (!l) l = await osmReverse(p).catch(() => "");
    if (l && seq === lookupSeq.current) showLabel(l);
  };

  const search = async () => {
    const text = q.trim();
    if (text.length < 3) return;
    setBusy("search");
    setMsg("");
    try {
      let r = useGoogle ? await googleSearch(text, deliveryBounds(shape, 5)).catch(() => [] as PlaceResult[]) : [];
      if (!r.length) r = await osmSearch(text).catch(() => [] as PlaceResult[]);
      setResults(r);
      if (!r.length) setMsg("কিছু পাওয়া যায়নি — ম্যাপে ট্যাপ করে পিন দিন · Not found, tap the map instead");
    } finally {
      setBusy(null);
    }
  };

  const choose = async (r: PlaceResult) => {
    setResults([]);
    setBusy("search");
    try {
      const { pin: p, label: l } = await r.resolve();
      pick(p, l);
    } catch {
      setMsg("জায়গাটি খোলা যায়নি — আবার চেষ্টা করুন বা ম্যাপে পিন দিন");
    } finally {
      setBusy(null);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return setMsg("আপনার ব্রাউজারে লোকেশন সাপোর্ট নেই");
    setBusy("locate");
    setMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(null);
        pick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setBusy(null);
        setMsg("লোকেশন পাওয়া যায়নি — অনুমতি দিন বা ম্যাপে পিন করুন · Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="map-search" className="sr-only">
            Search your area
          </label>
          <input
            id="map-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="এলাকা/রোড লিখে খুঁজুন · e.g. Dhanmondi 27"
            className="input pl-10"
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-[500] mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              {results.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => choose(r)} className="flex w-full gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-brand-tint">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={search} className="btn btn-outline" disabled={busy !== null}>
          {busy === "search" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} খুঁজুন
        </button>
        <button type="button" onClick={locate} className="btn btn-primary" disabled={busy !== null}>
          {busy === "locate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} আমার লোকেশন
        </button>
      </div>
      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <div className="relative overflow-hidden rounded-xl border border-line">
        {engine === "loading" ? (
          <div className="grid h-[300px] w-full place-items-center bg-paper sm:h-[340px]">
            <Loader2 className="size-6 animate-spin text-muted" aria-hidden />
          </div>
        ) : useGoogle ? (
          <GoogleMapView value={value} shape={shape} onPick={(p) => pick(p)} onFail={() => setEngine("osm")} />
        ) : (
        <MapContainer
          {...(value ? { center: value, zoom: 16 } : { bounds: ((b) => [[b.south, b.west], [b.north, b.east]] as [[number, number], [number, number]])(deliveryBounds(shape)) })}
          scrollWheelZoom={false}
          className="h-[300px] w-full sm:h-[340px]"
          attributionControl
        >
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {drawn.length ? (
            drawn.map((a, i) => <Polygon key={i} positions={a.points} pathOptions={{ color: "#02604A", weight: 1.5, fillOpacity: 0.05, dashArray: "6 6" }} interactive={false} />)
          ) : (
            <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#02604A", weight: 1.5, fillOpacity: 0.04, dashArray: "6 6" }} interactive={false} />
          )}
          {value && (
            <Marker
              position={value}
              icon={pin}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = (e.target as L.Marker).getLatLng();
                  pick({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}
          <Clicks onPick={(p) => pick(p)} />
          <Fly to={value} />
        </MapContainer>
        )}
        {!value && engine !== "loading" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[400] mx-auto flex w-fit items-center gap-1.5 rounded-lg bg-ink/85 px-3.5 py-2 font-bangla text-xs text-white">
            <Hand className="size-3.5" aria-hidden /> {useGoogle ? "ম্যাপ সরিয়ে বা ট্যাপ করে পিনটি বাসার উপর রাখুন" : "ম্যাপে আপনার বাসার জায়গায় ট্যাপ করুন"}
          </div>
        )}
      </div>
      {value && !outside && label && (
        <p className="flex gap-2 rounded-xl bg-brand-tint px-3 py-2 text-xs text-brand-deep">
          <MapPin className="size-4 shrink-0" aria-hidden /> <span>{label}</span>
        </p>
      )}
      {outside && (
        <p className="flex gap-2 rounded-xl bg-red-50 px-3 py-2 font-bangla text-sm text-red-700" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> এই লোকেশনটি আমাদের ডেলিভারি এলাকার বাইরে। অন্য জায়গায় পিন দিন, অথবা এলাকা বেছে ঠিকানা লিখুন।
        </p>
      )}
    </div>
  );
}
