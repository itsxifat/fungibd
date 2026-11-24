import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/brand/ProductImage";
import { AddToCart } from "./AddToCart";
import type { ProductDTO } from "@/lib/store-data";
import { bnDigits } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductDTO }) {
  const soldOut = product.variants.every((v) => v.mode === "SOLD_OUT");
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-150 hover:border-line-strong">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[5/4]" aria-label={product.nameEn}>
        <ProductImage src={product.image} alt={product.nameEn} className="h-full w-full" />
        {(soldOut || product.badge) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {soldOut && <span className="chip bg-ink/80 text-white">স্টক শেষ</span>}
            {product.badge && <span className="chip bg-white text-ink-soft">{product.badge}</span>}
          </div>
        )}
        {product.rating.count > 0 && (
          <span className="chip absolute right-3 top-3 bg-white text-ink-soft tabular-nums">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> {bnDigits(product.rating.avg.toFixed(1))}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="font-display text-xl leading-snug text-ink">{product.nameBn}</h3>
          <p className="text-sm text-muted">{product.nameEn}</p>
        </Link>
        <p className="line-clamp-2 font-bangla text-sm leading-relaxed text-ink-soft">{product.shortBn}</p>
        <div className="mt-auto">
          <AddToCart product={product} />
        </div>
      </div>
    </article>
  );
}
