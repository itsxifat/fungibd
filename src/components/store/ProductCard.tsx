import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/brand/ProductImage";
import { AddToCart } from "./AddToCart";
import type { ProductDTO } from "@/lib/store-data";

export function ProductCard({ product }: { product: ProductDTO }) {
  const isPre = product.variants.some((v) => v.mode === "PREORDER") && !product.variants.some((v) => v.mode === "IN_STOCK");
  const soldOut = product.variants.every((v) => v.mode === "SOLD_OUT");
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(2,96,74,.45)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[5/4]" aria-label={product.nameEn}>
        <ProductImage src={product.image} alt={product.nameEn} className="h-full w-full" imgClassName="group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isPre && <span className="chip bg-brand text-cream">প্রি-অর্ডার · Pre-order</span>}
          {soldOut && <span className="chip bg-ink/80 text-white">স্টক শেষ</span>}
          {product.badge && <span className="chip bg-white/90 text-brand-deep backdrop-blur">{product.badge}</span>}
        </div>
        {product.rating.count > 0 && (
          <span className="chip absolute right-3 top-3 bg-white/90 text-ink backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {product.rating.avg.toFixed(1)}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-display text-[1.35rem] leading-tight text-ink">{product.nameBn}</h3>
          <p className="text-sm text-muted">{product.nameEn}</p>
        </Link>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{product.shortBn}</p>
        <div className="mt-auto">
          <AddToCart product={product} />
        </div>
      </div>
    </article>
  );
}
