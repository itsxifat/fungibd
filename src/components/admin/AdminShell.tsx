"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  CalendarClock,
  ChartLine,
  ChevronDown,
  ExternalLink,
  FileBarChart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Sprout,
  Star,
  Target,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogoutAction } from "@/app/admin/login/actions";

type Role = "OWNER" | "MANAGER" | "STAFF";
const ALL: Role[] = ["OWNER", "MANAGER", "STAFF"];
const MGR: Role[] = ["OWNER", "MANAGER"];
type Counts = { pending: number; tickets: number; followUps: number; lowStock: number; preorders: number };

const GROUPS = [
  { label: "", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ALL }] },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, roles: ALL, badge: "pending" as const },
      { href: "/admin/preorders", label: "Pre-orders", icon: CalendarClock, roles: ALL, badge: "preorders" as const },
      { href: "/admin/delivery", label: "Delivery", icon: Truck, roles: ALL },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, roles: MGR },
      { href: "/admin/reviews", label: "Reviews", icon: Star, roles: MGR },
    ],
  },
  {
    label: "Farm",
    items: [
      { href: "/admin/production", label: "Production", icon: Sprout, roles: ALL },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ALL, badge: "lowStock" as const },
      { href: "/admin/supplies", label: "Supplies", icon: Warehouse, roles: ALL },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users, roles: ALL },
      { href: "/admin/leads", label: "Leads", icon: Target, roles: ALL, badge: "followUps" as const },
      { href: "/admin/support", label: "Support", icon: LifeBuoy, roles: ALL, badge: "tickets" as const },
      { href: "/admin/marketing", label: "Marketing", icon: Megaphone, roles: MGR },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/finance", label: "Profit & loss", icon: ChartLine, roles: MGR },
      { href: "/admin/finance/expenses", label: "Expenses", icon: Receipt, roles: MGR },
      { href: "/admin/reports", label: "Reports", icon: FileBarChart, roles: MGR },
    ],
  },
  { label: "", items: [{ href: "/admin/settings", label: "Settings", icon: Settings, roles: ["OWNER"] as Role[] }] },
];

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", on);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  return ref;
}

export function AdminShell({ user, counts, children }: { user: { name: string; email: string; role: Role }; counts: Counts; children: React.ReactNode }) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const bellRef = useOutside(bell, () => setBell(false));
  const menuRef = useOutside(menu, () => setMenu(false));
  useEffect(() => {
    setDrawer(false);
    setBell(false);
    setMenu(false);
  }, [path]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : href === "/admin/finance" ? path === "/admin/finance" : path.startsWith(href));
  const alerts = [
    { n: counts.pending, label: "new orders to confirm", href: "/admin/orders?status=PENDING" },
    { n: counts.tickets, label: "open support tickets", href: "/admin/support" },
    { n: counts.followUps, label: "lead follow-ups due", href: "/admin/leads" },
    { n: counts.lowStock, label: "products low on stock", href: "/admin/inventory" },
    { n: counts.preorders, label: "open pre-orders", href: "/admin/preorders" },
  ].filter((a) => a.n > 0);
  const alertTotal = counts.pending + counts.tickets + counts.followUps;

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
      {GROUPS.map((g, gi) => {
        const items = g.items.filter((i) => i.roles.includes(user.role));
        if (!items.length) return null;
        return (
          <div key={gi}>
            {g.label && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{g.label}</p>}
            <ul className="space-y-0.5">
              {items.map((i) => {
                const n = "badge" in i && i.badge ? counts[i.badge] : 0;
                const active = isActive(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition",
                        active ? "bg-white/[0.12] font-semibold text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      {active && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-tan" />}
                      <i.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-tan" : "text-white/55 group-hover:text-white/80")} strokeWidth={1.9} />
                      <span className="flex-1">{i.label}</span>
                      {n > 0 && <span className="min-w-5 rounded-full bg-tan px-1.5 text-center text-[11px] font-bold leading-5 text-brand-night">{n}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-night text-white">
      <Link href="/admin" className="flex h-16 shrink-0 items-center gap-2.5 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark.svg" alt="" className="h-7 w-auto" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark-cream.svg" alt="FungiBd" className="h-[17px]" />
      </Link>
      {nav}
      <div className="m-3 rounded-2xl bg-white/[0.06] p-3">
        <p className="text-[11px] text-white/50">Signed in as</p>
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="text-[11px] capitalize text-white/50">{user.role.toLowerCase()}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F3F4F2] text-[14.5px] text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            {sidebar}
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/[0.06] bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setDrawer(true)} className="rounded-lg p-2 hover:bg-stone-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <form action="/admin/search" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              ref={search}
              name="q"
              placeholder="Search orders, customers, phone…"
              className="h-10 w-full rounded-xl border border-transparent bg-stone-100/80 pl-9 pr-10 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:bg-white"
              aria-label="Search"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-stone-300 px-1.5 text-[10px] text-stone-400 sm:block">/</kbd>
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/admin/orders/new" className="btn btn-primary btn-sm hidden rounded-xl sm:inline-flex">
              <Plus className="h-4 w-4" /> New order
            </Link>
            <div ref={bellRef} className="relative">
              <button onClick={() => setBell(!bell)} className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-stone-100" aria-label="Alerts">
                <Bell className="h-[19px] w-[19px] text-stone-600" />
                {alertTotal > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{alertTotal}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xl">
                  <p className="border-b border-stone-100 px-4 py-3 text-sm font-semibold">Needs attention</p>
                  {alerts.length ? (
                    <ul className="py-1">
                      {alerts.map((a) => (
                        <li key={a.label}>
                          <Link href={a.href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50">
                            <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-brand-tint px-1.5 text-xs font-bold text-brand">{a.n}</span>
                            {a.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-stone-500">All caught up 🎉</p>
                  )}
                </div>
              )}
            </div>
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-stone-100" aria-label="Account menu">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
                <ChevronDown className="hidden h-4 w-4 text-stone-500 sm:block" />
              </button>
              {menu && (
                <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-black/[0.06] bg-white py-1 shadow-xl">
                  <div className="border-b border-stone-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-stone-500">{user.email}</p>
                  </div>
                  <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50">
                    <ExternalLink className="h-4 w-4 text-stone-500" /> View website
                  </Link>
                  {user.role === "OWNER" && (
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50">
                      <Settings className="h-4 w-4 text-stone-500" /> Settings
                    </Link>
                  )}
                  <form action={adminLogoutAction}>
                    <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
