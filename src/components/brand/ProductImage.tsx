import { cn } from "@/lib/utils";

/** Built-in illustrations (public/art) used until real photos are uploaded — "art:<kind>" in a product's image list. */
export const ART: Record<string, { src: string; tint: string }> = {
  oyster: { src: "/art/oyster.svg", tint: "#DDE7DF" },
  milky: { src: "/art/milky.svg", tint: "#E9DCC6" },
  button: { src: "/art/button.svg", tint: "#E1EAE6" },
  pink: { src: "/art/pink.svg", tint: "#F8E3E8" },
  shiitake: { src: "/art/shiitake.svg", tint: "#F1E7D6" },
  lionsmane: { src: "/art/lionsmane.svg", tint: "#DCE6DE" },
  dried: { src: "/art/dried.svg", tint: "#F3ECDD" },
  powder: { src: "/art/powder.svg", tint: "#F1E4D6" },
  spawn: { src: "/art/spawn.svg", tint: "#E9E4D6" },
  kit: { src: "/art/kit.svg", tint: "#E3E9DA" },
};

export const artFor = (src?: string) => (src?.startsWith("art:") ? ART[src.slice(4)] : undefined);

/** Shows an uploaded product photo, a built-in illustration, or a clean brand placeholder. */
export function ProductImage({ src, alt, className, imgClassName }: { src?: string; alt: string; className?: string; imgClassName?: string }) {
  const art = artFor(src);
  if (art) {
    return (
      <div className={cn("relative grid place-items-center overflow-hidden", className)} style={{ background: art.tint }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt={alt} loading="lazy" className={cn("h-[78%] w-[78%] object-contain transition-transform duration-500", imgClassName)} />
      </div>
    );
  }
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
