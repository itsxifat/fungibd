// All business dates are in Dhaka time (UTC+6, no daylight saving).
const OFFSET = 6 * 60 * 60 * 1000;
export const DAY = 24 * 60 * 60 * 1000;
export const TZ = "Asia/Dhaka";

export function dhakaParts(d: Date = new Date()) {
  const x = new Date(d.getTime() + OFFSET);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate(), dow: x.getUTCDay(), h: x.getUTCHours(), min: x.getUTCMinutes() };
}

export function startOfDay(d: Date = new Date()) {
  const p = dhakaParts(d);
  return new Date(Date.UTC(p.y, p.m, p.d) - OFFSET);
}
export function endOfDay(d: Date = new Date()) {
  return new Date(startOfDay(d).getTime() + DAY - 1);
}
export function startOfMonth(d: Date = new Date()) {
  const p = dhakaParts(d);
  return new Date(Date.UTC(p.y, p.m, 1) - OFFSET);
}
export function startOfYear(d: Date = new Date()) {
  const p = dhakaParts(d);
  return new Date(Date.UTC(p.y, 0, 1) - OFFSET);
}
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export function addMonths(d: Date, n: number) {
  const p = dhakaParts(d);
  return new Date(Date.UTC(p.y, p.m + n, Math.min(p.d, 28)) - OFFSET);
}

/** "2026-11-20" in Dhaka time */
export function dateKey(d: Date) {
  const p = dhakaParts(d);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
/** Parse "YYYY-MM-DD" as Dhaka midnight */
export function parseDateKey(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - OFFSET);
}
/** For <input type="datetime-local"> values interpreted in Dhaka time */
export function parseLocalDateTime(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return parseDateKey(s);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - OFFSET);
}
export function toLocalDateTimeValue(d: Date | null | undefined) {
  if (!d) return "";
  const p = dhakaParts(d);
  return `${dateKey(d)}T${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

export function fmtDate(d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(d);
}
export function fmtDateTime(d: Date | null | undefined) {
  return fmtDate(d, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}
export function fmtDateBn(d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", weekday: "long" }) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, ...opts }).format(d);
}
export function timeAgo(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}
export const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / DAY);

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "lastmonth" | "90d" | "year" | "custom";
export const RANGE_LABELS: Record<Exclude<RangeKey, "custom">, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  lastmonth: "Last month",
  "90d": "Last 90 days",
  year: "This year",
};

/** Resolve ?range=30d or ?from=YYYY-MM-DD&to=YYYY-MM-DD into [from, to) */
export function resolveRange(sp: { range?: string; from?: string; to?: string }, fallback: Exclude<RangeKey, "custom"> = "30d") {
  const now = new Date();
  const today = startOfDay(now);
  const f = parseDateKey(sp.from);
  const t = parseDateKey(sp.to);
  if (f && t && t >= f) return { from: f, to: addDays(t, 1), key: "custom" as RangeKey, label: `${fmtDate(f)} – ${fmtDate(t)}` };
  const key: Exclude<RangeKey, "custom"> = sp.range && sp.range in RANGE_LABELS ? (sp.range as Exclude<RangeKey, "custom">) : fallback;
  let from = today;
  let to = addDays(today, 1);
  switch (key) {
    case "yesterday":
      from = addDays(today, -1);
      to = today;
      break;
    case "7d":
      from = addDays(today, -6);
      break;
    case "30d":
      from = addDays(today, -29);
      break;
    case "90d":
      from = addDays(today, -89);
      break;
    case "month":
      from = startOfMonth(now);
      break;
    case "lastmonth":
      from = startOfMonth(addMonths(startOfMonth(now), -1));
      to = startOfMonth(now);
      break;
    case "year":
      from = startOfYear(now);
      break;
  }
  return { from, to, key: key as RangeKey, label: RANGE_LABELS[key] };
}

/** Previous period of equal length, for comparisons */
export function previousRange(from: Date, to: Date) {
  const len = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - len), to: from };
}

/** List of day keys between from (inclusive) and to (exclusive) */
export function dayKeys(from: Date, to: Date) {
  const out: string[] = [];
  for (let t = startOfDay(from).getTime(); t < to.getTime(); t += DAY) out.push(dateKey(new Date(t)));
  return out;
}
