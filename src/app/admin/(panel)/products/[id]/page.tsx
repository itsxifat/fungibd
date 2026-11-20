import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateKey, toLocalDateTimeValue } from "@/lib/dates";
import { parseJson, round3 } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ProductForm } from "../ProductForm";
import type { ProductPayload } from "../actions";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const { id } = await params;
  const isNew = id === "new";
  const [p, cats, packaging] = await Promise.all([
    isNew ? null : db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.supplyItem.findMany({ where: { isActive: true, category: "PACKAGING" }, orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !p) notFound();
  const initial: ProductPayload = p
    ? {
        id: p.id,
        nameEn: p.nameEn,
        nameBn: p.nameBn,
        slug: p.slug,
        categoryId: p.categoryId ?? "",
        shortEn: p.shortEn,
        shortBn: p.shortBn,
        descriptionEn: p.descriptionEn,
        descriptionBn: p.descriptionBn,
        highlights: parseJson<string[]>(p.highlights, []),
        cookingTips: p.cookingTips,
        storageTips: p.storageTips,
        images: parseJson<string[]>(p.images, []).filter((x) => !x.startsWith("art:")),
        badge: p.badge,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        sortOrder: p.sortOrder,
        stockUnit: p.stockUnit,
        lowStockAt: p.lowStockAt,
        costMode: p.costMode,
        costPerUnit: p.costPerUnit,
        preorderEnabled: p.preorderEnabled,
        preorderMode: p.preorderMode,
        preorderDate: p.preorderDate ? dateKey(p.preorderDate) : "",
        preorderCutoff: toLocalDateTimeValue(p.preorderCutoff),
        preorderCap: p.preorderCap,
        preorderNote: p.preorderNote,
        variants: p.variants.map((v) => ({ id: v.id, labelEn: v.labelEn, labelBn: v.labelBn, unitAmount: v.unitAmount, price: v.price, comparePrice: v.comparePrice, packagingItemId: v.packagingItemId ?? "", packagingQty: v.packagingQty, isActive: v.isActive })),
      }
    : {
        nameEn: "",
        nameBn: "",
        slug: "",
        categoryId: cats[0]?.id ?? "",
        shortEn: "",
        shortBn: "",
        descriptionEn: "",
        descriptionBn: "",
        highlights: [],
        cookingTips: "",
        storageTips: "",
        images: [],
        badge: "",
        isActive: true,
        isFeatured: false,
        sortOrder: 0,
        stockUnit: "kg",
        lowStockAt: 1,
        costMode: "AUTO",
        costPerUnit: 0,
        preorderEnabled: false,
        preorderMode: "OUT_OF_STOCK",
        preorderDate: "",
        preorderCutoff: "",
        preorderCap: null,
        preorderNote: "",
        variants: [{ labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 0, comparePrice: null, packagingItemId: "", packagingQty: 1, isActive: true }],
      };
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={isNew ? "New product" : p!.nameEn} description={isNew ? undefined : `${p!.nameBn} · /product/${p!.slug}`}
        actions={
          isNew ? undefined : (
            <DeleteButton
              type="product"
              id={p!.id}
              label="Delete product"
              redirectTo="/admin/products"
              title={`Delete ${p!.nameEn}?`}
              description="The product, its pack sizes, production batches, harvests and stock history are removed. Past orders keep their item names. To only hide it from the shop, switch off Visible in shop instead."
            />
          )
        }
      />
      <ProductForm
        initial={initial}
        categories={cats.map((c) => ({ id: c.id, name: `${c.nameEn} · ${c.nameBn}` }))}
        packaging={packaging.map((x) => ({ id: x.id, name: `${x.name} (৳${x.avgCost})` }))}
        stock={p ? { qty: round3(p.stockQty), booked: round3(p.preorderBooked) } : undefined}
      />
    </>
  );
}
