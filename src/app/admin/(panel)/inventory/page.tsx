import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { STOCK_REASONS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/dates";
import { num, round2, round3, taka , takaR } from "@/lib/utils";
import { Badge, Card, PageHeader, Stat, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { adjustStockAction } from "../production/actions";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const showMoney = admin.role !== "STAFF";
  const [products, moves] = await Promise.all([
    db.product.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    db.stockMovement.findMany({ where: sp.product ? { productId: sp.product } : {}, orderBy: { createdAt: "desc" }, take: 60, include: { product: true } }),
  ]);
  const value = round2(products.reduce((a, p) => a + Math.max(0, p.stockQty) * p.costPerUnit, 0));
  const low = products.filter((p) => p.isActive && !(p.preorderEnabled && p.preorderMode === "ALWAYS") && p.stockQty <= p.lowStockAt).length;

  return (
    <>
      <PageHeader title="Inventory" description="Live stock of every product. Orders deduct stock automatically; record spoilage here so profit stays accurate." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Products in stock" value={products.filter((p) => p.stockQty > 0).length} />
        <Stat label="Low stock" value={low} tone={low ? "warn" : undefined} />
        {showMoney && <Stat label="Stock value (at cost)" value={takaR(value)} />}
        <Stat label="Reserved by pre-orders" value={`${num(products.reduce((a, p) => a + p.preorderBooked, 0))} kg`} />
      </div>

      <Card title="Stock levels" pad={false}>
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">In stock</th>
                <th className="num">Pre-booked</th>
                {showMoney && <th className="num">Cost / unit</th>}
                {showMoney && <th className="num">Value</th>}
                <th>Record spoilage / adjust</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stockQty <= p.lowStockAt && !(p.preorderEnabled && p.preorderMode === "ALWAYS");
                return (
                  <tr key={p.id} className={p.isActive ? "" : "opacity-50"}>
                    <td>
                      <Link href={`/admin/inventory?product=${p.id}`} className="font-medium hover:underline">
                        {p.nameEn}
                      </Link>
                      <span className="block text-xs text-stone-500">{p.nameBn}</span>
                    </td>
                    <td className="num">
                      <span className={isLow ? "font-semibold text-amber-700" : "font-medium"}>
                        {num(round3(p.stockQty))} {p.stockUnit}
                      </span>
                      {isLow && <Badge tone="amber" className="ml-2">low</Badge>}
                    </td>
                    <td className="num text-stone-500">{p.preorderBooked ? `${num(round3(p.preorderBooked))} ${p.stockUnit}` : "—"}</td>
                    {showMoney && <td className="num">{taka(p.costPerUnit)}</td>}
                    {showMoney && <td className="num">{taka(Math.max(0, p.stockQty) * p.costPerUnit)}</td>}
                    <td>
                      <ActionForm action={adjustStockAction} resetOnSuccess className="flex flex-wrap items-center gap-1.5">
                        <input type="hidden" name="productId" value={p.id} />
                        <select name="reason" className="input input-sm w-auto py-1" aria-label="Reason">
                          <option value="SPOILAGE">Spoiled (−)</option>
                          <option value="ADJUST">Count correction (±)</option>
                          <option value="RETURN">Returned to stock (+)</option>
                        </select>
                        <input name="change" type="number" step="0.001" placeholder={p.stockUnit} className="input input-sm w-20 py-1" aria-label="Amount" />
                        <input name="note" placeholder="note" className="input input-sm w-28 py-1" aria-label="Note" />
                        <Submit variant="outline">Save</Submit>
                      </ActionForm>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card
        title={sp.product ? `Stock history · ${products.find((p) => p.id === sp.product)?.nameEn ?? ""}` : "Stock history (all products)"}
        actions={sp.product ? <Link href="/admin/inventory" className="text-xs font-medium text-brand hover:underline">Show all</Link> : undefined}
        pad={false}
        className="mt-6"
      >
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Reason</th>
                <th className="num">Change</th>
                <th>Note</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-xs">{fmtDateTime(m.createdAt)}</td>
                  <td>{m.product.nameEn}</td>
                  <td>
                    <Badge tone={m.reason === "SPOILAGE" ? "red" : m.reason === "HARVEST" ? "green" : m.change < 0 ? "blue" : "gray"}>{STOCK_REASONS[m.reason as keyof typeof STOCK_REASONS] ?? m.reason}</Badge>
                  </td>
                  <td className={`num font-medium ${m.change < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {m.change > 0 ? "+" : ""}
                    {num(m.change, 3)}
                  </td>
                  <td className="text-xs text-stone-500">{m.note}</td>
                  <td className="text-xs text-stone-500">{m.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
