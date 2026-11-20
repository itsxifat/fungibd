"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseDateKey, parseLocalDateTime } from "@/lib/dates";
import { boolField, numField, optNum, round2, slugify, str } from "@/lib/utils";
import { recomputeProductCost } from "@/lib/stock";
import type { ActionState } from "@/components/admin/client";

export type ProductPayload = {
  id?: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  categoryId: string;
  shortEn: string;
  shortBn: string;
  descriptionEn: string;
  descriptionBn: string;
  highlights: string[];
  cookingTips: string;
  storageTips: string;
  images: string[];
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  stockUnit: string;
  lowStockAt: number;
  costMode: string;
  costPerUnit: number;
  preorderEnabled: boolean;
  preorderMode: string;
  preorderDate: string;
  preorderCutoff: string;
  preorderCap: number | null;
  preorderNote: string;
  variants: { id?: string; labelEn: string; labelBn: string; unitAmount: number; price: number; comparePrice: number | null; packagingItemId: string; packagingQty: number; isActive: boolean }[];
};

export async function saveProductAction(p: ProductPayload): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin(["OWNER", "MANAGER"]);
  if (!p.nameEn.trim() || !p.nameBn.trim()) return { ok: false, error: "English and Bangla names are required" };
  const variants = p.variants.filter((v) => v.labelEn.trim() && v.price > 0 && v.unitAmount > 0);
  if (!variants.length) return { ok: false, error: "Add at least one pack size with a price and amount" };
  const slug = slugify(p.slug || p.nameEn);
  if (!slug) return { ok: false, error: "Slug is required" };
  const clash = await db.product.findFirst({ where: { slug, NOT: p.id ? { id: p.id } : undefined } });
  if (clash) return { ok: false, error: `The web address “${slug}” is already used by ${clash.nameEn}` };

  const data = {
    slug,
    nameEn: p.nameEn.trim(),
    nameBn: p.nameBn.trim(),
    categoryId: p.categoryId || null,
    shortEn: p.shortEn,
    shortBn: p.shortBn,
    descriptionEn: p.descriptionEn,
    descriptionBn: p.descriptionBn,
    highlights: JSON.stringify(p.highlights.map((h) => h.trim()).filter(Boolean)),
    cookingTips: p.cookingTips,
    storageTips: p.storageTips,
    images: JSON.stringify(p.images.length ? p.images : ["art:placeholder"]),
    badge: p.badge.trim(),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    sortOrder: Math.round(p.sortOrder) || 0,
    stockUnit: p.stockUnit === "pcs" ? "pcs" : "kg",
    lowStockAt: Math.max(0, p.lowStockAt),
    costMode: p.costMode === "MANUAL" ? "MANUAL" : "AUTO",
    costPerUnit: round2(Math.max(0, p.costPerUnit)),
    preorderEnabled: p.preorderEnabled,
    preorderMode: p.preorderMode === "ALWAYS" ? "ALWAYS" : "OUT_OF_STOCK",
    preorderDate: parseDateKey(p.preorderDate),
    preorderCutoff: parseLocalDateTime(p.preorderCutoff),
    preorderCap: p.preorderCap != null && p.preorderCap >= 0 ? p.preorderCap : null,
    preorderNote: p.preorderNote,
  };

  const id = await db.$transaction(async (tx) => {
    const prod = p.id ? await tx.product.update({ where: { id: p.id }, data }) : await tx.product.create({ data });
    const keep: string[] = [];
    for (const [i, v] of variants.entries()) {
      const vd = {
        labelEn: v.labelEn.trim(),
        labelBn: v.labelBn.trim() || v.labelEn.trim(),
        unitAmount: v.unitAmount,
        price: round2(v.price),
        comparePrice: v.comparePrice && v.comparePrice > v.price ? round2(v.comparePrice) : null,
        packagingItemId: v.packagingItemId || null,
        packagingQty: v.packagingQty > 0 ? v.packagingQty : 1,
        isActive: v.isActive,
        sortOrder: i,
      };
      if (v.id) {
        await tx.productVariant.update({ where: { id: v.id }, data: vd });
        keep.push(v.id);
      } else keep.push((await tx.productVariant.create({ data: { ...vd, productId: prod.id } })).id);
    }
    const removed = await tx.productVariant.findMany({ where: { productId: prod.id, id: { notIn: keep } }, include: { _count: { select: { orderItems: true } } } });
    for (const r of removed) {
      if (r._count.orderItems) await tx.productVariant.update({ where: { id: r.id }, data: { isActive: false } });
      else await tx.productVariant.delete({ where: { id: r.id } });
    }
    return prod.id;
  });
  if (data.costMode === "AUTO") await recomputeProductCost(id);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function toggleProductAction(fd: FormData) {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const field = str(fd, "field");
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  if (field === "isActive") await db.product.update({ where: { id }, data: { isActive: !p.isActive } });
  if (field === "isFeatured") await db.product.update({ where: { id }, data: { isFeatured: !p.isFeatured } });
  if (field === "preorderEnabled") await db.product.update({ where: { id }, data: { preorderEnabled: !p.preorderEnabled } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/preorders");
}

export async function preorderSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  const cap = optNum(fd, "preorderCap");
  await db.product.update({
    where: { id },
    data: {
      preorderEnabled: boolField(fd, "preorderEnabled"),
      preorderMode: str(fd, "preorderMode") === "ALWAYS" ? "ALWAYS" : "OUT_OF_STOCK",
      preorderDate: parseDateKey(str(fd, "preorderDate")),
      preorderCutoff: parseLocalDateTime(str(fd, "preorderCutoff")),
      preorderCap: cap != null && cap >= 0 ? cap : null,
      preorderNote: str(fd, "preorderNote"),
    },
  });
  revalidatePath("/admin/preorders");
  revalidatePath("/", "layout");
  return { ok: true, message: "Pre-order settings saved" };
}

export async function categoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin(["OWNER", "MANAGER"]);
  const id = str(fd, "id");
  if (str(fd, "delete")) {
    await db.category.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { ok: true, message: "Category deleted" };
  }
  const nameEn = str(fd, "nameEn");
  const nameBn = str(fd, "nameBn");
  if (!nameEn || !nameBn) return { error: "Both names are required" };
  const data = { nameEn, nameBn, slug: slugify(str(fd, "slug") || nameEn), sortOrder: numField(fd, "sortOrder", 0) };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  revalidatePath("/admin/products");
  return { ok: true, message: "Category saved" };
}
