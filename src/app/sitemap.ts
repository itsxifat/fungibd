import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl, productPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } });
  return [
    ...["/", "/preorder", "/shop", "/wholesale", "/benefits", "/delivery", "/support", "/policies", "/privacy", "/terms"].map((path) => ({ url: absoluteUrl(path) })),
    ...products.map((product) => ({ url: absoluteUrl(productPath(product.slug)), lastModified: product.updatedAt })),
  ];
}
