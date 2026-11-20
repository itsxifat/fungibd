"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart, useHydrated, cartTotals, type CartItem } from "./cart-store";
import { ProductImage } from "@/components/brand/ProductImage";
import { cn, taka } from "@/lib/utils";
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
        <ProductImage src={item.image} alt={item.nameEn} className={cn("rounded-2xl", compact ? "h-16 w-16" : "h-20 w-20")} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{item.nameBn}</p>
            <p className="truncate text-xs text-muted">
              {item.nameEn} · {item.labelBn}
            </p>
          </div>
          <button type="button" onClick={() => remove(item.variantId)} className="rounded-full p-1.5 text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.nameEn}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {item.preorder && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-tan/40 px-2 py-0.5 text-[11px] font-semibold text-tan-deep">
            <CalendarClock className="h-3 w-3" /> প্রি-অর্ডার · {item.preorderDate ? fmtDateBn(new Date(item.preorderDate), { day: "numeric", month: "short" }) : "পরের হারভেস্ট"}
          </p>
        )}
        {item.unavailable && <p className="mt-1 text-xs font-semibold text-red-600">এখন পাওয়া যাচ্ছে না — সরিয়ে দিন</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-full border border-line-strong bg-white">
            <button type="button" onClick={() => setQty(item.variantId, item.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-brand-tint" aria-label="Decrease">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
            <button
              type="button"
              onClick={() => setQty(item.variantId, item.qty + 1)}
              disabled={item.qty >= item.maxQty}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-brand-tint disabled:opacity-30"
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-semibold tabular-nums">{taka(item.price * item.qty)}</span>
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
      <div className={cn("absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn("absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ease-out", open ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-2xl">আপনার কার্ট</h2>
            <p className="text-xs text-muted">Your cart · {t.count} items</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost px-2" aria-label="Close cart">
            <X className="h-6 w-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-tint">
              <ShoppingBag className="h-9 w-9 text-brand" />
            </div>
            <p className="font-display text-xl">কার্ট খালি</p>
            <p className="text-sm text-muted">Your cart is empty — let&apos;s fix that.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-primary">
              মাশরুম দেখুন · Shop now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {notes.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  {notes.map((n) => (
                    <p key={n}>• {n}</p>
                  ))}
                </div>
              )}
              {t.hasRegular && freeDeliveryMin > 0 && (
                <div className="mb-5 rounded-2xl bg-brand-tint p-3.5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                    <Truck className="h-4 w-4" />
                    {left > 0 ? `আর ${taka(left)} কিনলে ফ্রি ডেলিভারি!` : "আপনি ফ্রি ডেলিভারি পাচ্ছেন 🎉"}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (t.regularSubtotal / freeDeliveryMin) * 100)}%` }} />
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
                <p className="mb-3 rounded-xl bg-tan/30 p-3 text-xs text-tan-deep">
                  প্রি-অর্ডারের পণ্য হারভেস্টের দিনে আলাদাভাবে ডেলিভারি হবে ({t.deliveries}টি ডেলিভারি)। Pre-order items arrive separately on harvest day.
                </p>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">সাবটোটাল · Subtotal</span>
                <span className="font-display text-2xl font-semibold">{taka(t.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">ডেলিভারি চার্জ চেকআউটে এলাকা অনুযায়ী · Delivery calculated at checkout</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className={cn("btn btn-primary btn-lg mt-4 w-full", !t.count && "pointer-events-none opacity-50")}>
                চেকআউট করুন · Checkout
              </Link>
              <p className="mt-2 text-center text-xs text-muted">💵 ক্যাশ অন ডেলিভারি · Pay when you receive</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
