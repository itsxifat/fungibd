import Link from "next/link";
import { cn } from "@/lib/utils";

/** FungiBd logo: mushroom badge + wordmark (traced from the brand files in /public/brand). */
export function Logo({
  variant = "green",
  className,
  showMark = true,
  href = "/",
  logoUrl,
}: {
  variant?: "green" | "cream";
  className?: string;
  showMark?: boolean;
  href?: string | null;
  logoUrl?: string;
}) {
  const wordmark = logoUrl || (variant === "green" ? "/brand/wordmark-green.svg" : "/brand/wordmark-cream.svg");
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/badge.svg" alt="" aria-hidden className="h-9 w-9 shrink-0 rounded-[10px]" width={36} height={36} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wordmark} alt="FungiBd" className="h-[22px] w-auto" height={22} />
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} aria-label="FungiBd home" className="shrink-0">
      {inner}
    </Link>
  );
}

export function MarkIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/mark.svg" alt="" aria-hidden className={className} />;
}
