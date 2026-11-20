import { cache } from "react";
import { db } from "./db";

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
    radiusKm: 16,
    freeDeliveryMin: 1500,
    minOrder: 0,
    sameDayCutoffHour: 12,
    daysAhead: 6,
    slots: ["সকাল ১০টা – দুপুর ১টা (10AM–1PM)", "দুপুর ২টা – বিকাল ৫টা (2PM–5PM)", "সন্ধ্যা ৬টা – রাত ৯টা (6PM–9PM)"],
  },
  home: {
    announcement: "শুধুমাত্র ঢাকার ভিতরে ডেলিভারি · ক্যাশ অন ডেলিভারি",
    heroTitleBn: "খামার থেকে সরাসরি তাজা মাশরুম",
    heroTitleEn: "Fresh mushrooms from our own farm, delivered in Dhaka",
    heroSubBn: "আমাদের নিজস্ব খামারে চাষ করা মাশরুম অনলাইনে অর্ডার করুন — ঢাকার ভিতরে আপনার দরজায় পৌঁছে দেব।",
    heroImage: "",
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
