"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, useHydrated, cartTotals } from "@/components/store/cart-store";
import { CartLine, refreshCart } from "@/components/store/CartDrawer";
import { taka } from "@/lib/utils";

export default function CartPage() {
  const hydrated = useHydrated();
  const { items, sync } = useCart();
  const [notes, setNotes] = useState<string[]>([]);
  const t = cartTotals(items);
  useEffect(() => {
    if (hydrated) refreshCart(useCart.getState().items, sync as never).then(setNotes);
  }, [hydrated, sync]);
  if (!hydrated) return <div className="h-96" />;
  return (
    <div className="container-x max-w-4xl py-14">
      <h1 className="font-display text-4xl">কার্ট</h1>
      <p className="mt-1 text-muted">Your cart · {t.count} items</p>
      {!items.length ? (
        <div className="mt-10 rounded-xl border border-line bg-white p-10 text-center">
          <p className="font-bangla text-lg">আপনার কার্ট খালি</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            শপে যান
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-line bg-white p-5">
            {notes.length > 0 && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                {notes.map((n) => (
                  <p key={n}>• {n}</p>
                ))}
              </div>
            )}
            <ul className="flex flex-col gap-5">
              {items.map((i) => (
                <CartLine key={i.variantId} item={i} />
              ))}
            </ul>
          </div>
          <div className="h-fit rounded-xl border border-line bg-white p-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">সাবটোটাল</span>
              <span className="text-lg font-semibold">{taka(t.subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">ডেলিভারি চার্জ চেকআউটে যোগ হবে</p>
            {t.deliveries > 1 && <p className="mt-3 rounded-xl bg-cream/70 p-3 text-xs text-ink-soft">প্রি-অর্ডারের পণ্য আলাদাভাবে হারভেস্টের দিনে ডেলিভারি হবে।</p>}
            <Link href="/checkout" className="btn btn-primary mt-5 w-full">
              চেকআউট
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
