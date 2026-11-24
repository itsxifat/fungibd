"use client";
import { useState } from "react";
import { ProductImage } from "@/components/brand/ProductImage";
import { cn } from "@/lib/utils";

export function Gallery({ images, alt, badge }: { images: string[]; alt: string; badge?: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="relative">
        <ProductImage src={images[i]} alt={alt} className="aspect-square w-full rounded-[20px]" />
        {badge && <span className="chip absolute left-4 top-4 bg-white text-ink-soft">{badge}</span>}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, k) => (
            <button
              key={src + k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Image ${k + 1}`}
              aria-current={k === i}
              className={cn("overflow-hidden rounded-xl ring-2 transition-[opacity,box-shadow] duration-150", k === i ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100")}
            >
              <ProductImage src={src} alt="" className="h-20 w-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
