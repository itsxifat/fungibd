"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { taka } from "@/lib/utils";
import { createManualOrderAction } from "../actions";
import { ORDER_SOURCES } from "@/lib/constants";

type P = { id: string; name: string; variants: { id: string; label: string; price: number; mode: string }[] };

export function ManualOrderForm({ products, zones, slots, defaultDate, customer }: { products: P[]; zones: { id: string; name: string }[]; slots: string[]; defaultDate: string; customer: { name: string; phone: string; email: string; addressLine: string; landmark: string; zoneId: string } | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    zoneId: customer?.zoneId ?? "",
    addressLine: customer?.addressLine ?? "",
    landmark: customer?.landmark ?? "",
    deliveryDate: defaultDate,
    deliverySlot: slots[0] ?? "",
    note: "",
    internalNote: "",
    couponCode: "",
    source: "PHONE",
    confirm: true,
  });
  const [lines, setLines] = useState<{ variantId: string; qty: number }[]>([{ variantId: "", qty: 1 }]);
  const all = products.flatMap((p) => p.variants.map((v) => ({ ...v, product: p.name })));
  const subtotal = lines.reduce((a, l) => a + (all.find((v) => v.id === l.variantId)?.price ?? 0) * l.qty, 0);
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const r = await createManualOrderAction({ ...f, lines: lines.filter((l) => l.variantId) });
      if (r.ok) router.push(`/admin/orders/${r.id}`);
      else setError(r.error);
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold">Items</h2>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <select
                  className="input input-sm flex-1"
                  value={l.variantId}
                  onChange={(e) => setLines((ls) => ls.map((x, k) => (k === i ? { ...x, variantId: e.target.value } : x)))}
                  aria-label="Product"
                >
                  <option value="">Choose product…</option>
                  {products.map((p) => (
                    <optgroup key={p.id} label={p.name}>
                      {p.variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.mode === "SOLD_OUT"}>
                          {v.label} — {taka(v.price)} {v.mode === "PREORDER" ? "(pre-order)" : v.mode === "SOLD_OUT" ? "(unavailable)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input type="number" min={1} max={50} value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, k) => (k === i ? { ...x, qty: Number(e.target.value) } : x)))} className="input input-sm w-20" aria-label="Quantity" />
                <button type="button" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-red-600" aria-label="Remove line">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((ls) => [...ls, { variantId: "", qty: 1 }])} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand">
            <Plus className="h-4 w-4" /> Add item
          </button>
        </section>

        <section className="grid gap-4 rounded-xl border border-stone-200 bg-white p-5 md:grid-cols-2">
          <h2 className="text-sm font-semibold md:col-span-2">Customer & delivery</h2>
          <label className="block">
            <span className="label">Name *</span>
            <input className="input input-sm" value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Mobile *</span>
            <input className="input input-sm" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" required />
          </label>
          <label className="block">
            <span className="label">Email (for order emails)</span>
            <input type="email" className="input input-sm" value={f.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Area *</span>
            <select className="input input-sm" value={f.zoneId} onChange={(e) => set("zoneId", e.target.value)} required>
              <option value="">Choose…</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="label">Full address *</span>
            <textarea className="input input-sm min-h-16" value={f.addressLine} onChange={(e) => set("addressLine", e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Landmark</span>
            <input className="input input-sm" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Delivery date</span>
            <input type="date" className="input input-sm" value={f.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Time slot</span>
            <select className="input input-sm" value={f.deliverySlot} onChange={(e) => set("deliverySlot", e.target.value)}>
              {slots.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Order came from</span>
            <select className="input input-sm" value={f.source} onChange={(e) => set("source", e.target.value)}>
              {Object.entries(ORDER_SOURCES)
                .filter(([k]) => k !== "WEB")
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="label">Customer note</span>
            <input className="input input-sm" value={f.note} onChange={(e) => set("note", e.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="label">Internal note</span>
            <input className="input input-sm" value={f.internalNote} onChange={(e) => set("internalNote", e.target.value)} />
          </label>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-stone-200 bg-white p-5 xl:sticky xl:top-6">
        <label className="block">
          <span className="label">Coupon</span>
          <input className="input input-sm uppercase" value={f.couponCode} onChange={(e) => set("couponCode", e.target.value.toUpperCase())} />
        </label>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Items subtotal</span>
          <span className="font-semibold">{taka(subtotal)}</span>
        </div>
        <p className="text-xs text-stone-500">Delivery charge is added from the area. Pre-order items become a separate delivery automatically.</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.confirm} onChange={(e) => set("confirm", e.target.checked)} /> Mark as confirmed now
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="btn btn-primary w-full rounded-lg">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create order
        </button>
      </aside>
    </form>
  );
}
