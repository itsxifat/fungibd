"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { saveProductAction, type ProductPayload } from "./actions";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string };

const Box = ({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) => (
  <section className="rounded-xl border border-stone-200 bg-white p-5">
    <h2 className="text-sm font-semibold">{title}</h2>
    {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);
const F = ({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) => (
  <label className={cn("block", className)}>
    <span className="label">{label}</span>
    {children}
    {hint && <span className="hint block">{hint}</span>}
  </label>
);

export function ProductForm({ initial, categories, packaging, stock }: { initial: ProductPayload; categories: Opt[]; packaging: Opt[]; stock?: { qty: number; booked: number } }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) => {
    setSaved(false);
    setP((s) => ({ ...s, [k]: v }));
  };
  const setV = (i: number, patch: Partial<ProductPayload["variants"][number]>) => set("variants", p.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)));
  const unit = p.stockUnit;

  const save = () => {
    setErr("");
    start(async () => {
      const r = await saveProductAction(p);
      if (!r.ok) return setErr(r.error);
      setSaved(true);
      if (!p.id) router.push(`/admin/products/${r.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Box title="Basic info">
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Name (English) *">
              <input className="input input-sm" value={p.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </F>
            <F label="নাম (বাংলা) *">
              <input className="input input-sm" value={p.nameBn} onChange={(e) => set("nameBn", e.target.value)} />
            </F>
            <F label="Short line (Bangla)" className="md:col-span-2">
              <input className="input input-sm" value={p.shortBn} onChange={(e) => set("shortBn", e.target.value)} />
            </F>
            <F label="Short line (English)" className="md:col-span-2">
              <input className="input input-sm" value={p.shortEn} onChange={(e) => set("shortEn", e.target.value)} />
            </F>
            <F label="Description (Bangla)">
              <textarea className="input input-sm min-h-28" value={p.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} />
            </F>
            <F label="Description (English)">
              <textarea className="input input-sm min-h-28" value={p.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
            </F>
            <F label="Key points (one per line)" className="md:col-span-2" hint="Shown as a checklist on the product page.">
              <textarea className="input input-sm min-h-20" value={p.highlights.join("\n")} onChange={(e) => set("highlights", e.target.value.split("\n"))} />
            </F>
            <F label="Cooking tips">
              <textarea className="input input-sm min-h-20" value={p.cookingTips} onChange={(e) => set("cookingTips", e.target.value)} />
            </F>
            <F label="Storage tips">
              <textarea className="input input-sm min-h-20" value={p.storageTips} onChange={(e) => set("storageTips", e.target.value)} />
            </F>
          </div>
        </Box>

        <Box title="Photos">
          <ImageUploader value={p.images} onChange={(v) => set("images", v)} />
        </Box>

        <Box title="Pack sizes & prices" hint={`“Amount” is how much stock one pack uses (in ${unit}). Packaging is deducted from supplies when an order is packed.`}>
          <div className="space-y-3">
            {p.variants.map((v, i) => (
              <div key={v.id ?? i} className="grid grid-cols-2 gap-2 rounded-lg border border-stone-200 p-3 md:grid-cols-[1fr_1fr_90px_90px_90px_1.3fr_70px_auto]">
                <input className="input input-sm" placeholder="250 g" value={v.labelEn} onChange={(e) => setV(i, { labelEn: e.target.value })} aria-label="Label English" />
                <input className="input input-sm" placeholder="২৫০ গ্রাম" value={v.labelBn} onChange={(e) => setV(i, { labelBn: e.target.value })} aria-label="Label Bangla" />
                <input className="input input-sm" type="number" step="0.001" placeholder={`Amount (${unit})`} value={v.unitAmount || ""} onChange={(e) => setV(i, { unitAmount: Number(e.target.value) })} aria-label={`Amount in ${unit}`} title={`Stock used per pack (${unit})`} />
                <input className="input input-sm" type="number" step="0.01" placeholder="Price ৳" value={v.price || ""} onChange={(e) => setV(i, { price: Number(e.target.value) })} aria-label="Price" />
                <input className="input input-sm" type="number" step="0.01" placeholder="Was ৳" value={v.comparePrice ?? ""} onChange={(e) => setV(i, { comparePrice: e.target.value ? Number(e.target.value) : null })} aria-label="Compare-at price" title="Optional old price (shown crossed out)" />
                <select className="input input-sm" value={v.packagingItemId} onChange={(e) => setV(i, { packagingItemId: e.target.value })} aria-label="Packaging">
                  <option value="">No packaging</option>
                  {packaging.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={v.isActive} onChange={(e) => setV(i, { isActive: e.target.checked })} /> On
                </label>
                <button type="button" onClick={() => set("variants", p.variants.filter((_, k) => k !== i))} className="justify-self-end rounded-lg p-2 text-stone-400 hover:text-red-600" aria-label="Remove pack size">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("variants", [...p.variants, { labelEn: "", labelBn: "", unitAmount: 0, price: 0, comparePrice: null, packagingItemId: "", packagingQty: 1, isActive: true }])} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand">
            <Plus className="h-4 w-4" /> Add pack size
          </button>
        </Box>
      </div>

      <div className="space-y-6">
        <div className="sticky top-4 z-10 space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Saved</p>}
          <button onClick={save} disabled={pending} className="btn btn-primary w-full rounded-lg">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {p.id ? "Save changes" : "Create product"}
          </button>
          <div className="flex justify-around text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={p.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Visible in shop
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={p.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured
            </label>
          </div>
        </div>

        <Box title="Pre-order" hint="Let customers book before the harvest.">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={p.preorderEnabled} onChange={(e) => set("preorderEnabled", e.target.checked)} /> Enable pre-order for this product
          </label>
          {p.preorderEnabled && (
            <div className="mt-4 space-y-4">
              <F label="When">
                <select className="input input-sm" value={p.preorderMode} onChange={(e) => set("preorderMode", e.target.value)}>
                  <option value="OUT_OF_STOCK">Only when today&apos;s stock runs out</option>
                  <option value="ALWAYS">Always — sell this product by pre-order only</option>
                </select>
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="Harvest / delivery date">
                  <input type="date" className="input input-sm" value={p.preorderDate} onChange={(e) => set("preorderDate", e.target.value)} />
                </F>
                <F label={`Max booking (${unit})`} hint="Empty = no limit">
                  <input type="number" step="0.1" className="input input-sm" value={p.preorderCap ?? ""} onChange={(e) => set("preorderCap", e.target.value === "" ? null : Number(e.target.value))} />
                </F>
              </div>
              <F label="Booking closes at" hint="Optional">
                <input type="datetime-local" className="input input-sm" value={p.preorderCutoff} onChange={(e) => set("preorderCutoff", e.target.value)} />
              </F>
              <F label="Note for customers">
                <input className="input input-sm" value={p.preorderNote} onChange={(e) => set("preorderNote", e.target.value)} />
              </F>
              {stock && <p className="text-xs text-stone-500">Currently booked: {stock.booked} {unit}</p>}
            </div>
          )}
        </Box>

        <Box title="Stock & cost">
          <div className="grid grid-cols-2 gap-3">
            <F label="Stock unit">
              <select className="input input-sm" value={p.stockUnit} onChange={(e) => set("stockUnit", e.target.value)}>
                <option value="kg">kg (fresh / dried)</option>
                <option value="pcs">pieces (jars, kits…)</option>
              </select>
            </F>
            <F label={`Low-stock alert (${unit})`}>
              <input type="number" step="0.1" className="input input-sm" value={p.lowStockAt} onChange={(e) => set("lowStockAt", Number(e.target.value))} />
            </F>
            <F label="Production cost" className="col-span-2">
              <select className="input input-sm" value={p.costMode} onChange={(e) => set("costMode", e.target.value)}>
                <option value="AUTO">Calculate from production batches</option>
                <option value="MANUAL">Enter manually</option>
              </select>
            </F>
            <F label={`Cost per ${unit} (৳)`} className="col-span-2" hint={p.costMode === "AUTO" ? "Updated automatically from batch costs ÷ kg harvested." : "Used to calculate profit on each order."}>
              <input type="number" step="0.01" className="input input-sm" value={p.costPerUnit} disabled={p.costMode === "AUTO"} onChange={(e) => set("costPerUnit", Number(e.target.value))} />
            </F>
          </div>
          {stock && (
            <p className="mt-3 text-xs text-stone-500">
              In stock: {stock.qty} {unit}. Change stock in Inventory or record harvests in Production.
            </p>
          )}
        </Box>

        <Box title="Organisation">
          <div className="space-y-3">
            <F label="Category">
              <select className="input input-sm" value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </F>
            <F label="Web address (slug)" hint={`fungibd.com/product/${p.slug || "…"}`}>
              <input className="input input-sm" value={p.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from English name" />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Badge" hint="Optional, e.g. New">
                <input className="input input-sm" value={p.badge} onChange={(e) => set("badge", e.target.value)} />
              </F>
              <F label="Sort order">
                <input type="number" className="input input-sm" value={p.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
              </F>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
}
