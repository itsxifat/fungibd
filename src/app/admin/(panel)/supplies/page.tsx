import { AlertTriangle, Boxes, ShoppingCart, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SUPPLY_CATEGORIES } from "@/lib/constants";
import { dateKey, fmtDate } from "@/lib/dates";
import { num, round2, taka, takaR } from "@/lib/utils";
import { Badge, Card, Empty, PageHeader, Stat, TableWrap } from "@/components/admin/ui";
import { ActionForm, Drawer, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { purchaseAction, supplierAction, supplyItemAction, supplyUseAction } from "../production/actions";

export const metadata = { title: "Supplies & packaging" };

export default async function SuppliesPage() {
  const admin = await requireAdmin();
  const showMoney = admin.role !== "STAFF";
  const [items, suppliers, purchases, usages, batches] = await Promise.all([
    db.supplyItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    db.supplier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { purchases: true } } } }),
    db.supplyPurchase.findMany({ orderBy: { date: "desc" }, take: 20, include: { supplyItem: true, supplier: true } }),
    db.supplyUsage.findMany({ where: { reason: { not: "PACKAGING" } }, orderBy: { date: "desc" }, take: 20, include: { supplyItem: true, batch: true } }),
    db.productionBatch.findMany({ where: { status: { in: ["GROWING", "HARVESTING"] } }, include: { product: true }, orderBy: { startDate: "desc" } }),
  ]);
  const value = round2(items.reduce((a, i) => a + Math.max(0, i.stockQty) * i.avgCost, 0));
  const reorder = items.filter((i) => i.isActive && i.stockQty <= i.reorderLevel);
  const today = dateKey(new Date());
  const itemOptions = items.map((i) => (
    <option key={i.id} value={i.id}>
      {i.name} ({num(i.stockQty)} {i.unit})
    </option>
  ));

  return (
    <>
      <PageHeader
        title="Supplies & packaging"
        description="Spawn, substrate, bags and packaging. Purchases raise stock and average cost; batches and packed orders use them up automatically."
        actions={
          <>
            <Drawer label="Record usage / waste" variant="outline" title="Record supply usage or waste">
              <ActionForm action={supplyUseAction} resetOnSuccess className="grid grid-cols-2 gap-4">
                <label className="col-span-2 block">
                  <span className="label">Item</span>
                  <select name="supplyItemId" className="input" required>
                    <option value="">Choose…</option>
                    {itemOptions}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Quantity</span>
                  <input name="qty" type="number" step="0.001" className="input" required />
                </label>
                <label className="block">
                  <span className="label">Reason</span>
                  <select name="reason" className="input">
                    <option value="PRODUCTION">Used in production</option>
                    <option value="WASTE">Wasted / damaged (loss)</option>
                    <option value="ADJUST">Count correction</option>
                  </select>
                </label>
                <label className="block">
                  <span className="label">For batch (optional)</span>
                  <select name="batchId" className="input">
                    <option value="">—</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} · {b.product.nameEn}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Date</span>
                  <input name="date" type="date" defaultValue={today} className="input" />
                </label>
                <label className="col-span-2 block">
                  <span className="label">Note</span>
                  <input name="note" className="input" />
                </label>
                <div className="col-span-2">
                  <Submit>Save</Submit>
                </div>
              </ActionForm>
            </Drawer>
            <Drawer label="Record purchase" title="Record a supply purchase" description="Stock goes up and the average cost is recalculated.">
              <ActionForm action={purchaseAction} resetOnSuccess className="grid grid-cols-2 gap-4">
                <label className="col-span-2 block">
                  <span className="label">Item</span>
                  <select name="supplyItemId" className="input" required>
                    <option value="">Choose…</option>
                    {itemOptions}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Quantity</span>
                  <input name="qty" type="number" step="0.001" className="input" required />
                </label>
                <label className="block">
                  <span className="label">Total paid (৳)</span>
                  <input name="totalCost" type="number" step="0.01" className="input" required />
                </label>
                <label className="block">
                  <span className="label">Supplier</span>
                  <select name="supplierId" className="input">
                    <option value="">—</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Date</span>
                  <input name="date" type="date" defaultValue={today} className="input" />
                </label>
                <label className="col-span-2 block">
                  <span className="label">Note</span>
                  <input name="note" className="input" />
                </label>
                <div className="col-span-2">
                  <Submit>Add purchase</Submit>
                </div>
              </ActionForm>
            </Drawer>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Items tracked" value={items.length} icon={Boxes} />
        <Stat label="Need reordering" value={reorder.length} tone={reorder.length ? "warn" : undefined} hint={reorder.slice(0, 2).map((r) => r.name).join(", ")} icon={AlertTriangle} color="amber" />
        {showMoney && <Stat label="Supplies value" value={takaR(value)} icon={Wallet} color="green" />}
        {showMoney && <Stat label="Recent purchases" value={takaR(purchases.reduce((a, p) => a + p.totalCost, 0))} hint="last 20 entries" icon={ShoppingCart} color="sky" />}
      </div>

      <Card
        title="Items"
        description="Set the reorder level to get a warning when stock runs low."
        pad={false}
        actions={
          <Drawer label="Add item" variant="outline" title="Add a supply item">
            <ActionForm action={supplyItemAction} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Name</span>
                <input name="name" placeholder="e.g. Kraft box 1 kg" className="input" required />
              </label>
              <label className="block">
                <span className="label">বাংলা নাম</span>
                <input name="nameBn" className="input" />
              </label>
              <label className="block">
                <span className="label">Type</span>
                <select name="category" className="input">
                  {Object.entries(SUPPLY_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Unit</span>
                <input name="unit" placeholder="pcs, kg…" className="input" />
              </label>
              <label className="block">
                <span className="label">Reorder when below</span>
                <input name="reorderLevel" type="number" step="0.01" className="input" />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Unit cost ৳ (if you have no purchase yet)</span>
                <input name="unitCost" type="number" step="0.01" className="input" />
              </label>
              <div className="sm:col-span-2">
                <Submit>Create item</Submit>
              </div>
            </ActionForm>
          </Drawer>
        }
      >
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th className="num">In stock</th>
                {showMoney && <th className="num">Avg. cost</th>}
                {showMoney && <th className="num">Value</th>}
                <th>Reorder level</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <span className="font-medium">{i.name}</span>
                    {i.nameBn && <span className="block text-xs text-stone-500">{i.nameBn}</span>}
                  </td>
                  <td>
                    <Badge tone={i.category === "PACKAGING" ? "violet" : i.category === "PRODUCTION" ? "green" : "gray"}>{i.category.toLowerCase()}</Badge>
                  </td>
                  <td className="num">
                    <span className={i.stockQty <= i.reorderLevel ? "font-semibold text-amber-700" : ""}>
                      {num(i.stockQty)} {i.unit}
                    </span>
                  </td>
                  {showMoney && <td className="num">৳{num(i.avgCost)}</td>}
                  {showMoney && <td className="num">{taka(Math.max(0, i.stockQty) * i.avgCost)}</td>}
                  <td>
                    <ActionForm action={supplyItemAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="name" value={i.name} />
                      <input type="hidden" name="nameBn" value={i.nameBn} />
                      <input type="hidden" name="category" value={i.category} />
                      <input type="hidden" name="unit" value={i.unit} />
                      <input name="reorderLevel" type="number" step="0.01" defaultValue={i.reorderLevel} className="input input-sm w-24 rounded-lg py-1" aria-label="Reorder level" />
                      <Submit variant="outline">Set</Submit>
                    </ActionForm>
                  </td>
                  <td className="text-right">
                    {showMoney && (
                      <DeleteButton
                        type="supplyItem"
                        id={i.id}
                        title={`Delete ${i.name}?`}
                        description="Its purchase and usage history is removed too, and any pack size using it as packaging is cleared."
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Recent purchases" pad={false}>
          {purchases.length ? (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Supplier</th>
                    <th className="num">Qty</th>
                    <th className="num">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDate(p.date)}</td>
                      <td>{p.supplyItem.name}</td>
                      <td className="text-stone-500">{p.supplier?.name ?? "—"}</td>
                      <td className="num">{num(p.qty)}</td>
                      <td className="num">{taka(p.totalCost)}</td>
                      <td className="text-right">
                        {showMoney && <DeleteButton type="purchase" id={p.id} title="Delete this purchase?" description={`${num(p.qty)} ${p.supplyItem.unit} will be removed from stock and the average cost recalculated.`} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <Empty title="No purchases yet" />
          )}
        </Card>
        <Card title="Recent usage (production & waste)" pad={false}>
          {usages.length ? (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Use</th>
                    <th className="num">Qty</th>
                    <th className="num">Cost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usages.map((u) => (
                    <tr key={u.id}>
                      <td>{fmtDate(u.date)}</td>
                      <td>{u.supplyItem.name}</td>
                      <td>
                        <Badge tone={u.reason === "WASTE" ? "red" : "gray"}>{u.batch?.code ?? u.reason.toLowerCase()}</Badge>
                      </td>
                      <td className="num">{num(u.qty)}</td>
                      <td className="num">{taka(u.totalCost)}</td>
                      <td className="text-right">
                        {showMoney && <DeleteButton type="usage" id={u.id} title="Delete this usage entry?" description={`${num(u.qty)} ${u.supplyItem.unit} will be put back into stock.`} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <Empty title="No usage recorded" />
          )}
        </Card>
      </div>

      <Card title="Suppliers" className="mt-6">
        <div className="space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <ActionForm action={supplierAction} className="grid flex-1 items-end gap-2 md:grid-cols-[1.2fr_1fr_1.4fr_1.4fr_auto]">
                <input type="hidden" name="id" value={s.id} />
                <input name="name" defaultValue={s.name} className="input input-sm" aria-label="Name" />
                <input name="phone" defaultValue={s.phone} className="input input-sm" aria-label="Phone" />
                <input name="address" defaultValue={s.address} className="input input-sm" aria-label="Address" />
                <input name="note" defaultValue={s.note} className="input input-sm" aria-label="Note" />
                <Submit variant="outline">Save</Submit>
              </ActionForm>
              {showMoney && <DeleteButton type="supplier" id={s.id} title={`Delete ${s.name}?`} description="Past purchases stay, without the supplier name." />}
            </div>
          ))}
          <ActionForm action={supplierAction} resetOnSuccess className="grid items-end gap-2 border-t border-stone-100 pt-3 md:grid-cols-[1.2fr_1fr_1.4fr_1.4fr_auto]">
            <input name="name" placeholder="New supplier name" className="input input-sm" />
            <input name="phone" placeholder="Phone" className="input input-sm" />
            <input name="address" placeholder="Address" className="input input-sm" />
            <input name="note" placeholder="What they supply" className="input input-sm" />
            <Submit>Add</Submit>
          </ActionForm>
        </div>
      </Card>
    </>
  );
}
