"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, CalendarClock, Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart, useHydrated, cartTotals, type CartItem } from "./cart-store";
import { ProductImage } from "@/components/brand/ProductImage";
import { bnDigits, cn, taka } from "@/lib/utils";

const bnTaka = (n: number) => bnDigits(taka(n));
import { fmtDateBn } from "@/lib/dates";

export async function refreshCart(items: CartItem[], sync: (f: never[]) => string[]) {
  if (!items.length) return [];
  try {
    const res = await fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: items.map((i) => i.variantId) }) });
    if (!res.ok) return [];
    const data = await res.json();
    return sync(data.items as never[]);
  } catch {
    return [];
  }
}

export function CartLine({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  return (
    <li className={cn("flex gap-3", item.unavailable && "opacity-50")}>
      <Link href={`/product/${item.slug}`} className="shrink-0">
        <ProductImage src={item.image} alt={item.nameEn} className={cn("rounded-xl", compact ? "h-16 w-16" : "h-20 w-20")} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{item.nameBn}</p>
            <p className="truncate text-xs text-muted">
              {item.nameEn} · {item.labelBn}
            </p>
          </div>
          <button type="button" onClick={() => remove(item.variantId)} className="rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.nameEn}`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
        {item.preorder && (
          <p className="mt-1 flex items-center gap-1.5 font-bangla text-xs text-ink-soft">
            <CalendarClock className="size-3.5 text-muted" aria-hidden /> হারভেস্ট · {item.preorderDate ? fmtDateBn(new Date(item.preorderDate), { weekday: "short", day: "numeric", month: "long" }) : "পরের হারভেস্টে"}
          </p>
        )}
        {item.unavailable && <p className="mt-1 text-xs font-semibold text-red-600">এখন পাওয়া যাচ্ছে না — সরিয়ে দিন</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-line-strong bg-white">
            <button type="button" onClick={() => setQty(item.variantId, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-l-lg transition-colors duration-150 hover:bg-brand-tint" aria-label="Decrease">
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">{bnDigits(item.qty)}</span>
            <button
              type="button"
              onClick={() => setQty(item.variantId, item.qty + 1)}
              disabled={item.qty >= item.maxQty}
              className="grid h-8 w-8 place-items-center rounded-r-lg transition-colors duration-150 hover:bg-brand-tint disabled:opacity-30"
              aria-label="Increase"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>
          <span className="font-semibold tabular-nums">{bnTaka(item.price * item.qty)}</span>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer({ freeDeliveryMin }: { freeDeliveryMin: number }) {
  const hydrated = useHydrated();
  const { items, open, setOpen, sync } = useCart();
  const [notes, setNotes] = useState<string[]>([]);
  const t = cartTotals(items);

  useEffect(() => {
    if (open) refreshCart(useCart.getState().items, sync as never).then(setNotes);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, sync]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!hydrated) return null;
  const left = Math.max(0, freeDeliveryMin - t.regularSubtotal);

  return (
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn("absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[var(--ease)]", open ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-2xl">আপনার কার্ট</h2>
            <p className="font-bangla text-xs text-muted">{bnDigits(t.count)}টি প্যাক</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost px-2" aria-label="Close cart">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="size-8 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="font-display text-xl">কার্ট খালি</p>
            <p className="font-bangla text-sm text-muted">পরের হারভেস্ট থেকে বুক করুন, অথবা শপ থেকে কিছু বেছে নিন।</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/preorder" onClick={() => setOpen(false)} className="btn btn-primary">
                প্রি-অর্ডার দেখুন
              </Link>
              <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-outline">
                শপ
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {notes.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {notes.map((n) => (
                    <p key={n}>• {n}</p>
                  ))}
                </div>
              )}
              {t.hasRegular && freeDeliveryMin > 0 && (
                <div className="mb-5 rounded-xl bg-brand-tint p-3.5">
                  <p className="flex items-center gap-2 font-bangla text-sm font-medium text-brand-deep">
                    <Truck className="size-4" aria-hidden />
                    {left > 0 ? `আর ${bnTaka(left)} হলে ডেলিভারি ফ্রি` : "এই অর্ডারে ডেলিভারি ফ্রি"}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full origin-left rounded-full bg-brand transition-transform duration-300 ease-[var(--ease)]" style={{ transform: `scaleX(${Math.min(1, t.regularSubtotal / freeDeliveryMin)})` }} />
                  </div>
                </div>
              )}
              <ul className="flex flex-col gap-5">
                {items.map((i) => (
                  <CartLine key={i.variantId} item={i} />
                ))}
              </ul>
            </div>
            <div className="border-t border-line bg-white px-6 py-5">
              {t.deliveries > 1 && (
                <p className="mb-3 flex gap-2 rounded-lg bg-cream/60 p-3 font-bangla text-xs text-ink-soft">
                  <CalendarClock className="size-4 shrink-0 text-muted" aria-hidden />
                  প্রি-অর্ডারের পণ্য হারভেস্টের পর আলাদাভাবে আসবে — মোট {bnDigits(t.deliveries)}টি ডেলিভারি।
                </p>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-bangla text-sm text-ink-soft">সাবটোটাল</span>
                <span className="font-display text-2xl font-semibold tabular-nums">{bnTaka(t.subtotal)}</span>
              </div>
              <p className="mt-1 font-bangla text-xs text-muted">ডেলিভারি চার্জ চেকআউটে এলাকা অনুযায়ী যোগ হবে</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className={cn("btn btn-primary btn-lg mt-4 w-full", !t.count && "pointer-events-none opacity-50")}>
                চেকআউট করুন
              </Link>
              <p className="mt-2 flex items-center justify-center gap-1.5 font-bangla text-xs text-muted">
                <Banknote className="size-3.5" aria-hidden /> ক্যাশ অন ডেলিভারি — হাতে পেয়ে টাকা দিন
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
