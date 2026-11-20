import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { availability, productImages } from "./catalog";

export type VariantDTO = {
  id: string;
  labelEn: string;
  labelBn: string;
  price: number;
  comparePrice: number | null;
  unitAmount: number;
  mode: "IN_STOCK" | "PREORDER" | "SOLD_OUT";
  preorderDate: string | null;
  reason: string | null;
};
export type ProductDTO = {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  shortEn: string;
  shortBn: string;
  badge: string;
  image: string;
  images: string[];
  stockUnit: string;
  stockQty: number;
  categorySlug: string | null;
  variants: VariantDTO[];
  rating: { avg: number; count: number };
  preorder: { enabled: boolean; mode: string; date: string | null; cutoff: string | null; cap: number | null; booked: number; note: string };
};

const include = { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, category: true, reviews: { where: { isApproved: true }, select: { rating: true } } } satisfies Prisma.ProductInclude;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof include }>;

export function toDTO(p: ProductRow, now = new Date()): ProductDTO {
  const images = productImages(p.images);
  return {
    id: p.id,
    slug: p.slug,
    nameEn: p.nameEn,
    nameBn: p.nameBn,
    shortEn: p.shortEn,
    shortBn: p.shortBn,
    badge: p.badge,
    image: images[0] ?? "art:oyster",
    images: images.length ? images : ["art:oyster"],
    stockUnit: p.stockUnit,
    stockQty: p.stockQty,
    categorySlug: p.category?.slug ?? null,
    variants: p.variants.map((v) => {
      const a = availability(p, v.unitAmount, now);
      return {
        id: v.id,
        labelEn: v.labelEn,
        labelBn: v.labelBn,
        price: v.price,
        comparePrice: v.comparePrice,
        unitAmount: v.unitAmount,
        mode: a.mode,
        preorderDate: a.mode === "PREORDER" && a.date ? a.date.toISOString() : null,
        reason: a.mode === "SOLD_OUT" ? a.reason : null,
      };
    }),
    rating: { avg: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0, count: p.reviews.length },
    preorder: {
      enabled: p.preorderEnabled,
      mode: p.preorderMode,
      date: p.preorderDate?.toISOString() ?? null,
      cutoff: p.preorderCutoff?.toISOString() ?? null,
      cap: p.preorderCap,
      booked: p.preorderBooked,
      note: p.preorderNote,
    },
  };
}

export async function getProducts(where: Prisma.ProductWhereInput = {}) {
  const rows = await db.product.findMany({ where: { isActive: true, ...where }, include, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return rows.map((r) => toDTO(r));
}

export async function getProduct(slug: string) {
  const p = await db.product.findUnique({ where: { slug }, include });
  if (!p || !p.isActive) return null;
  return { dto: toDTO(p), row: p };
}

/** Fresh data for cart items (price & pre-order status can change). */
export async function getCartVariants(ids: string[]) {
  const vs = await db.productVariant.findMany({ where: { id: { in: ids.slice(0, 50) } }, include: { product: true } });
  const now = new Date();
  return vs.map((v) => {
    const a = availability(v.product, v.unitAmount, now);
    return {
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      nameEn: v.product.nameEn,
      nameBn: v.product.nameBn,
      labelEn: v.labelEn,
      labelBn: v.labelBn,
      price: v.price,
      unitAmount: v.unitAmount,
      image: productImages(v.product.images)[0] ?? "art:oyster",
      mode: v.isActive && v.product.isActive ? a.mode : "SOLD_OUT",
      preorderDate: a.mode === "PREORDER" && a.date ? a.date.toISOString() : null,
      maxQty: a.mode === "IN_STOCK" ? Math.max(1, Math.floor(v.product.stockQty / v.unitAmount + 1e-9)) : a.mode === "PREORDER" && a.capLeft != null ? Math.max(1, Math.floor(a.capLeft / v.unitAmount + 1e-9)) : 20,
    };
  });
}
export type CartVariant = Awaited<ReturnType<typeof getCartVariants>>[number];
