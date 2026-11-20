"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, Truck, User, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useCart, useHydrated, cartTotals } from "./cart-store";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/shop", bn: "শপ", en: "Shop" },
  { href: "/shop?filter=preorder", bn: "প্রি-অর্ডার", en: "Pre-order" },
  { href: "/benefits", bn: "উপকারিতা", en: "Benefits" },
  { href: "/wholesale", bn: "পাইকারি", en: "Wholesale" },
  { href: "/support", bn: "যোগাযোগ", en: "Contact" },
];

export function HeaderBar({ customerName }: { customerName: string | null }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = hydrated ? cartTotals(items).count : 0;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className={cn("sticky top-0 z-40 border-b bg-paper/90 backdrop-blur-xl transition-colors duration-300", scrolled ? "border-line" : "border-transparent")}>
      <div className="container-x flex h-16 items-center gap-4">
        <Logo />
        <nav aria-label="Main" className="ml-8 hidden items-center gap-7 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href.split("?")[0] && !n.href.includes("?");
            return (
              <Link key={n.href} href={n.href} title={n.en} className={cn("font-bangla text-[15px] font-medium text-ink-soft transition hover:text-brand", active && "text-brand")}>
                {n.bn}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/track" className="btn btn-ghost hidden px-3 md:inline-flex" title="Track order">
            <Truck className="h-5 w-5" />
            <span className="hidden text-sm xl:inline">অর্ডার ট্র্যাক</span>
          </Link>
          <Link href={customerName ? "/account" : "/account/login"} className="btn btn-ghost px-3" title={customerName ? "My account" : "Login"}>
            <User className="h-5 w-5" />
            <span className="hidden max-w-28 truncate text-sm xl:inline">{customerName ? customerName.split(" ")[0] : "লগইন"}</span>
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary relative ml-1 px-4" aria-label={`Open cart, ${count} items`}>
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">কার্ট</span>
            {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-[11px] font-bold text-brand-deep">{count}</span>}
          </button>
          <button type="button" onClick={() => setMenu(true)} className="btn btn-ghost px-3 lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(86vw,360px)] flex-col bg-paper p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setMenu(false)} className="btn btn-ghost px-2" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {[{ href: "/", bn: "হোম", en: "Home" }, ...NAV, { href: "/track", bn: "অর্ডার ট্র্যাক", en: "Track order" }].map((n) => (
                <Link key={n.href} href={n.href} className="flex items-baseline justify-between rounded-2xl px-4 py-3 hover:bg-brand-tint">
                  <span className="font-bangla text-lg font-semibold">{n.bn}</span>
                  <span className="text-xs uppercase tracking-widest text-muted">{n.en}</span>
                </Link>
              ))}
            </nav>
            <p className="mt-auto font-bangla text-sm text-muted">শুধুমাত্র ঢাকার ভিতরে ডেলিভারি · ক্যাশ অন ডেলিভারি</p>
          </div>
        </div>
      )}
    </header>
  );
}
