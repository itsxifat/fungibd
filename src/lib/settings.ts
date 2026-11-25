import { cache } from "react";
import { db } from "./db";
import type { DeliveryArea } from "./geo";

/** One picture in the home-page hero slider (Admin → Settings → Home page). */
export type HeroSlide = { image: string; title: string; caption: string; href: string };

export const DEFAULT_SETTINGS = {
  store: {
    name: "FungiBd",
    taglineBn: "নিজস্ব খামারের তাজা মাশরুম",
    taglineEn: "Farm-fresh mushrooms, grown by us in Bangladesh",
    phone: "+880 1XXX-XXXXXX",
    whatsapp: "",
    email: "hello@fungibd.com",
    address: "Dhaka, Bangladesh",
    farmAddress: "",
    hours: "",
    facebook: "",
    instagram: "",
    youtube: "",
  },
  brand: {
    // Logo files live in /public/brand (traced from the FungiBd logo). Upload new ones in Admin → Settings → Brand.
    logoUrl: "/brand/wordmark-green.svg", // used on light backgrounds
    logoDarkUrl: "/brand/wordmark-cream.svg", // used on green/dark backgrounds
    markUrl: "/brand/badge.svg",
    emailLogoUrl: "/brand/email-logo.png",
    primary: "#02604A", // FungiBd green
    accent: "#D3BFA4", // mushroom tan
    background: "#F4EDDB", // brand cream
    ink: "#16251F",
  },
  delivery: {
    centerLat: 23.7808,
    centerLng: 90.4093,
    radiusKm: 16, // used only while no delivery areas are drawn
    // Drawn in Admin → Settings → Delivery; a checkout pin must fall inside one of them.
    areas: [] as DeliveryArea[],
    freeDeliveryMin: 1500,
    minOrder: 0,
    sameDayCutoffHour: 12,
    daysAhead: 6,
    slots: ["সকাল ১০টা – দুপুর ১টা (10AM–1PM)", "দুপুর ২টা – বিকাল ৫টা (2PM–5PM)", "সন্ধ্যা ৬টা – রাত ৯টা (6PM–9PM)"],
    // Shown in the footer and emails — update it when you start delivering to new cities.
    coverageNote: "ঢাকা ও আশপাশের এলাকায় হোম ডেলিভারি",
    // Browser key for the checkout map (Maps JavaScript, Places (New), Geocoding). Empty = free OpenStreetMap map.
    googleMapsKey: "",
  },
  home: {
    announcement: "ঢাকা ও আশপাশে হোম ডেলিভারি · ক্যাশ অন ডেলিভারি",
    heroEyebrow: "", // empty = shows the next harvest date automatically
    heroTitleBn: "তাজা মাশরুম, হারভেস্টের আগেই বুক করুন",
    heroTitleEn: "",
    heroSubBn: "আমাদের খামারের সব মাশরুম প্রি-অর্ডারে বিক্রি হয়। অগ্রিম টাকা লাগে না — টাকা দেবেন হাতে পেয়ে।",
    heroCtaLabel: "প্রি-অর্ডার করুন",
    heroCtaHref: "/preorder",
    heroCta2Label: "শপ দেখুন",
    heroCta2Href: "/shop",
    heroSlides: [] as HeroSlide[], // empty = shows pre-order products automatically
    heroImage: "", // older single hero photo — used as a slide when no slides are set
    benefitsVideoUrl: "",
  },
  email: {
    sendCustomerEmails: true,
    notifyAdminEmail: "", // one or more addresses (comma or new line separated) that receive alerts
    onPlaced: true,
    onConfirmed: true,
    onOutForDelivery: true,
    onDelivered: true,
    onCancelled: true,
    adminNewOrder: true,
    adminNewTicket: true,
    adminNewLead: true,
  },
  crm: {
    atRiskDays: 30,
    lostDays: 60,
    loyalOrders: 5,
  },
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingsKey = keyof Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const out = structuredClone(DEFAULT_SETTINGS) as Settings;
  for (const r of rows) {
    if (r.key in out) {
      try {
        const parsed = JSON.parse(r.value);
        (out as Record<string, unknown>)[r.key] = { ...(out as Record<string, object>)[r.key], ...parsed };
      } catch {
        /* ignore broken JSON */
      }
    }
  }
  return out;
});

export async function saveSettings<K extends SettingsKey>(key: K, value: Partial<Settings[K]>) {
  const current = (await db.setting.findUnique({ where: { key } }))?.value;
  const merged = { ...DEFAULT_SETTINGS[key], ...(current ? JSON.parse(current) : {}), ...value };
  await db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(merged) }, update: { value: JSON.stringify(merged) } });
}

export function isHex(c: string) {
  return /^#[0-9a-fA-F]{6}$/.test(c);
}
