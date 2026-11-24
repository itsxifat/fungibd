"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleCheck, MapPin, MessageSquarePlus, Search, Truck } from "lucide-react";
import { bnDigits, cn, taka } from "@/lib/utils";

export type CoverageZone = { id: string; nameBn: string; nameEn: string; region: string; charge: number };

const SEARCH_FROM = 7; // show the search box once there are this many areas
const bnTaka = (n: number) => bnDigits(taka(n));

/**
 * "Where do we deliver?" — works the same for 1 area or hundreds across Bangladesh:
 * one area → a single highlighted card; a few → a clean list; many → search, region filter and a scrolling grouped list.
 */
export function DeliveryCoverage({ zones, freeDeliveryMin, note }: { zones: CoverageZone[]; freeDeliveryMin: number; note: string }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string | null>(null);

  const regions = useMemo(() => [...new Set(zones.map((z) => z.region.trim()).filter(Boolean))], [zones]);
  const charges = zones.map((z) => z.charge);
  const min = Math.min(...charges);
  const max = Math.max(...charges);
  const searchable = zones.length >= SEARCH_FROM;

  const query = q.trim().toLowerCase();
  const visible = zones.filter((z) => {
    if (region && z.region.trim() !== region) return false;
    if (!query) return true;
    return `${z.nameBn} ${z.nameEn} ${z.region}`.toLowerCase().includes(query);
  });
  const exact = query ? visible.find((z) => z.nameBn.toLowerCase() === query || z.nameEn.toLowerCase() === query) ?? (visible.length === 1 ? visible[0] : undefined) : undefined;

  const groups = regions.length > 1 ? regions.map((r) => ({ region: r, items: visible.filter((z) => z.region.trim() === r) })).concat([{ region: "", items: visible.filter((z) => !z.region.trim()) }]).filter((g) => g.items.length) : [{ region: "", items: visible }];

  const stats = [
    { value: `${bnDigits(zones.length)}টি এলাকা`, label: regions.length > 1 ? `${bnDigits(regions.length)}টি শহর/জেলায়` : "এখন ডেলিভারি চালু" },
    { value: min === max ? bnTaka(min) : `${bnTaka(min)}–${bnDigits(max)}`, label: "ডেলিভারি চার্জ" },
    ...(freeDeliveryMin > 0 ? [{ value: `${bnTaka(freeDeliveryMin)}+`, label: "অর্ডারে ডেলিভারি ফ্রি" }] : []),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <h2 className="font-display text-2xl leading-tight sm:text-[1.75rem]">{zones.length === 1 ? "এখন যেখানে ডেলিভারি দিই" : "আমরা কোথায় ডেলিভারি দিই"}</h2>
        <p className="mt-4 max-w-md font-bangla text-[16px] leading-relaxed text-ink-soft">
          {note ? `${note}। ` : ""}চেকআউটে এলাকা বাছলেই চার্জ দেখতে পাবেন, আর ম্যাপে বাসা পিন করে দিতে পারবেন।
        </p>
        <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-2xl leading-none text-ink tabular-nums">{s.value}</dd>
              <dd className="mt-1.5 font-bangla text-sm text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col items-start gap-3">
          <Link href="/delivery" className="font-bangla text-sm font-semibold text-brand hover:underline">
            সব এলাকা, চার্জ ও ডেলিভারির নিয়ম
          </Link>
          <Link href="/support" className="inline-flex items-center gap-2 font-bangla text-sm text-ink-soft hover:text-ink hover:underline">
            <MessageSquarePlus className="size-4 text-muted" aria-hidden /> আপনার এলাকা নেই? জানিয়ে রাখুন
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-2">
        {zones.length === 1 ? (
          <div className="flex items-center gap-3 p-4 sm:p-6">
            <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight">{zones[0].nameBn}</p>
              <p className="text-sm text-muted">{zones[0].nameEn}{zones[0].region ? ` · ${zones[0].region}` : ""}</p>
            </div>
            <p className="text-right">
              <span className="block font-display text-2xl">{bnTaka(zones[0].charge)}</span>
              <span className="font-bangla text-xs text-muted">ডেলিভারি চার্জ</span>
            </p>
          </div>
        ) : (
          <>
            {searchable && (
              <div className="p-3 pb-1">
                <label htmlFor="zone-search" className="sr-only">
                  আপনার এলাকা খুঁজুন · Find your area
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    id="zone-search"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="আপনার এলাকা খুঁজুন · যেমন: মিরপুর"
                    className="input h-12 pl-12 font-bangla"
                    autoComplete="off"
                  />
                </div>
                {regions.length > 1 && (
                  <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="শহর/জেলা">
                    {[null, ...regions].map((r) => (
                      <button
                        key={r ?? "all"}
                        type="button"
                        onClick={() => setRegion(r)}
                        aria-pressed={region === r}
                        className={cn("chip shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-colors duration-150", region === r ? "border-ink bg-ink text-white" : "border-line-strong text-ink-soft hover:border-ink")}
                      >
                        {r ?? "সব"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {exact && (
              <p role="status" className="mx-3 mt-2 flex items-start gap-2 rounded-lg bg-brand-tint px-4 py-3 font-bangla text-sm text-brand-deep">
                <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> হ্যাঁ, {exact.nameBn}-এ ডেলিভারি দিই — চার্জ {bnTaka(exact.charge)}।
              </p>
            )}

            <div className={cn("px-1", searchable && "max-h-[380px] overflow-y-auto overscroll-contain")} aria-live="polite">
              {visible.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-bangla font-semibold">“{q}” এখনো আমাদের তালিকায় নেই</p>
                  <p className="mt-1 font-bangla text-sm text-muted">আমরা নতুন এলাকায় যাওয়ার পরিকল্পনা করছি।</p>
                  <Link href="/support" className="btn btn-outline btn-sm mt-4">
                    জানিয়ে রাখুন
                  </Link>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.region || "_"}>
                    {groups.length > 1 && (
                      <p className="sticky top-0 z-[1] bg-white px-4 pb-1 pt-3 font-bangla text-xs font-medium text-muted">
                        {g.region || "অন্যান্য"} · {bnDigits(g.items.length)}
                      </p>
                    )}
                    <ul className="divide-y divide-line">
                      {g.items.map((z) => (
                        <li key={z.id} className="flex items-center gap-3 px-4 py-3">
                          <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bangla font-medium">{z.nameBn}</span>
                            {z.nameEn !== z.nameBn && <span className="block truncate text-xs text-muted">{z.nameEn}</span>}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-ink-soft">{bnTaka(z.charge)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        {freeDeliveryMin > 0 && (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-cream/60 px-5 py-3.5 font-bangla text-sm text-ink-soft">
            <Truck className="size-4 shrink-0 text-muted" aria-hidden /> {bnTaka(freeDeliveryMin)} বা তার বেশি অর্ডারে ডেলিভারি একদম ফ্রি।
          </p>
        )}
      </div>
    </div>
  );
}
