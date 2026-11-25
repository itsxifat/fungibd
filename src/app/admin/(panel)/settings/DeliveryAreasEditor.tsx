"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Undo2 } from "lucide-react";
import { circleToPolygon, deliveryBounds, type DeliveryArea } from "@/lib/geo";
import { cn } from "@/lib/utils";

type Pt = [number, number];

const DeliveryAreasMap = dynamic(() => import("./DeliveryAreasMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse bg-stone-100" />,
});

/**
 * Admin → Settings → Delivery: draw the places the shop delivers to. A checkout pin must fall inside one of them.
 * Saves as JSON in a hidden field. With nothing drawn yet it starts from the older circle and saves nothing until edited.
 */
export function DeliveryAreasEditor({ name, defaultAreas, center, radiusKm }: { name: string; defaultAreas: DeliveryArea[]; center: { lat: number; lng: number }; radiusKm: number }) {
  const seeded = defaultAreas.length === 0;
  const [areas, setAreas] = useState<DeliveryArea[]>(() => (seeded ? [{ name: "ঢাকা", points: circleToPolygon(center.lat, center.lng, radiusKm) }] : defaultAreas));
  const [selected, setSelected] = useState(0);
  const [dirty, setDirty] = useState(!seeded);
  const history = useRef<DeliveryArea[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const latest = useRef(areas);
  useEffect(() => {
    latest.current = areas;
  }, [areas]);
  const view = useRef<{ center: Pt; zoom: number }>({ center: [center.lat, center.lng], zoom: 11 });

  // Fit the map once, to whatever existed when the page opened
  const bounds = useMemo<[Pt, Pt]>(() => {
    const b = deliveryBounds({ centerLat: center.lat, centerLng: center.lng, radiusKm, areas }, 1);
    return [
      [b.south, b.west],
      [b.north, b.east],
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One undo step per change, taken just before it (drag start, add, delete, insert, remove)
  const snapshot = useCallback(() => {
    history.current.push(latest.current.map((a) => ({ ...a, points: [...a.points] })));
    if (history.current.length > 50) history.current.shift();
    setCanUndo(true);
    setDirty(true);
  }, []);
  const setPoints = useCallback((i: number, points: Pt[]) => setAreas((cur) => cur.map((a, j) => (j === i ? { ...a, points } : a))), []);
  const onView = useCallback((c: Pt, zoom: number) => {
    view.current = { center: c, zoom };
  }, []);

  const addArea = () => {
    snapshot();
    // A small square in the middle of the visible map, ready to be dragged into shape
    const [lat, lng] = view.current.center;
    const half = Math.max(0.003, 0.25 / 2 ** (view.current.zoom - 8));
    const square: Pt[] = [
      [lat + half, lng - half],
      [lat + half, lng + half],
      [lat - half, lng + half],
      [lat - half, lng - half],
    ].map(([a, b]) => [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6]);
    setAreas((cur) => [...cur, { name: `এলাকা ${cur.length + 1}`, points: square }]);
    setSelected(areas.length);
  };
  const removeArea = () => {
    snapshot();
    setAreas((cur) => cur.filter((_, i) => i !== selected));
    setSelected(0);
  };
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setCanUndo(history.current.length > 0);
    setAreas(prev);
    setSelected((s) => Math.min(s, Math.max(0, prev.length - 1)));
  };

  const area = areas[selected];

  return (
    <div className="space-y-3">
      {/* Empty when untouched on first use, so saving other delivery settings keeps the circle */}
      <input type="hidden" name={name} value={dirty ? JSON.stringify(areas) : ""} />

      <div className="flex flex-wrap items-center gap-2">
        {areas.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={cn("rounded-lg border px-3 py-1.5 text-sm transition-colors", i === selected ? "border-brand bg-brand text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500")}
          >
            {a.name || `এলাকা ${i + 1}`}
          </button>
        ))}
        <button type="button" onClick={addArea} className="btn btn-outline btn-sm rounded-lg bg-white">
          <Plus className="size-4" aria-hidden /> Add area
        </button>
        <button type="button" onClick={undo} className="btn btn-outline btn-sm ml-auto rounded-lg bg-white" disabled={!canUndo}>
          <Undo2 className="size-4" aria-hidden /> Undo
        </button>
      </div>

      {area && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-48 flex-1">
            <span className="label">Area name</span>
            <input
              value={area.name}
              onChange={(e) => {
                setDirty(true);
                const v = e.target.value.slice(0, 60);
                setAreas((cur) => cur.map((a, j) => (j === selected ? { ...a, name: v } : a)));
              }}
              placeholder="যেমন: ঢাকা, সাভার"
              className="input input-sm"
            />
          </label>
          <button type="button" onClick={removeArea} className="btn btn-outline btn-sm rounded-lg bg-white text-red-700 hover:border-red-300">
            <Trash2 className="size-4" aria-hidden /> Delete this area
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200">
        <DeliveryAreasMap areas={areas} selected={selected} bounds={bounds} onSelect={setSelected} onEditStart={snapshot} onPoints={setPoints} onView={onView} />
      </div>

      <p className="hint">
        Drag a white corner to move it. Tap a small green dot between corners to add a corner there. Tap a corner to remove it. Tap an area to select it. Customers can pin anywhere inside any area; save
        when you are done.
      </p>
      {seeded && !dirty && <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">This starts from your current delivery circle. Nothing changes at checkout until you edit an area and save.</p>}
      {areas.length === 0 && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">No areas drawn: checkout will use the circle below.</p>}
    </div>
  );
}
