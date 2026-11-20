import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productImages } from "@/lib/catalog";
import { num, taka } from "@/lib/utils";
import { ProductImage } from "@/components/brand/ProductImage";
import { Badge, Card, PageHeader, TableWrap } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/client";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { categoryAction, toggleProductAction } from "./actions";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireAdmin(["OWNER", "MANAGER"]);
  const [products, cats] = await Promise.all([
    db.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { variants: { orderBy: { sortOrder: "asc" } }, category: true, _count: { select: { orderItems: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);
  const Toggle = ({ id, field, on, label }: { id: string; field: string; on: boolean; label: string }) => (
    <form action={toggleProductAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <button className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${on ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-stone-500 ring-stone-200"}`} title={`Toggle ${label}`}>
        {label}: {on ? "on" : "off"}
      </button>
    </form>
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Prices, pack sizes, photos and pre-order settings. Stock is managed in Inventory."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm rounded-lg">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      <Card pad={false}>
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Pack sizes</th>
                <th className="num">Stock</th>
                <th className="num">Cost / unit</th>
                <th>Visibility</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <ProductImage src={productImages(p.images)[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg" />
                      <span>
                        <span className="font-medium hover:underline">{p.nameEn}</span>
                        <span className="block text-xs text-stone-500">
                          {p.nameBn} · {p.category?.nameEn ?? "No category"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="text-xs">
                    {p.variants.filter((v) => v.isActive).map((v) => (
                      <span key={v.id} className="mr-2 inline-block whitespace-nowrap">
                        {v.labelEn} <b>{taka(v.price)}</b>
                      </span>
                    ))}
                  </td>
                  <td className="num">
                    <span className={p.stockQty <= p.lowStockAt ? "font-semibold text-amber-700" : ""}>
                      {num(p.stockQty)} {p.stockUnit}
                    </span>
                    {p.preorderEnabled && <span className="block text-xs text-stone-500">{num(p.preorderBooked)} pre-booked</span>}
                  </td>
                  <td className="num">
                    {taka(p.costPerUnit)}
                    <span className="block text-xs text-stone-500">{p.costMode === "AUTO" ? "from batches" : "manual"}</span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <Toggle id={p.id} field="isActive" on={p.isActive} label="Shop" />
                      <Toggle id={p.id} field="isFeatured" on={p.isFeatured} label="Home" />
                      <Toggle id={p.id} field="preorderEnabled" on={p.preorderEnabled} label="Pre-order" />
                      {p.preorderEnabled && p.preorderMode === "ALWAYS" && <Badge tone="gold">pre-order only</Badge>}
                    </div>
                  </td>
                  <td className="text-right">
                    <DeleteButton
                      type="product"
                      id={p.id}
                      title={`Delete ${p.nameEn}?`}
                      description={`Removes the product with its pack sizes, batches, harvests and stock history${p._count.orderItems ? ` (it appears in ${p._count.orderItems} order lines; those orders keep the item name)` : ""}. To only hide it, switch Shop off.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card title="Categories" className="mt-6">
        <div className="space-y-2">
          {cats.map((c) => (
            <ActionForm key={c.id} action={categoryAction} className="grid grid-cols-2 items-end gap-2 md:grid-cols-[1fr_1fr_1fr_80px_auto_auto]">
              <input type="hidden" name="id" value={c.id} />
              <input name="nameEn" defaultValue={c.nameEn} className="input input-sm" aria-label="English name" />
              <input name="nameBn" defaultValue={c.nameBn} className="input input-sm" aria-label="Bangla name" />
              <input name="slug" defaultValue={c.slug} className="input input-sm" aria-label="Slug" />
              <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input input-sm" aria-label="Order" />
              <Submit variant="outline">Save</Submit>
              <DeleteButton type="category" id={c.id} title={`Delete category ${c.nameEn}?`} description={c._count.products ? `Its ${c._count.products} product(s) are kept and become uncategorised.` : "This category is empty."} />
            </ActionForm>
          ))}
          <ActionForm action={categoryAction} resetOnSuccess className="grid grid-cols-2 items-end gap-2 border-t border-stone-100 pt-4 md:grid-cols-[1fr_1fr_1fr_80px_auto]">
            <input name="nameEn" placeholder="New category (English)" className="input input-sm" />
            <input name="nameBn" placeholder="বাংলা নাম" className="input input-sm" />
            <input name="slug" placeholder="slug (optional)" className="input input-sm" />
            <input name="sortOrder" type="number" placeholder="0" className="input input-sm" />
            <Submit>Add category</Submit>
          </ActionForm>
        </div>
      </Card>
    </>
  );
}
