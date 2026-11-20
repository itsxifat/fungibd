import { cn } from "@/lib/utils";

export function SectionHeading({ bn, en, className, center = false, light = false }: { eyebrow?: string; bn: string; en?: string; className?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cn(center && "mx-auto text-center", "max-w-2xl", className)}>
      <h2 className={cn("font-display text-3xl leading-tight sm:text-4xl", light ? "text-white" : "text-ink")}>{bn}</h2>
      {en && <p className={cn("mt-2 text-base", light ? "text-white/70" : "text-muted")}>{en}</p>}
    </div>
  );
}
