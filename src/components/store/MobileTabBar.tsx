"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarClock, Home, LayoutGrid, Menu, ShoppingBag, Truck, User, X } from "lucide-react";
import { useCart, useHydrated, cartTotals } from "./cart-store";
import { NAV } from "./HeaderBar";
import { bnDigits, cn } from "@/lib/utils";

/** Phone-only bottom tab bar (the way Dhaka shoppers already use shopping apps) plus the "আরও" menu. */
export function MobileTabBar({ customerName }: { customerName: string | null }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const count = hydrated ? cartTotals(items).count : 0;
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountHref = customerName ? "/account" : "/account/login";

  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const close = () => desktop.matches && menuRef.current?.close();
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);

  const tab = (active: boolean) =>
    cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 font-bangla text-[11px] transition-colors duration-150", active ? "text-brand" : "text-muted hover:text-ink");

  return (
    <>
      <nav aria-label="Phone navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-lg">
          <Link href="/" className={tab(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
            <Home className="size-5" aria-hidden /> হোম
          </Link>
          <Link href="/preorder" className={tab(pathname === "/preorder")} aria-current={pathname === "/preorder" ? "page" : undefined}>
            <CalendarClock className="size-5" aria-hidden /> প্রি-অর্ডার
          </Link>
          <Link href="/shop" className={tab(pathname === "/shop")} aria-current={pathname === "/shop" ? "page" : undefined}>
            <LayoutGrid className="size-5" aria-hidden /> শপ
          </Link>
          <button type="button" onClick={() => setOpen(true)} className={tab(false)} aria-label={`কার্ট খুলুন, ${count}টি প্যাক`}>
            <span className="relative">
              <ShoppingBag className="size-5" aria-hidden />
              {count > 0 && (
                <span key={count} aria-hidden className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[10px] font-semibold tabular-nums text-white motion-safe:animate-[cart-pop_300ms_var(--ease)]">
                  {count > 99 ? "৯৯+" : bnDigits(count)}
                </span>
              )}
            </span>
            কার্ট
          </button>
          <button
            type="button"
            onClick={() => {
              menuRef.current?.showModal();
              setMenuOpen(true);
            }}
            className={tab(menuOpen)}
            aria-haspopup="dialog"
            aria-controls="store-mobile-menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" aria-hidden /> আরও
          </button>
        </div>
      </nav>

      <dialog
        ref={menuRef}
        id="store-mobile-menu"
        aria-labelledby="store-mobile-menu-title"
        onClose={() => setMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) menuRef.current?.close();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[calc(100%_-_2rem)] max-w-sm overflow-hidden rounded-l-2xl bg-card p-0 text-ink shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop:bg-ink/45 motion-safe:animate-[store-menu-in_200ms_var(--ease)] lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-line py-3 pr-3 pl-6">
            <h2 id="store-mobile-menu-title" className="font-display text-xl">
              মেনু
            </h2>
            <button type="button" onClick={() => menuRef.current?.close()} className="btn btn-ghost size-11 p-0" aria-label="মেনু বন্ধ করুন">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="All pages" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-6">
            <div className="grid gap-0.5">
              {NAV.map(({ href, bn, en }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 transition-colors duration-150 hover:bg-paper aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-deep"
                >
                  <span className="font-bangla text-base font-medium">{bn}</span>
                  <span lang="en" className="text-sm text-muted">
                    {en}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-0.5 border-t border-line pt-3">
              {[
                { href: "/track", bn: "অর্ডার ট্র্যাক", Icon: Truck },
                { href: accountHref, bn: customerName ? "আমার অ্যাকাউন্ট" : "লগইন", Icon: User },
              ].map(({ href, bn, Icon }) => (
                <Link key={href} href={href} className="flex min-h-12 items-center gap-3 rounded-lg px-3 transition-colors duration-150 hover:bg-paper">
                  <Icon className="size-[18px] shrink-0 text-muted" aria-hidden />
                  <span className="font-bangla text-base font-medium">{bn}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
