import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, Inbox, type LucideIcon } from "lucide-react";
import { cn, pct } from "@/lib/utils";
import { RANGE_LABELS, type RangeKey } from "@/lib/dates";
import type { Tone } from "@/lib/constants";

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] font-medium text-stone-500 hover:text-stone-900">
            <ChevronLeft className="h-4 w-4" /> {back.label}
          </Link>
        )}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-stone-900">{title}</h1>
        {description && <div className="mt-1.5 text-[14px] text-stone-500">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, pad = true }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-stone-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(pad && "p-5")}>{children}</div>
    </section>
  );
}

const ICON_TONE = {
  green: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
  stone: "bg-stone-100 text-stone-600",
  brand: "bg-brand-tint text-brand",
} as const;

export function Stat({
  label,
  value,
  hint,
  delta,
  href,
  tone,
  icon: Icon,
  color = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number | null;
  href?: string;
  tone?: "warn" | "good";
  icon?: LucideIcon;
  color?: keyof typeof ICON_TONE;
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition",
        href && "hover:-translate-y-0.5 hover:shadow-md",
        tone === "warn" ? "border-amber-300 ring-1 ring-amber-200" : "border-black/[0.06]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug text-stone-500">{label}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", ICON_TONE[color])}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[26px] font-semibold tracking-tight tabular-nums text-stone-900">{value}</p>
      {(delta != null || hint) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          {delta != null && (
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold", delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {pct(Math.abs(delta), 0)}
            </span>
          )}
          {hint}
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

const TONES: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-800",
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-stone-100 text-stone-600",
  brand: "bg-brand-tint text-brand",
  gold: "bg-amber-100/80 text-amber-900",
  rose: "bg-rose-50 text-rose-700",
};

export function Badge({ tone = "gray", children, className, dot = true }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge<T extends Record<string, { en: string; tone: Tone }>>({ map, value }: { map: T; value: string }) {
  const m = map[value as keyof T];
  return <Badge tone={m?.tone ?? "gray"}>{m?.en ?? value}</Badge>;
}

export function Empty({ title, children, icon: Icon = Inbox }: { title: string; children?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

/** Date range selector (links, keeps other query params). */
export function RangeTabs({ base, current, params = {}, keys = ["today", "7d", "30d", "month", "lastmonth", "90d", "year"], from, to }: { base: string; current: RangeKey; params?: Record<string, string | undefined>; keys?: Exclude<RangeKey, "custom">[]; from?: string; to?: string }) {
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...extra })) if (v) p.set(k, v);
    return `${base}?${p.toString()}`;
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap rounded-xl bg-stone-200/60 p-1">
        {keys.map((k) => (
          <Link key={k} href={q({ range: k })} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium transition", current === k ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900")}>
            {RANGE_LABELS[k]}
          </Link>
        ))}
      </div>
      <form action={base} className="flex items-center gap-1 text-xs">
        {Object.entries(params).map(([k, v]) => (v && k !== "range" && k !== "from" && k !== "to" ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <input type="date" name="from" defaultValue={from} className="input input-sm w-[8.5rem] rounded-xl py-1" aria-label="From date" />
        <span className="text-stone-400">–</span>
        <input type="date" name="to" defaultValue={to} className="input input-sm w-[8.5rem] rounded-xl py-1" aria-label="To date" />
        <button className="btn btn-outline btn-sm rounded-xl bg-white py-1">Go</button>
      </form>
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-3 text-sm">
      <span className="text-stone-500">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn btn-outline btn-sm rounded-xl">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="btn btn-outline btn-sm rounded-xl">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export function FilterTabs({ items, current }: { items: { label: string; href: string; key: string; count?: number }[]; current: string }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-black/[0.05] px-3 pt-2">
      {items.map((i) => {
        const active = current === i.key;
        return (
          <Link
            key={i.key}
            href={i.href}
            className={cn("-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] transition", active ? "border-brand font-semibold text-stone-900" : "border-transparent text-stone-500 hover:text-stone-900")}
          >
            {i.label}
            {i.count != null && <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", active ? "bg-brand-tint text-brand" : "bg-stone-100 text-stone-500")}>{i.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export const Field = ({ label, children, hint, className }: { label: string; children: ReactNode; hint?: ReactNode; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="label">{label}</span>
    {children}
    {hint && <span className="hint block">{hint}</span>}
  </label>
);
