"use client";
import { useState } from "react";
import { CalendarClock, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-store";
import type { ProductDTO } from "@/lib/store-data";
import { cn, taka } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import { SOLD_OUT_TEXT } from "@/lib/catalog";

export function AddToCart({ product, size = "card", dark = false, initialVariantId }: { product: ProductDTO; size?: "card" | "full"; dark?: boolean; initialVariantId?: string }) {
  const add = useCart((s) => s.add);
  const firstBuyable = product.variants.find((v) => v.mode !== "SOLD_OUT") ?? product.variants[0];
  const [vid, setVid] = useState(initialVariantId ?? firstBuyable?.id);
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
                "rounded-full border px-3 font-semibold transition",
                full ? "py-2 text-sm" : "py-1 text-xs",
                dark
                  ? x.id === v.id
                    ? "border-tan bg-tan text-brand-night"
                    : "border-cream/25 text-cream/80 hover:border-cream"
                  : x.id === v.id
                    ? "border-brand bg-brand text-cream"
                    : "border-line-strong bg-white text-ink-soft hover:border-brand hover:text-brand",
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
            <span className={cn("font-display font-semibold", dark ? "text-cream" : "text-brand-deep", full ? "text-4xl" : "text-2xl")}>{taka(v.price)}</span>
            {v.comparePrice && v.comparePrice > v.price && <span className={cn("text-sm line-through", dark ? "text-cream/50" : "text-muted")}>{taka(v.comparePrice)}</span>}
          </div>
          <div className={cn("text-xs", dark ? "text-cream/60" : "text-muted")}>
            {v.labelBn} · {v.labelEn}
          </div>
        </div>
        {!full && (
          <button type="button" onClick={onAdd} disabled={out} className={cn("btn btn-sm", dark ? "btn-cream" : pre ? "btn-tan" : "btn-primary")} aria-label={`Add ${product.nameEn} ${v.labelEn} to cart`}>
            {out ? "স্টক শেষ" : pre ? "প্রি-অর্ডার" : (
              <>
                <ShoppingBag className="h-4 w-4" /> যোগ করুন
              </>
            )}
          </button>
        )}
      </div>

      {pre && !dark && (
        <div className={cn("flex items-start gap-2 rounded-2xl bg-tan/35 text-tan-deep", full ? "p-4 text-sm" : "px-3 py-2 text-xs")}>
          <CalendarClock className={cn("mt-0.5 shrink-0", full ? "h-5 w-5" : "h-4 w-4")} />
          <div>
            <b>প্রি-অর্ডার</b> — ডেলিভারি {v.preorderDate ? fmtDateBn(new Date(v.preorderDate), { day: "numeric", month: "long", weekday: "short" }) : "পরবর্তী হারভেস্টে"}
            {full && <div className="mt-0.5 opacity-80">Pre-order now, delivered fresh on harvest day. Pay on delivery.</div>}
          </div>
        </div>
      )}
      {out && v.reason && (
        <div className={cn("rounded-2xl bg-line/60 text-ink-soft", full ? "p-4 text-sm" : "px-3 py-2 text-xs")}>
          {SOLD_OUT_TEXT[v.reason]?.bn} · {SOLD_OUT_TEXT[v.reason]?.en}
        </div>
      )}

      {full && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-line-strong bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center rounded-full hover:bg-brand-tint" aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-12 w-12 place-items-center rounded-full hover:bg-brand-tint" aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={onAdd} disabled={out} className={cn("btn btn-lg flex-1", pre ? "btn-tan" : "btn-primary")}>
            <ShoppingBag className="h-5 w-5" />
            {out ? "স্টক শেষ · Sold out" : pre ? "প্রি-অর্ডার করুন · Pre-order" : "কার্টে যোগ করুন · Add to cart"}
          </button>
        </div>
      )}
    </div>
  );
}
