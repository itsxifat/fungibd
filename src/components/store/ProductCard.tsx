import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/brand/ProductImage";
import { AddToCart } from "./AddToCart";
import type { ProductDTO } from "@/lib/store-data";
import { bnDigits, cn } from "@/lib/utils";

/** grid: the standard shop card. wide: image beside details, with a buy-now button (featured rows). */
export function ProductCard({ product, layout = "grid", buyNow = false }: { product: ProductDTO; layout?: "grid" | "wide"; buyNow?: boolean }) {
  const soldOut = product.variants.every((v) => v.mode === "SOLD_OUT");
  const wide = layout === "wide";
  const href = `/product/${product.slug}`;
  return (
    <article className={cn("group flex h-full overflow-hidden rounded-xl border border-line bg-card transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-[0_8px_24px_rgba(22,37,31,0.06)]", wide ? "flex-col sm:flex-row" : "flex-col")}>
      <Link href={href} className={cn("relative block shrink-0", wide ? "aspect-[4/3] sm:aspect-auto sm:w-[44%]" : "aspect-square")} aria-label={product.nameEn}>
        <ProductImage src={product.image} alt={product.nameEn} className="h-full w-full" />
        {(soldOut || product.badge) && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {soldOut && <span className="chip bg-ink/80 text-white">শেষ</span>}
            {product.badge && <span className="chip bg-white text-ink-soft">{product.badge}</span>}
          </div>
        )}
      </Link>
      <div className={cn("flex flex-1 flex-col", wide ? "gap-3 p-5 sm:p-6" : "gap-2 p-3.5 sm:p-4")}>
        <Link href={href} className="block">
          <h3 className={cn("font-display leading-snug text-ink transition-colors duration-150 group-hover:text-brand", wide ? "text-2xl" : "text-[17px] sm:text-lg")}>{product.nameBn}</h3>
          <p className="truncate text-xs text-muted">{product.nameEn}</p>
        </Link>
        {product.rating.count > 0 && (
          <p className="flex items-center gap-1 text-xs tabular-nums text-ink-soft">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> {bnDigits(product.rating.avg.toFixed(1))}
            <span className="text-muted">({bnDigits(product.rating.count)})</span>
          </p>
        )}
        {(wide || product.shortBn) && <p className={cn("font-bangla text-sm leading-relaxed text-ink-soft", wide ? "line-clamp-3" : "line-clamp-2 max-sm:hidden")}>{product.shortBn}</p>}
        <div className="mt-auto pt-1">
          <AddToCart product={product} buyNow={buyNow || wide} />
        </div>
      </div>
    </article>
  );
}
