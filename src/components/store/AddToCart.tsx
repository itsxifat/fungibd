"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-store";
import type { ProductDTO } from "@/lib/store-data";
import { bnDigits, cn, takaBn } from "@/lib/utils";
import { fmtDateBn } from "@/lib/dates";
import { SOLD_OUT_TEXT } from "@/lib/catalog";

/** The harvest date line — the one detail used the same way on the hero, cards, cart and emails. */
export function HarvestDate({ date, className }: { date: string | null; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 font-bangla text-sm text-ink-soft", className)}>
      <CalendarClock className="size-4 shrink-0 text-muted" aria-hidden />
      {date ? `হারভেস্ট · ${fmtDateBn(new Date(date), { weekday: "short", day: "numeric", month: "long" })}` : "পরের হারভেস্টে ডেলিভারি"}
    </p>
  );
}

/**
 * Pack picker + price + actions.
 * size "card": compact; buyNow adds a second, turmeric "buy now" button that goes straight to checkout.
 * size "full": product page, with quantity.
 */
export function AddToCart({ product, size = "card", buyNow = false, harvestLine = true, initialVariantId }: { product: ProductDTO; size?: "card" | "full"; buyNow?: boolean; harvestLine?: boolean; initialVariantId?: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const firstBuyable = product.variants.find((v) => v.mode !== "SOLD_OUT") ?? product.variants[0];
  const [vid, setVid] = useState(initialVariantId ?? firstBuyable?.id);
  const [qty, setQty] = useState(1);
  const v = product.variants.find((x) => x.id === vid) ?? firstBuyable;
  if (!v) return null;
  const pre = v.mode === "PREORDER";
  const out = v.mode === "SOLD_OUT";
  const full = size === "full";
  const save = v.comparePrice && v.comparePrice > v.price ? v.comparePrice - v.price : 0;
  const showBuyNow = full || buyNow;

  const put = () => {
    if (out) return false;
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
    return true;
  };
  const buy = () => {
    if (!put()) return;
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <div className={cn("flex flex-col", full ? "gap-5" : "@container gap-3")}>
      {product.variants.length > 1 && (
        <div role="radiogroup" aria-label="প্যাকের সাইজ" className="flex flex-wrap gap-1.5">
          {product.variants.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={x.id === v.id}
              onClick={() => setVid(x.id)}
              className={cn(
                "rounded-lg border px-3 font-bangla font-medium transition-colors duration-150",
                full ? "min-h-10 text-sm" : "min-h-8 text-[13px]",
                x.id === v.id ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink",
                x.mode === "SOLD_OUT" && (x.id === v.id ? "line-through" : "border-dashed text-muted line-through"),
              )}
            >
              {x.labelBn}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cn("font-display font-semibold tabular-nums text-ink", full ? "text-4xl" : "text-2xl")}>{takaBn(v.price)}</span>
          {save > 0 && <span className="text-sm tabular-nums text-muted line-through">{takaBn(v.comparePrice)}</span>}
          {save > 0 && <span className="rounded-md bg-cta/10 px-1.5 py-0.5 font-bangla text-xs font-semibold text-cta-deep">{takaBn(save)} সাশ্রয়</span>}
        </div>
        {product.variants.length === 1 && <p className="mt-0.5 font-bangla text-xs text-muted">{v.labelBn}</p>}
      </div>

      {pre && (full ? (
        <div>
          <HarvestDate date={v.preorderDate} className="text-[15px] text-ink" />
          <p className="mt-1 pl-[22px] font-bangla text-sm text-ink-soft">এখন বুক করুন, হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি। অগ্রিম টাকা লাগে না।</p>
        </div>
      ) : harvestLine ? (
        <HarvestDate date={v.preorderDate} className="text-[13px]" />
      ) : null)}
      {out && v.reason && (
        <p className={cn("rounded-lg bg-paper font-bangla text-ink-soft", full ? "p-4 text-sm" : "px-3 py-2 text-xs")}>{SOLD_OUT_TEXT[v.reason]?.bn}</p>
      )}

      {/* Card buttons stack when the card is too narrow to hold both side by side (2-up phone grid) */}
      <div className={cn("flex gap-2", full ? "flex-wrap gap-3" : showBuyNow && "flex-col @[15rem]:flex-row")}>
        {full && (
          <div className="flex items-center rounded-[10px] border border-line-strong bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center rounded-l-[10px] transition-colors duration-150 hover:bg-paper" aria-label="পরিমাণ কমান">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {bnDigits(qty)}
            </span>
            <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid size-12 place-items-center rounded-r-[10px] transition-colors duration-150 hover:bg-paper" aria-label="পরিমাণ বাড়ান">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={put}
          disabled={out}
          className={cn("btn flex-1 border border-brand bg-white text-brand hover:bg-brand-tint disabled:border-line-strong disabled:text-muted", full ? "btn-lg" : "btn-sm min-h-10")}
          aria-label={`${product.nameEn} ${v.labelEn} কার্টে রাখুন`}
        >
          <ShoppingBag className="size-4" aria-hidden />
          {out ? "শেষ হয়ে গেছে" : "কার্টে রাখুন"}
        </button>
        {showBuyNow && !out && (
          <button type="button" onClick={buy} className={cn("btn btn-cta flex-1", full ? "btn-lg" : "btn-sm min-h-10")}>
            {pre ? "এখনই বুক করুন" : "এখনই কিনুন"}
          </button>
        )}
      </div>
    </div>
  );
}
