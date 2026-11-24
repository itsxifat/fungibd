"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, Truck, User, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useCart, useHydrated, cartTotals } from "./cart-store";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/preorder", bn: "প্রি-অর্ডার", en: "Pre-order" },
  { href: "/shop", bn: "শপ", en: "Shop" },
  { href: "/benefits", bn: "উপকারিতা", en: "Benefits" },
  { href: "/wholesale", bn: "পাইকারি", en: "Wholesale" },
  { href: "/support", bn: "যোগাযোগ", en: "Contact" },
];

const MOBILE_NAV = [{ href: "/", bn: "হোম", en: "Home" }, ...NAV];

export function HeaderBar({ customerName }: { customerName: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = hydrated ? cartTotals(items).count : 0;
  const accountHref = customerName ? "/account" : "/account/login";
  const accountLabel = customerName ? "My account" : "Login";
  const activeHref = pathname;
  const accountLinks = [
    { href: "/track", bn: "অর্ডার ট্র্যাক", en: "Track order", Icon: Truck },
    { href: accountHref, bn: customerName ? "অ্যাকাউন্ট" : "লগইন", en: accountLabel, Icon: User },
  ];

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    menuRef.current?.close();
  }, [pathname, searchParams]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) menuRef.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function openMenu() {
    const menu = menuRef.current;
    if (!menu || menu.open) return;
    menu.showModal();
    setMenuOpen(true);
  }

  function closeMenu() {
    menuRef.current?.close();
  }

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-paper/90 backdrop-blur-xl transition-colors duration-300 max-lg:border-line max-lg:bg-paper", scrolled ? "border-line" : "border-transparent")}>
      <div className="container-x flex h-14 items-center gap-3 lg:h-16 lg:gap-4">
        <Logo className="max-lg:gap-2 max-lg:[&>img:first-child]:size-8 max-lg:[&>img:last-child]:h-[19px]" />
        <nav aria-label="Main" className="ml-8 hidden items-center gap-7 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} title={n.en} className={cn("font-bangla text-[15px] font-medium text-ink-soft transition-colors duration-150 hover:text-ink", active && "text-ink")}>
                {n.bn}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 max-lg:shrink-0 lg:gap-1">
          <Link href="/track" className="btn btn-ghost hidden px-3 lg:inline-flex" title="Track order">
            <Truck className="h-5 w-5" />
            <span className="hidden text-sm xl:inline">অর্ডার ট্র্যাক</span>
          </Link>
          <Link href={accountHref} className="btn btn-ghost hidden px-3 lg:inline-flex" title={accountLabel}>
            <User className="h-5 w-5" />
            <span className="hidden max-w-28 truncate text-sm xl:inline">{customerName ? customerName.split(" ")[0] : "লগইন"}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-primary relative px-4 max-lg:size-11 max-lg:bg-brand-tint max-lg:p-0 max-lg:text-brand-deep max-lg:hover:bg-brand-soft lg:ml-1"
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBag className="size-5" aria-hidden />
            <span className="hidden lg:inline">কার্ট</span>
            {count > 0 && (
              <span aria-hidden className="grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-[11px] font-bold text-brand-deep max-lg:absolute max-lg:top-0 max-lg:-right-0.5 max-lg:h-[18px] max-lg:min-w-[18px] max-lg:bg-brand max-lg:text-white max-lg:ring-2 max-lg:ring-paper">
                <span className="lg:hidden">{count > 99 ? "99+" : count}</span>
                <span className="hidden lg:inline">{count}</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openMenu}
            className="btn btn-ghost size-11 border border-line p-0 lg:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-controls="store-mobile-menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <dialog
        ref={menuRef}
        id="store-mobile-menu"
        aria-labelledby="store-mobile-menu-title"
        onClose={(event) => setMenuOpen(event.currentTarget.open)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[calc(100%_-_2rem)] max-w-sm overflow-hidden rounded-l-[20px] bg-paper p-0 text-ink shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px] motion-safe:animate-[store-menu-in_200ms_ease-out] lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-line py-3 pr-4 pl-7">
            <h2 id="store-mobile-menu-title" className="font-bangla text-xl font-semibold text-brand-deep">মেনু</h2>
            <button type="button" onClick={closeMenu} className="btn btn-ghost size-11 p-0" aria-label="Close menu">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-4">
            <div className="grid gap-1">
              {MOBILE_NAV.map(({ href, bn, en }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  aria-current={activeHref === href ? "page" : undefined}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-brand-tint aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-deep"
                >
                  <span className="font-bangla text-base font-semibold">{bn}</span>
                  <span lang="en" className="text-sm text-ink-soft">{en}</span>
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-1 border-t border-line pt-3">
              {accountLinks.map(({ href, bn, en, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  aria-current={pathname === href ? "page" : undefined}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-brand-tint aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-deep"
                >
                  <Icon className="size-[18px] shrink-0 text-muted" aria-hidden />
                  <span className="font-bangla text-base font-semibold">{bn}</span>
                  <span lang="en" className="ml-auto text-right text-sm text-ink-soft">{en}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </dialog>
    </header>
  );
}
