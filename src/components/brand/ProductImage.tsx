import { cn } from "@/lib/utils";

/** Shows an uploaded product photo, or a clean brand placeholder until photos are added in the admin panel. */
export function ProductImage({ src, alt, className, imgClassName }: { src?: string; alt: string; className?: string; imgClassName?: string }) {
  if (!src || src.startsWith("art:")) {
    return (
      <div className={cn("relative grid place-items-center overflow-hidden bg-cream/70", className)} role="img" aria-label={alt}>
        <span
          aria-hidden
          className="block aspect-square w-[26%] bg-tan/80"
          style={{ maskImage: "url(/brand/mark.svg)", WebkitMaskImage: "url(/brand/mark.svg)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
        />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-cream", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover transition-transform duration-500", imgClassName)} />
    </div>
  );
}
