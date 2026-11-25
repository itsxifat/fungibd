import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/security";
import { getSettings } from "@/lib/settings";
import { deliveryBounds } from "@/lib/geo";

// Free OpenStreetMap geocoding (Nominatim). We proxy it to send a proper User-Agent, cache results,
// keep requests within their usage policy (max ~1/sec) and limit searches to the delivery areas (plus a margin).
const cache = new Map<string, { at: number; data: unknown }>();
let lastCall = 0;
const UA = "FungiBd-Website/1.0 (+https://fungibd.com)";

async function nominatim(path: string) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < 24 * 3600_000) return hit.data;
  const wait = Math.max(0, lastCall + 1100 - Date.now());
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
  const res = await fetch(`https://nominatim.openstreetmap.org${path}`, { headers: { "User-Agent": UA, "Accept-Language": "bn,en" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Geocoder ${res.status}`);
  const data = await res.json();
  cache.set(path, { at: Date.now(), data });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return data;
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!(await rateLimit("geo", 40, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const url = new URL(req.url);
  try {
    if (action === "search") {
      const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
      if (q.length < 3) return NextResponse.json({ results: [] });
      const b = deliveryBounds((await getSettings()).delivery, 8);
      const viewbox = [b.west, b.north, b.east, b.south].map((n) => n.toFixed(4)).join(","); // left,top,right,bottom
      const data = (await nominatim(`/search?format=jsonv2&limit=6&countrycodes=bd&viewbox=${viewbox}&bounded=1&q=${encodeURIComponent(q)}`)) as { lat: string; lon: string; display_name: string }[];
      return NextResponse.json({ results: data.map((d) => ({ lat: Number(d.lat), lng: Number(d.lon), label: d.display_name })) });
    }
    if (action === "reverse") {
      const lat = Number(url.searchParams.get("lat"));
      const lng = Number(url.searchParams.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "Bad coordinates" }, { status: 400 });
      const data = (await nominatim(`/reverse?format=jsonv2&zoom=18&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`)) as { display_name?: string };
      return NextResponse.json({ label: data.display_name ?? "" });
    }
  } catch {
    return NextResponse.json({ results: [], label: "", error: "Map search is unavailable right now" }, { status: 200 });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
