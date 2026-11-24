"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Phone, Search, ShoppingBag, Truck, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useCart, useHydrated, cartTotals } from "./cart-store";
import { bnDigits, cn, takaBn } from "@/lib/utils";

type Cat = { slug: string; nameBn: string; nameEn: string };

/** Links shared by the desktop category bar and the phone "আরও" menu. */
export const NAV = [
  { href: "/preorder", bn: "তাজা মাশরুম · প্রি-অর্ডার", en: "Fresh, by pre-order" },
  { href: "/shop", bn: "শপ", en: "Shop" },
  { href: "/benefits", bn: "উপকারিতা", en: "Benefits" },
  { href: "/delivery", bn: "ডেলিভারি এলাকা", en: "Delivery areas" },
  { href: "/wholesale", bn: "পাইকারি", en: "Wholesale" },
  { href: "/support", bn: "যোগাযোগ", en: "Contact" },
];

function SearchForm({ id, className }: { id: string; className?: string }) {
  const params = useSearchParams();
  return (
    <form action="/shop" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        খুঁজুন · Search
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="মাশরুম, পাউডার বা কিট খুঁজুন"
          className="input h-11 rounded-[10px] border-line-strong bg-paper pl-10 pr-24 text-[15px] focus:bg-white"
          autoComplete="off"
        />
        <button className="btn btn-primary btn-sm absolute right-1.5 top-1.5 h-8 px-4">খুঁজুন</button>
      </div>
    </form>
  );
}

export function HeaderBar({ customerName, categories, phone, logoUrl }: { customerName: string | null; categories: Cat[]; phone: string; logoUrl?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const t = hydrated ? cartTotals(items) : { count: 0, subtotal: 0 };
  const accountHref = customerName ? "/account" : "/account/login";
  const tel = phone.replace(/[^\d+]/g, "");
  const activeCat = pathname === "/shop" ? params.get("category") : null;
  const barLink = (active: boolean) =>
    cn("relative flex h-full items-center whitespace-nowrap font-bangla text-[15px] transition-colors duration-150", active ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-t after:bg-tan" : "text-white/75 hover:text-white");

  return (
    <>
      <header className="sticky top-0 z-40 bg-card lg:border-b lg:border-line">
        <div className="container-x flex h-14 items-center gap-4 lg:h-[72px] lg:gap-8">
          <Logo logoUrl={logoUrl} className="max-lg:gap-2 max-lg:[&>img:first-child]:size-8 max-lg:[&>img:last-child]:h-[19px]" />
          <SearchForm id="site-search" className="hidden max-w-xl flex-1 lg:block" />
          <nav aria-label="Account and cart" className="ml-auto flex items-center gap-1">
            <Link href="/track" className="hidden flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-ink-soft transition-colors duration-150 hover:bg-paper hover:text-ink lg:flex">
              <Truck className="size-5" aria-hidden />
              <span className="font-bangla text-xs">অর্ডার ট্র্যাক</span>
            </Link>
            <Link href={accountHref} className="hidden flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-ink-soft transition-colors duration-150 hover:bg-paper hover:text-ink lg:flex">
              <User className="size-5" aria-hidden />
              <span className="max-w-24 truncate font-bangla text-xs">{customerName ? customerName.split(" ")[0] : "লগইন"}</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-ink transition-colors duration-150 hover:bg-paper lg:ml-1 lg:border lg:border-line-strong lg:px-3.5"
              aria-label={`কার্ট খুলুন, ${t.count}টি প্যাক`}
            >
              <span className="relative">
                <ShoppingBag className="size-[22px]" aria-hidden />
                {t.count > 0 && (
                  <span key={t.count} aria-hidden className="absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-cta px-1 text-[11px] font-semibold tabular-nums text-white motion-safe:animate-[cart-pop_300ms_var(--ease)]">
                    {t.count > 99 ? "৯৯+" : bnDigits(t.count)}
                  </span>
                )}
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block font-bangla text-xs text-muted">কার্ট</span>
                <span className="block font-display text-[15px] font-semibold tabular-nums">{takaBn(t.subtotal)}</span>
              </span>
            </button>
          </nav>
        </div>
      </header>

      <div className="border-b border-line bg-card pb-3 lg:hidden">
        <SearchForm id="site-search-m" className="container-x" />
      </div>

      <nav aria-label="Categories" className="hidden bg-brand-deep lg:block">
        <div className="container-x flex h-11 items-center gap-7">
          <Link href="/preorder" className={barLink(pathname === "/preorder")} aria-current={pathname === "/preorder" ? "page" : undefined}>
            তাজা মাশরুম · প্রি-অর্ডার
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className={barLink(activeCat === c.slug)} aria-current={activeCat === c.slug ? "page" : undefined}>
              {c.nameBn}
            </Link>
          ))}
          <Link href="/shop" className={barLink(pathname === "/shop" && !activeCat)}>
            সব পণ্য
          </Link>
          {NAV.slice(2).map((n) => (
            <Link key={n.href} href={n.href} className={barLink(pathname === n.href)} aria-current={pathname === n.href ? "page" : undefined}>
              {n.bn}
            </Link>
          ))}
          {tel && (
            <a href={`tel:${tel}`} className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm text-white/85 transition-colors duration-150 hover:text-white">
              <Phone className="size-4" aria-hidden /> <span className="tabular-nums">{phone}</span>
            </a>
          )}
        </div>
      </nav>
    </>
  );
}
