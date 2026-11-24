"use client";
import { useState } from "react";
import { CalendarClock, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-store";
import type { ProductDTO } from "@/lib/store-data";
import { bnDigits, cn, taka } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import { SOLD_OUT_TEXT } from "@/lib/catalog";

const bnTaka = (n: number) => bnDigits(taka(n));

/** The harvest date line — the one detail used the same way on the hero, cards and emails. */
export function HarvestDate({ date, className }: { date: string | null; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 font-bangla text-sm text-ink-soft", className)}>
      <CalendarClock className="size-4 shrink-0 text-muted" aria-hidden />
      {date ? `হারভেস্ট · ${fmtDateBn(new Date(date), { weekday: "short", day: "numeric", month: "long" })}` : "পরের হারভেস্টে ডেলিভারি"}
    </p>
  );
}

export function AddToCart({ product, size = "card", dark = false }: { product: ProductDTO; size?: "card" | "full"; dark?: boolean }) {
  const add = useCart((s) => s.add);
  const firstBuyable = product.variants.find((v) => v.mode !== "SOLD_OUT") ?? product.variants[0];
  const [vid, setVid] = useState(firstBuyable?.id);
  const [qty, setQty] = useState(1);
  const v = product.variants.find((x) => x.id === vid) ?? firstBuyable;
  if (!v) return null;
  const pre = v.mode === "PREORDER";
  const out = v.mode === "SOLD_OUT";
  const full = size === "full";

  const onAdd = () => {
    if (out) return;
    add(
      {
        variantId: v.id,
        productId: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameBn: product.nameBn,
        labelEn: v.labelEn,
        labelBn: v.labelBn,
        price: v.price,
        unitAmount: v.unitAmount,
        image: product.image,
        preorder: pre,
        preorderDate: v.preorderDate,
        maxQty: pre && product.preorder.cap != null ? Math.max(1, Math.floor((product.preorder.cap - product.preorder.booked) / v.unitAmount)) : !pre ? Math.max(1, Math.floor(product.stockQty / v.unitAmount + 1e-9)) : 20,
      },
      full ? qty : 1,
    );
  };

  return (
    <div className={cn("flex flex-col", full ? "gap-5" : "gap-3")}>
      {product.variants.length > 1 && (
        <div role="radiogroup" aria-label="Pack size" className="flex flex-wrap gap-1.5">
          {product.variants.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={x.id === v.id}
              onClick={() => setVid(x.id)}
              className={cn(
                "rounded-lg border px-3 font-bangla font-medium transition-colors duration-150",
                full ? "py-2 text-sm" : "py-1 text-xs",
                dark
                  ? x.id === v.id
                    ? "border-cream bg-cream text-brand-night"
                    : "border-cream/25 text-cream/80 hover:border-cream"
                  : x.id === v.id
                    ? "border-ink bg-ink text-white"
                    : "border-line-strong bg-white text-ink-soft hover:border-ink",
                x.mode === "SOLD_OUT" && "opacity-40 line-through",
              )}
            >
              {x.labelBn}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-display font-semibold tabular-nums", dark ? "text-cream" : "text-ink", full ? "text-4xl" : "text-2xl")}>{bnTaka(v.price)}</span>
            {v.comparePrice && v.comparePrice > v.price && <span className={cn("text-sm tabular-nums line-through", dark ? "text-cream/50" : "text-muted")}>{bnTaka(v.comparePrice)}</span>}
          </div>
          <div className={cn("font-bangla text-xs", dark ? "text-cream/60" : "text-muted")}>{v.labelBn}</div>
        </div>
        {!full && (
          <button type="button" onClick={onAdd} disabled={out} className={cn("btn btn-sm", dark ? "btn-cream" : "btn-outline bg-white")} aria-label={`Add ${product.nameEn} ${v.labelEn} to cart`}>
            {out ? (
              "স্টক শেষ"
            ) : pre ? (
              "বুক করুন"
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden /> যোগ করুন
              </>
            )}
          </button>
        )}
      </div>

      {pre && !dark && (full ? (
        <div className="rounded-xl border border-line bg-cream/40 p-4">
          <HarvestDate date={v.preorderDate} className="text-[15px] text-ink" />
          <p className="mt-1 pl-6 font-bangla text-sm text-ink-soft">এখন বুক করুন, হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি। অগ্রিম টাকা লাগে না।</p>
        </div>
      ) : (
        <HarvestDate date={v.preorderDate} className="text-xs" />
      ))}
      {out && v.reason && (
        <p className={cn("rounded-lg bg-line/60 font-bangla text-ink-soft", full ? "p-4 text-sm" : "px-3 py-2 text-xs")}>
          {SOLD_OUT_TEXT[v.reason]?.bn} · {SOLD_OUT_TEXT[v.reason]?.en}
        </p>
      )}

      {full && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-[10px] border border-line-strong bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center rounded-l-[10px] transition-colors duration-150 hover:bg-brand-tint" aria-label="Decrease quantity">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {bnDigits(qty)}
            </span>
            <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid size-12 place-items-center rounded-r-[10px] transition-colors duration-150 hover:bg-brand-tint" aria-label="Increase quantity">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          <button type="button" onClick={onAdd} disabled={out} className="btn btn-primary btn-lg flex-1">
            <ShoppingBag className="size-5" aria-hidden />
            {out ? "স্টক শেষ" : pre ? "প্রি-অর্ডার করুন" : "কার্টে যোগ করুন"}
          </button>
        </div>
      )}
    </div>
  );
}
