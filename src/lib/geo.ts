export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** A delivery area drawn in Admin → Settings → Delivery: a name and its corners as [lat, lng]. */
export type DeliveryArea = { name: string; points: [number, number][] };
/** What the delivery check needs from settings. With areas drawn they win; otherwise the older circle is used. */
export type DeliveryShape = { centerLat: number; centerLng: number; radiusKm: number; areas?: DeliveryArea[] };

const inBangladesh = (lat: number, lng: number) => lat >= 20.3 && lat <= 26.8 && lng >= 87.9 && lng <= 92.8;

/** Validates areas coming from the admin form or the database: at most 20 areas of 3–200 corners inside Bangladesh. */
export function cleanAreas(raw: unknown): DeliveryArea[] {
  if (!Array.isArray(raw)) return [];
  const out: DeliveryArea[] = [];
  for (const a of raw.slice(0, 20)) {
    if (!a || typeof a !== "object") continue;
    const { name, points } = a as { name?: unknown; points?: unknown };
    if (!Array.isArray(points)) continue;
    const pts: [number, number][] = [];
    for (const p of points.slice(0, 200)) {
      if (!Array.isArray(p) || p.length !== 2) continue;
      const [lat, lng] = p.map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng) && inBangladesh(lat, lng)) pts.push([Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6]);
    }
    if (pts.length >= 3) out.push({ name: typeof name === "string" ? name.trim().slice(0, 60) : "", points: pts });
  }
  return out;
}

/** Ray casting on lng/lat; fine at city scale. */
export function pointInPolygon(lat: number, lng: number, pts: [number, number][]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [yi, xi] = pts[i];
    const [yj, xj] = pts[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function insideDeliveryArea(lat: number, lng: number, d: DeliveryShape) {
  const areas = cleanAreas(d.areas);
  if (areas.length) return areas.some((a) => pointInPolygon(lat, lng, a.points));
  return distanceKm(lat, lng, d.centerLat, d.centerLng) <= d.radiusKm;
}

/** The older circle as a polygon, so the area editor can start from what the shop already used. */
export function circleToPolygon(lat: number, lng: number, radiusKm: number, corners = 16): [number, number][] {
  const dLat = radiusKm / 110.574;
  const dLng = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: corners }, (_, i) => {
    const t = (i / corners) * 2 * Math.PI;
    return [Math.round((lat + dLat * Math.sin(t)) * 1e6) / 1e6, Math.round((lng + dLng * Math.cos(t)) * 1e6) / 1e6] as [number, number];
  });
}

/** Box around everything the shop delivers to (areas, or the circle), for fitting maps and biasing searches. */
export function deliveryBounds(d: DeliveryShape, padKm = 0) {
  const areas = cleanAreas(d.areas);
  const pts = areas.length ? areas.flatMap((a) => a.points) : circleToPolygon(d.centerLat, d.centerLng, d.radiusKm, 8);
  const lats = pts.map((p) => p[0]);
  const lngs = pts.map((p) => p[1]);
  const padLat = padKm / 110.574;
  const padLng = padKm / 111.32;
  return { south: Math.min(...lats) - padLat, north: Math.max(...lats) + padLat, west: Math.min(...lngs) - padLng, east: Math.max(...lngs) + padLng };
}

export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
export const directionsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
