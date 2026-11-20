"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Validated chart palette (colour-blind safe, ≥3:1 on white): series-1 = FungiBd green step, series-2 = violet
export const SERIES = ["#0a7d5e", "#6250d6"];
const AXIS = { fontSize: 11, fill: "#78716c" };
const GRID = "#ece9e4";

const compact = (v: number) => (Math.abs(v) >= 100000 ? `৳${(v / 100000).toFixed(1)}L` : Math.abs(v) >= 1000 ? `৳${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `৳${v}`);
const money = (v: number) => `৳${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function TooltipBox({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; fmt: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-stone-900">{label ? shortDate(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-stone-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-stone-900 tabular-nums">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-stone-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Revenue vs gross profit over time — one axis, same unit (৳). */
export function TrendChart({ data, series }: { data: Record<string, number | string>[]; series: { key: string; label: string }[] }) {
  return (
    <div>
      <Legend items={series.map((s, i) => ({ label: s.label, color: SERIES[i] }))} />
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
            <YAxis tickFormatter={compact} tick={AXIS} tickLine={false} axisLine={false} width={52} />
            <Tooltip content={<TooltipBox fmt={money} />} cursor={{ stroke: "#a8a29e", strokeDasharray: "3 3" }} />
            {series.map((s, i) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Single-series daily bars (e.g. orders per day). */
export function DailyBars({ data, dataKey, label, unit = "" }: { data: Record<string, number | string>[]; dataKey: string; label: string; unit?: string }) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={32} />
          <Tooltip content={<TooltipBox fmt={(v) => `${v}${unit}`} />} cursor={{ fill: "#f5f5f4" }} />
          <Bar dataKey={dataKey} name={label} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars rendered in HTML (labels never collide). */
export function RankBars({ rows, unit = "money" }: { rows: { label: string; value: number; sub?: string }[]; unit?: "money" | "orders" }) {
  const format = unit === "money" ? money : (v: number) => `${v} orders`;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${format(r.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(r.value)}
              {r.sub && <span className="ml-1.5 text-xs font-normal text-stone-500">{r.sub}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-stone-100">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: SERIES[0] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
