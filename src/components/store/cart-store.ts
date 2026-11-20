"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  labelEn: string;
  labelBn: string;
  price: number;
  unitAmount: number;
  image: string;
  qty: number;
  preorder: boolean;
  preorderDate: string | null;
  maxQty: number;
  unavailable?: boolean;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  sync: (fresh: { variantId: string; price: number; mode: string; preorderDate: string | null; maxQty: number }[]) => string[];
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          if (existing)
            return { items: s.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, qty: Math.min(i.qty + qty, item.maxQty || 50) } : i)), open: true };
          return { items: [...s.items, { ...item, qty: Math.min(qty, item.maxQty || 50) }], open: true };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.variantId === variantId ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty || 50)) } : i)) })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [] }),
      /** Apply fresh server data; returns human messages about anything that changed. */
      sync: (fresh) => {
        const notes: string[] = [];
        const items = get().items.map((i) => {
          const f = fresh.find((x) => x.variantId === i.variantId);
          if (!f || f.mode === "SOLD_OUT") {
            if (!i.unavailable) notes.push(`${i.nameBn} (${i.labelBn}) এখন পাওয়া যাচ্ছে না`);
            return { ...i, unavailable: true };
          }
          const preorder = f.mode === "PREORDER";
          if (preorder !== i.preorder) notes.push(preorder ? `${i.nameBn}: আজকের স্টক শেষ — এখন প্রি-অর্ডার হিসেবে যাবে` : `${i.nameBn} এখন স্টকে আছে`);
          if (f.price !== i.price) notes.push(`${i.nameBn}: দাম আপডেট হয়েছে ৳${i.price} → ৳${f.price}`);
          return { ...i, price: f.price, preorder, preorderDate: f.preorderDate, maxQty: f.maxQty, qty: Math.min(i.qty, f.maxQty), unavailable: false };
        });
        set({ items });
        return notes;
      },
    }),
    { name: "fungibd-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function cartTotals(items: CartItem[]) {
  const live = items.filter((i) => !i.unavailable);
  const regular = live.filter((i) => !i.preorder);
  const pre = live.filter((i) => i.preorder);
  const sum = (a: CartItem[]) => Math.round(a.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const preDates = [...new Set(pre.map((i) => (i.preorderDate ?? "tbd").slice(0, 10)))];
  return {
    count: live.reduce((s, i) => s + i.qty, 0),
    subtotal: sum(live),
    regularSubtotal: sum(regular),
    preSubtotal: sum(pre),
    hasRegular: regular.length > 0,
    hasPre: pre.length > 0,
    deliveries: (regular.length ? 1 : 0) + preDates.length,
    preDates,
  };
}
