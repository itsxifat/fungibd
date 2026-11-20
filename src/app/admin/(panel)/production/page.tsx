import Link from "next/link";
import { Leaf, Scale, Sprout, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { batchSummary } from "@/lib/stock";
import { BATCH_STATUS } from "@/lib/constants";
import { addDays, dateKey, fmtDate, startOfDay } from "@/lib/dates";
import { num, round3, taka } from "@/lib/utils";
import { Card, Empty, PageHeader, Stat, StatusBadge, TableWrap } from "@/components/admin/ui";
import { ActionForm, Drawer, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createBatchAction, harvestAction } from "./actions";

export const metadata = { title: "Production" };

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const showMoney = admin.role !== "STAFF";
  const since = addDays(startOfDay(), -29);
  const [products, batches, harvests, supplies, last30] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.productionBatch.findMany({
      where: sp.all ? {} : { status: { in: ["GROWING", "HARVESTING"] } },
      orderBy: { startDate: "desc" },
      take: sp.all ? 200 : 60,
      include: { product: true, harvests: true, usages: true },
    }),
    db.harvest.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 15, include: { product: true, batch: true } }),
    db.supplyItem.findMany({ where: { isActive: true, category: { in: ["PRODUCTION", "OTHER"] } }, orderBy: { name: "asc" } }),
    db.harvest.groupBy({ by: ["productId"], where: { date: { gte: since } }, _sum: { qty: true, wasteQty: true } }),
  ]);
  const activeBatches = batches.filter((b) => b.status === "GROWING" || b.status === "HARVESTING");
  const today = dateKey(new Date());
  const kg30 = last30.reduce((a, r) => a + (r._sum.qty ?? 0), 0);
  const waste30 = last30.reduce((a, r) => a + (r._sum.wasteQty ?? 0), 0);

  const harvestForm = (
    <ActionForm action={harvestAction} resetOnSuccess className="grid grid-cols-2 gap-4">
      <label className="col-span-2 block">
        <span className="label">Product</span>
        <select name="productId" className="input" required>
          <option value="">Choose…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameEn} ({p.stockUnit})
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 block">
        <span className="label">From batch (used for cost per kg)</span>
        <select name="batchId" className="input">
          <option value="">— none —</option>
          {activeBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} · {b.product.nameEn} · started {fmtDate(b.startDate, { day: "numeric", month: "short" })}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Sellable amount</span>
        <input name="qty" type="number" step="0.001" className="input" placeholder="kg" required />
      </label>
      <label className="block">
        <span className="label">Waste / rejected</span>
        <input name="wasteQty" type="number" step="0.001" className="input" placeholder="kg" />
      </label>
      <label className="block">
        <span className="label">Date</span>
        <input name="date" type="date" defaultValue={today} className="input" />
      </label>
      <label className="block">
        <span className="label">Grade</span>
        <select name="grade" className="input">
          <option>A</option>
          <option>B</option>
          <option>C</option>
        </select>
      </label>
      <label className="col-span-2 block">
        <span className="label">Note</span>
        <input name="note" className="input" />
      </label>
      <div className="col-span-2">
        <Submit>Add harvest to stock</Submit>
      </div>
    </ActionForm>
  );

  const batchForm = (
    <ActionForm action={createBatchAction} resetOnSuccess className="grid grid-cols-2 gap-4">
      <label className="block">
        <span className="label">Product</span>
        <select name="productId" className="input" required>
          <option value="">Choose…</option>
          {products
            .filter((p) => p.stockUnit === "kg")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn}
              </option>
            ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Batch code</span>
        <input name="code" className="input" placeholder="auto" />
      </label>
      <label className="block">
        <span className="label">Start (spawning) date</span>
        <input name="startDate" type="date" defaultValue={today} className="input" />
      </label>
      <label className="block">
        <span className="label">Expected first harvest</span>
        <input name="expectedHarvest" type="date" className="input" />
      </label>
      <label className="block">
        <span className="label">Number of bags</span>
        <input name="bagCount" type="number" className="input" />
      </label>
      <label className="block">
        <span className="label">Other direct cost (৳)</span>
        <input name="extraCost" type="number" step="0.01" className="input" placeholder="fuel, sterilising…" />
      </label>
      <fieldset className="col-span-2 rounded-xl border border-stone-200 p-3">
        <legend className="px-1 text-xs font-semibold text-stone-500">Supplies used (taken from stock at average cost)</legend>
        <div className="grid gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_100px] gap-2">
              <select name={`usage_item_${i}`} className="input input-sm" aria-label={`Supply ${i + 1}`}>
                <option value="">—</option>
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({num(s.stockQty)} {s.unit} · ৳{s.avgCost}/{s.unit})
                  </option>
                ))}
              </select>
              <input name={`usage_qty_${i}`} type="number" step="0.001" placeholder="qty" className="input input-sm" aria-label={`Quantity ${i + 1}`} />
            </div>
          ))}
        </div>
      </fieldset>
      <label className="col-span-2 block">
        <span className="label">Substrate / notes</span>
        <input name="substrate" className="input" placeholder="e.g. rice straw + lime" />
      </label>
      <div className="col-span-2">
        <Submit>Create batch</Submit>
      </div>
    </ActionForm>
  );

  return (
    <>
      <PageHeader
        title="Production"
        description="Grow batches with their real costs, and every harvest. Harvests are added to stock automatically."
        actions={
          <>
            <Drawer label="New batch" variant="outline" title="Start a new grow batch" description="Supplies you list are deducted from stock and become this batch's cost.">
              {batchForm}
            </Drawer>
            <Drawer label="Record harvest" title="Record a harvest" description="The sellable amount is added to stock right away.">
              {harvestForm}
            </Drawer>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active batches" value={activeBatches.length} icon={Sprout} />
        <Stat label="Harvested · 30 days" value={`${num(round3(kg30), 1)} kg`} icon={Scale} color="green" />
        <Stat label="Waste · 30 days" value={`${kg30 + waste30 > 0 ? Math.round((waste30 / (kg30 + waste30)) * 100) : 0}%`} hint={`${num(round3(waste30), 1)} kg`} icon={Leaf} color="amber" />
        <Stat label="Next expected harvest" value={activeBatches.filter((b) => b.expectedHarvest && b.status === "GROWING").sort((a, b) => +a.expectedHarvest! - +b.expectedHarvest!)[0]?.expectedHarvest ? fmtDate(activeBatches.filter((b) => b.expectedHarvest && b.status === "GROWING").sort((a, b) => +a.expectedHarvest! - +b.expectedHarvest!)[0].expectedHarvest!, { day: "numeric", month: "short" }) : "—"} icon={Timer} color="sky" />
      </div>

      <Card
        title={sp.all ? "All batches" : "Active batches"}
        actions={
          <Link href={sp.all ? "/admin/production" : "/admin/production?all=1"} className="text-xs font-semibold text-brand hover:underline">
            {sp.all ? "Show active only" : "Show all batches"}
          </Link>
        }
        pad={false}
      >
        {batches.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Product</th>
                  <th>Started</th>
                  <th>Status</th>
                  <th className="num">Bags</th>
                  <th className="num">Harvested</th>
                  {showMoney && <th className="num">Cost</th>}
                  {showMoney && <th className="num">Cost / kg</th>}
                  <th className="num">Yield / bag</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const s = batchSummary(b);
                  return (
                    <tr key={b.id}>
                      <td>
                        <Link href={`/admin/production/${b.id}`} className="font-semibold hover:underline">
                          {b.code}
                        </Link>
                      </td>
                      <td>{b.product.nameEn}</td>
                      <td>
                        {fmtDate(b.startDate)}
                        {b.expectedHarvest && <span className="block text-xs text-stone-500">harvest ~{fmtDate(b.expectedHarvest, { day: "numeric", month: "short" })}</span>}
                      </td>
                      <td>
                        <StatusBadge map={BATCH_STATUS} value={b.status} />
                      </td>
                      <td className="num">{b.bagCount}</td>
                      <td className="num">{num(s.kg)} kg</td>
                      {showMoney && <td className="num">{taka(s.total)}</td>}
                      {showMoney && <td className="num">{s.kg ? taka(s.costPerKg) : "—"}</td>}
                      <td className="num">{b.bagCount && s.kg ? `${num(s.kg / b.bagCount, 2)} kg` : "—"}</td>
                      <td className="text-right">
                        {showMoney && (
                          <DeleteButton
                            type="batch"
                            id={b.id}
                            title={`Delete batch ${b.code}?`}
                            description="Supplies used by this batch are returned to stock. Its harvests stay in stock but are no longer linked to a batch."
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No batches yet" icon={Sprout}>
            Use “New batch” to start tracking a grow batch and its costs.
          </Empty>
        )}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Recent harvests" pad={false}>
          {harvests.length ? (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th className="num">Sellable</th>
                    <th className="num">Waste</th>
                    <th>Grade</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {harvests.map((h) => (
                    <tr key={h.id}>
                      <td>{fmtDate(h.date)}</td>
                      <td>{h.product.nameEn}</td>
                      <td className="text-stone-500">{h.batch?.code ?? "—"}</td>
                      <td className="num">
                        {num(h.qty)} {h.product.stockUnit}
                      </td>
                      <td className="num text-stone-500">{num(h.wasteQty)}</td>
                      <td>{h.grade}</td>
                      <td className="text-right">
                        {showMoney && <DeleteButton type="harvest" id={h.id} title="Delete this harvest?" description={`${num(h.qty)} ${h.product.stockUnit} will be removed from ${h.product.nameEn} stock.`} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <Empty title="No harvests recorded" />
          )}
        </Card>
        <Card title="Harvest by product · last 30 days">
          <ul className="space-y-2.5 text-sm">
            {last30.map((r) => {
              const p = products.find((x) => x.id === r.productId);
              const q = r._sum.qty ?? 0;
              const w = r._sum.wasteQty ?? 0;
              return (
                <li key={r.productId} className="flex justify-between gap-3">
                  <span>{p?.nameEn ?? "—"}</span>
                  <span className="tabular-nums">
                    {num(round3(q))} kg <span className="text-xs text-stone-500">· waste {q + w > 0 ? Math.round((w / (q + w)) * 100) : 0}%</span>
                  </span>
                </li>
              );
            })}
            {!last30.length && <li className="text-stone-500">No harvests in the last 30 days.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
