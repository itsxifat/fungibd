import type { Metadata } from "next";
import { siteUrl } from "./utils";
import type { ProductDTO } from "./store-data";

export const defaultShareImage = {
  url: "/brand/og.png?v=2",
  width: 1200,
  height: 630,
  alt: "FungiBd · Farm-fresh mushrooms · Delivered in Dhaka",
};

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl()).href;
}

export function publicImage(src?: string) {
  if (!src || (!src.startsWith("/") && !/^https?:\/\//i.test(src))) return undefined;
  try {
    return absoluteUrl(src);
  } catch {
    return undefined;
  }
}

export function storefrontMetadata(path: string, title: string, description: string, image?: string): Metadata {
  const url = absoluteUrl(path);
  const images = [image ?? defaultShareImage];
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "FungiBd", locale: "bn_BD", url, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export const productPath = (slug: string) => `/product/${encodeURIComponent(slug)}`;

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

const availability = { IN_STOCK: "InStock", PREORDER: "PreOrder", SOLD_OUT: "OutOfStock" } as const;

export function productData(product: ProductDTO, description: string, store: string) {
  const url = absoluteUrl(productPath(product.slug));
  const images = product.images.map(publicImage).filter(Boolean);
  const name = product.nameEn || product.nameBn;
  const common = {
    description,
    image: images.length ? images : undefined,
    brand: { "@type": "Brand", name: store },
  };
  const variants = product.variants.map((variant) => {
    const variantUrl = new URL(url);
    if (product.variants.length > 1) variantUrl.searchParams.set("pack", variant.id);
    return {
      "@type": "Product",
      "@id": `${variantUrl.href}#product`,
      name: product.variants.length > 1 ? `${name} (${variant.labelEn || variant.labelBn})` : name,
      sku: variant.id,
      size: variant.labelEn || variant.labelBn,
      url: variantUrl.href,
      ...common,
      offers: {
        "@type": "Offer", url: variantUrl.href, price: variant.price.toFixed(2), priceCurrency: "BDT",
        availability: `https://schema.org/${availability[variant.mode]}`,
      },
    };
  });
  const aggregateRating = product.rating.count ? {
    "@type": "AggregateRating", ratingValue: Number(product.rating.avg.toFixed(1)), ratingCount: product.rating.count,
  } : undefined;
  if (variants.length === 1) return { "@context": "https://schema.org", ...variants[0], aggregateRating };
  if (!variants.length) return null;
  return {
    "@context": "https://schema.org", "@type": "ProductGroup", "@id": `${url}#product-group`,
    name, url, ...common, aggregateRating, productGroupID: product.id,
    variesBy: "https://schema.org/size", hasVariant: variants,
  };
}
