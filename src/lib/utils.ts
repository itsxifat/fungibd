import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Round money to 2 decimals (avoids floating point drift in totals). */
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** ৳1,25,000 style (South-Asian digit grouping). */
export function taka(n: number | null | undefined, decimals = false) {
  const v = round2(Number(n ?? 0));
  const s = Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : Number.isInteger(v) ? 0 : 2,
  });
  return `${v < 0 ? "-" : ""}৳${s}`;
}

export function num(n: number | null | undefined, max = 2) {
  return Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: max });
}

export function pct(n: number, digits = 1) {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export const bnDigits = (v: string | number) => String(v).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** Customer-facing money in Bangla digits: ৳১,২৫০ — the storefront uses one digit system everywhere. */
export const takaBn = (n: number | null | undefined) => bnDigits(taka(n));

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Normalise Bangladeshi mobile numbers to 01XXXXXXXXX. Returns null if invalid. */
export function normalizePhone(raw: string): string | null {
  const digits = raw
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/[^\d]/g, "")
    .replace(/^(?:00)?880/, "");
  const p = digits.startsWith("0") ? digits : `0${digits}`;
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** "a@x.com, b@y.com\nc@z.com" → ["a@x.com", "b@y.com", "c@z.com"] (lower-cased, de-duplicated). */
export const splitEmails = (s: string) => [
  ...new Set(
    s
      .split(/[\s,;]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  ),
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
export function numField(fd: FormData, key: string, fallback = 0) {
  const raw = str(fd, key);
  const v = Number(raw);
  return raw !== "" && Number.isFinite(v) ? v : fallback;
}
export function optNum(fd: FormData, key: string): number | null {
  const raw = str(fd, key);
  const v = Number(raw);
  return raw !== "" && Number.isFinite(v) ? v : null;
}
export function boolField(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = c == null ? "" : String(c);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

/** Whole-taka display for summary tiles (statements keep paisa precision). */
export const takaR = (n: number | null | undefined) => taka(Math.round(Number(n ?? 0)));
