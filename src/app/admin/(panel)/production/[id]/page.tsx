import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { batchSummary } from "@/lib/stock";
import { BATCH_STATUS } from "@/lib/constants";
import { dateKey, fmtDate } from "@/lib/dates";
import { num, taka } from "@/lib/utils";
import { Card, PageHeader, Stat, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { batchUsageAction, updateBatchAction } from "../actions";

export const metadata = { title: "Batch" };

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [b, supplies] = await Promise.all([
    db.productionBatch.findUnique({ where: { id }, include: { product: true, harvests: { orderBy: { date: "desc" } }, usages: { include: { supplyItem: true }, orderBy: { date: "asc" } } } }),
    db.supplyItem.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!b) notFound();
  const s = batchSummary(b);
  return (
    <>
      <PageHeader back={{ href: "/admin/production", label: "Production" }} title={`Batch ${b.code}`} description={<span className="flex items-center gap-2">{b.product.nameEn} · started {fmtDate(b.startDate)} <StatusBadge map={BATCH_STATUS} value={b.status} /></span>}
        actions={<DeleteButton type="batch" id={b.id} label="Delete batch" redirectTo="/admin/production" title={`Delete batch ${b.code}?`} description="Supplies used by this batch are returned to stock. Its harvests stay in stock but are no longer linked to a batch." />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total cost" value={taka(s.total)} hint={`supplies ${taka(s.supplies)} + direct ${taka(b.extraCost)}`} />
        <Stat label="Harvested" value={`${num(s.kg)} kg`} hint={`${b.harvests.length} pickings`} />
        <Stat label="Cost per kg" value={s.kg ? taka(s.costPerKg) : "—"} />
        <Stat label="Yield per bag" value={b.bagCount && s.kg ? `${num(s.kg / b.bagCount, 2)} kg` : "—"} hint={`${b.bagCount} bags`} />
        <Stat label="Waste" value={`${num(s.waste)} kg`} hint={s.kg + s.waste > 0 ? `${Math.round((s.waste / (s.kg + s.waste)) * 100)}% of picked` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Batch details">
          <ActionForm action={updateBatchAction} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="id" value={b.id} />
            <label className="block">
              <span className="label">Status</span>
              <select name="status" defaultValue={b.status} className="input input-sm">
                {Object.entries(BATCH_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Expected harvest</span>
              <input type="date" name="expectedHarvest" defaultValue={b.expectedHarvest ? dateKey(b.expectedHarvest) : ""} className="input input-sm" />
            </label>
            <label className="block">
              <span className="label">Bags</span>
              <input type="number" name="bagCount" defaultValue={b.bagCount} className="input input-sm" />
            </label>
            <label className="block">
              <span className="label">Other direct cost (৳)</span>
              <input type="number" step="0.01" name="extraCost" defaultValue={b.extraCost} className="input input-sm" />
            </label>
            <label className="col-span-2 block">
              <span className="label">Substrate</span>
              <input name="substrate" defaultValue={b.substrate} className="input input-sm" />
            </label>
            <label className="col-span-2 block">
              <span className="label">Notes</span>
              <textarea name="note" defaultValue={b.note} className="input input-sm min-h-16" />
            </label>
            <div className="col-span-2">
              <Submit>Save</Submit>
            </div>
          </ActionForm>
          <p className="mt-3 text-xs text-stone-500">Failed batches are excluded from the product&apos;s cost-per-kg; their cost stays in your supply usage.</p>
        </Card>

        <Card title="Supplies used" pad={false}>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th className="num">Qty</th>
                  <th className="num">Cost</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {b.usages.map((u) => (
                  <tr key={u.id}>
                    <td>{fmtDate(u.date)}</td>
                    <td>{u.supplyItem.name}</td>
                    <td className="num">
                      {num(u.qty)} {u.supplyItem.unit}
                    </td>
                    <td className="num">{taka(u.totalCost)}</td>
                    <td className="text-right">
                      <DeleteButton type="usage" id={u.id} title="Remove this supply from the batch?" description={`${num(u.qty)} ${u.supplyItem.unit} goes back into stock and the batch cost drops by ${taka(u.totalCost)}.`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <ActionForm action={batchUsageAction} resetOnSuccess className="grid grid-cols-[1fr_90px_auto] gap-2 border-t border-stone-200 p-4">
            <input type="hidden" name="batchId" value={b.id} />
            <select name="supplyItemId" className="input input-sm" aria-label="Supply item">
              <option value="">Add supply used…</option>
              {supplies.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} (৳{x.avgCost}/{x.unit})
                </option>
              ))}
            </select>
            <input name="qty" type="number" step="0.001" placeholder="qty" className="input input-sm" aria-label="Quantity" />
            <Submit variant="outline">Add</Submit>
          </ActionForm>
        </Card>
      </div>

      <Card title="Harvests from this batch" pad={false} className="mt-6">
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Sellable</th>
                <th className="num">Waste</th>
                <th>Grade</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {b.harvests.map((h) => (
                <tr key={h.id}>
                  <td>{fmtDate(h.date)}</td>
                  <td className="num">{num(h.qty)} kg</td>
                  <td className="num">{num(h.wasteQty)} kg</td>
                  <td>{h.grade}</td>
                  <td className="text-stone-500">{h.note}</td>
                  <td className="text-right">
                    <DeleteButton type="harvest" id={h.id} title="Delete this harvest?" description={`${num(h.qty)} kg will be removed from stock.`} />
                  </td>
                </tr>
              ))}
              {!b.harvests.length && (
                <tr>
                  <td colSpan={6} className="text-center text-stone-500">
                    No harvests recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
