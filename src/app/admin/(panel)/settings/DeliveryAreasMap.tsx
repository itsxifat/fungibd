"use client";
// Loaded only in the browser (DeliveryAreasEditor imports it with ssr:false).
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DeliveryArea } from "@/lib/geo";

type Pt = [number, number];

const corner = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#fff;border:3px solid #02604A;box-shadow:0 1px 4px rgba(0,0,0,.3)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const midpoint = L.divIcon({
  className: "",
  html: `<span style="display:block;width:12px;height:12px;border-radius:9999px;background:rgba(2,96,74,.55);border:2px solid #fff"></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function ViewReporter({ onView }: { onView: (c: Pt, zoom: number) => void }) {
  const map = useMapEvents({ moveend: () => onView([map.getCenter().lat, map.getCenter().lng], map.getZoom()) });
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    onView([map.getCenter().lat, map.getCenter().lng], map.getZoom());
  }, [map, onView]);
  return null;
}

/** Leaflet map that shows every delivery area and lets the owner reshape the selected one. */
export default function DeliveryAreasMap({
  areas,
  selected,
  bounds,
  onSelect,
  onEditStart,
  onPoints,
  onView,
}: {
  areas: DeliveryArea[];
  selected: number;
  bounds: [Pt, Pt];
  onSelect: (i: number) => void;
  /** Called once before a change so the editor can save an undo step. */
  onEditStart: () => void;
  onPoints: (i: number, points: Pt[]) => void;
  onView: (center: Pt, zoom: number) => void;
}) {
  const area = areas[selected];
  const pts = area?.points ?? [];
  const ll = (m: L.Marker): Pt => [Math.round(m.getLatLng().lat * 1e6) / 1e6, Math.round(m.getLatLng().lng * 1e6) / 1e6];

  return (
    <MapContainer bounds={bounds} scrollWheelZoom className="h-[420px] w-full" attributionControl>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ViewReporter onView={onView} />

      {areas.map((a, i) => (
        <Polygon
          key={`poly-${i}`}
          positions={a.points}
          pathOptions={i === selected ? { color: "#02604A", weight: 2.5, fillOpacity: 0.12 } : { color: "#6b7280", weight: 1.5, dashArray: "6 6", fillOpacity: 0.05 }}
          eventHandlers={{ click: () => onSelect(i) }}
        />
      ))}

      {area &&
        pts.map((p, k) => (
          <Marker
            key={`c-${selected}-${k}`}
            position={p}
            icon={corner}
            draggable
            title="Drag to move · tap to remove"
            eventHandlers={{
              dragstart: onEditStart,
              drag: (e) => onPoints(selected, pts.map((q, j) => (j === k ? ll(e.target as L.Marker) : q))),
              click: () => {
                if (pts.length <= 3) return;
                onEditStart();
                onPoints(selected, pts.filter((_, j) => j !== k));
              },
            }}
          />
        ))}

      {area &&
        pts.map((p, k) => {
          const n = pts[(k + 1) % pts.length];
          const mid: Pt = [(p[0] + n[0]) / 2, (p[1] + n[1]) / 2];
          const insert = (at: Pt) => {
            onEditStart();
            onPoints(selected, [...pts.slice(0, k + 1), at, ...pts.slice(k + 1)]);
          };
          return (
            <Marker
              key={`m-${selected}-${k}-${pts.length}`}
              position={mid}
              icon={midpoint}
              draggable
              title="Tap or drag to add a corner"
              eventHandlers={{ click: () => insert(mid), dragend: (e) => insert(ll(e.target as L.Marker)) }}
            />
          );
        })}
    </MapContainer>
  );
}
