/**
 * Seeds FungiBd.
 *   npm run db:seed            → essentials only (admin login, products, delivery areas, supplies)
 *   npm run db:seed -- --demo  → essentials + ~75 days of sample orders, customers, leads etc. (for trying the dashboard)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, startOfDay, dateKey } from "../src/lib/dates";

const db = new PrismaClient();
const DEMO = process.argv.includes("--demo");
const HOUR = 3600_000;
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// deterministic random so the demo looks the same every time
let seed = 20261120;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
const between = (a: number, b: number) => a + rnd() * (b - a);
const int = (a: number, b: number) => Math.floor(between(a, b + 1));
function weighted<T>(items: [T, number][]) {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let x = rnd() * total;
  for (const [v, w] of items) if ((x -= w) <= 0) return v;
  return items[0][0];
}

const today = startOfDay();

async function essentials() {
  // ── Admin ──
  const email = (process.env.ADMIN_EMAIL || "admin@fungibd.com").toLowerCase();
  const exists = await db.adminUser.findUnique({ where: { email } });
  if (!exists) {
    await db.adminUser.create({ data: { name: "FungiBd Owner", email, role: "OWNER", passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "ChangeMe@123", 10) } });
    console.log(`✓ Owner login: ${email}`);
  }

  if (await db.product.count()) {
    console.log("• Catalog already exists — skipping essentials");
    return;
  }

  // ── Categories ──
  const cats = await Promise.all(
    [
      { slug: "fresh", nameEn: "Fresh mushrooms", nameBn: "তাজা মাশরুম", sortOrder: 1 },
      { slug: "specialty", nameEn: "Specialty & gourmet", nameBn: "প্রিমিয়াম মাশরুম", sortOrder: 2 },
      { slug: "dried", nameEn: "Dried & powder", nameBn: "শুকনো ও পাউডার", sortOrder: 3 },
      { slug: "grow", nameEn: "Grow at home", nameBn: "ঘরে চাষ করুন", sortOrder: 4 },
    ].map((c) => db.category.create({ data: c })),
  );
  const cat = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  // ── Supplies (production + packaging) ──
  const supplyDefs = [
    { key: "spawn", name: "Oyster spawn packet", nameBn: "স্পন প্যাকেট", category: "PRODUCTION", unit: "pcs", avgCost: 25, reorderLevel: 150 },
    { key: "straw", name: "Rice straw", nameBn: "খড়", category: "PRODUCTION", unit: "kg", avgCost: 8, reorderLevel: 150 },
    { key: "sawdust", name: "Sawdust", nameBn: "কাঠের গুঁড়া", category: "PRODUCTION", unit: "kg", avgCost: 6, reorderLevel: 100 },
    { key: "bran", name: "Wheat bran", nameBn: "গমের ভুসি", category: "PRODUCTION", unit: "kg", avgCost: 42, reorderLevel: 20 },
    { key: "lime", name: "Lime (chun)", nameBn: "চুন", category: "PRODUCTION", unit: "kg", avgCost: 30, reorderLevel: 5 },
    { key: "polybag", name: "Polybag 12×18", nameBn: "পলিব্যাগ", category: "PRODUCTION", unit: "pcs", avgCost: 2.5, reorderLevel: 200 },
    { key: "boxS", name: "Kraft box 250 g", nameBn: "ক্রাফট বক্স (ছোট)", category: "PACKAGING", unit: "pcs", avgCost: 9, reorderLevel: 100 },
    { key: "boxM", name: "Kraft box 500 g", nameBn: "ক্রাফট বক্স (মাঝারি)", category: "PACKAGING", unit: "pcs", avgCost: 13, reorderLevel: 80 },
    { key: "zip", name: "Breathable zip bag 1 kg", nameBn: "জিপ ব্যাগ ১ কেজি", category: "PACKAGING", unit: "pcs", avgCost: 11, reorderLevel: 60 },
    { key: "pouch", name: "Stand-up pouch (dried)", nameBn: "পাউচ", category: "PACKAGING", unit: "pcs", avgCost: 14, reorderLevel: 40 },
    { key: "jar", name: "Glass jar 100 g", nameBn: "কাঁচের জার", category: "PACKAGING", unit: "pcs", avgCost: 35, reorderLevel: 20 },
    { key: "sticker", name: "Brand sticker", nameBn: "স্টিকার", category: "PACKAGING", unit: "pcs", avgCost: 1.5, reorderLevel: 300 },
  ];
  const supplies: Record<string, string> = {};
  for (const s of supplyDefs) {
    const { key, ...data } = s;
    supplies[key] = (await db.supplyItem.create({ data: { ...data, stockQty: 0 } })).id;
  }

  // ── Products ──
  const P = [
    {
      slug: "oyster-mushroom",
      nameEn: "Oyster Mushroom",
      nameBn: "ঝিনুক মাশরুম",
      cat: "fresh",
      art: "oyster",
      isFeatured: true,
      stockQty: 18,
      lowStockAt: 4,
      costPerUnit: 135,
      shortBn: "নরম, মাংসল আর হালকা মিষ্টি স্বাদ — প্রতিদিনের রান্নার সেরা মাশরুম।",
      shortEn: "Tender, meaty and mildly sweet — the everyday mushroom.",
      descriptionBn:
        "আমাদের নিজস্ব খামারে চাষ করা ঝিনুক মাশরুম। বাছাই করে যত্নের সাথে প্যাক করা হয়, যাতে তাজা অবস্থায় আপনার কাছে পৌঁছায়।",
      descriptionEn:
        "Grown at our own farm, sorted and packed with care so they reach you fresh.",
      highlights: ["নিজস্ব খামারে চাষ · Grown on our own farm", "উদ্ভিজ্জ প্রোটিন ও আঁশের উৎস · Source of plant protein & fibre", "ঢাকার ভিতরে হোম ডেলিভারি · Home delivery in Dhaka"],
      cookingTips: "ভাজি, ঝোল, স্যুপ, নুডলস, পাস্তা বা বিরিয়ানি — হাত দিয়ে ছিঁড়ে নিন। বেশি পানিতে ধোবেন না, ভেজা কাপড়ে হালকা মুছে নিন। উচ্চ আঁচে অল্প তেলে ৩–৪ মিনিট ভাজলেই সোনালি আর সুস্বাদু।",
      storageTips: "পেপার ব্যাগ বা আমাদের বক্সেই ফ্রিজের নিচের তাকে রাখুন। ২–৩ দিনের মধ্যে রান্না করুন। প্লাস্টিক ব্যাগে মুখ বন্ধ করে রাখবেন না।",
      variants: [
        { labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 90, pack: "boxS" },
        { labelEn: "500 g", labelBn: "৫০০ গ্রাম", unitAmount: 0.5, price: 170, comparePrice: 180, pack: "boxM" },
        { labelEn: "1 kg", labelBn: "১ কেজি", unitAmount: 1, price: 320, comparePrice: 360, pack: "zip" },
      ],
    },
    {
      slug: "milky-mushroom",
      nameEn: "Milky Mushroom",
      nameBn: "দুধ মাশরুম",
      cat: "fresh",
      art: "milky",
      isFeatured: true,
      stockQty: 6,
      lowStockAt: 2,
      costPerUnit: 165,
      preorderEnabled: true,
      preorderMode: "OUT_OF_STOCK",
      preorderInDays: 2,
      shortBn: "দুধ-সাদা, ঘন আর কচকচে — রান্নায় ভেঙে যায় না।",
      shortEn: "Milk-white, dense and crunchy — holds its shape in curries.",
      descriptionBn: "গরম আবহাওয়ার উপযোগী দুধ মাশরুম — মোটা ডাঁটা, ঘন শাঁস আর হালকা বাদামের মতো স্বাদ। মাছ-মাংসের ঝোল, কাবাব আর গ্রিলে দারুণ।",
      descriptionEn: "A summer-loving variety with a thick stem, dense flesh and a gentle nutty flavour. Excellent in curries, kebabs and on the grill.",
      highlights: ["স্টক শেষ হলে প্রি-অর্ডার করা যায় · Pre-order when sold out", "ফ্রিজে ৪–৫ দিন তাজা থাকে · Stays fresh 4–5 days", "কোলেস্টেরল ও গ্লুটেন মুক্ত · Cholesterol & gluten free"],
      cookingTips: "গোল গোল করে কেটে ঝোল, ভুনা বা গ্রিলে ব্যবহার করুন। মশলা ভালোভাবে শুষে নেয়।",
      storageTips: "পেপার ব্যাগে ফ্রিজে রাখুন, ৪–৫ দিন পর্যন্ত ভালো থাকে।",
      variants: [
        { labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 110, pack: "boxS" },
        { labelEn: "500 g", labelBn: "৫০০ গ্রাম", unitAmount: 0.5, price: 210, pack: "boxM" },
        { labelEn: "1 kg", labelBn: "১ কেজি", unitAmount: 1, price: 400, comparePrice: 440, pack: "zip" },
      ],
    },
    {
      slug: "button-mushroom",
      nameEn: "Button Mushroom",
      nameBn: "বাটন মাশরুম",
      cat: "fresh",
      art: "button",
      stockQty: 0,
      lowStockAt: 1.5,
      costPerUnit: 260,
      preorderEnabled: true,
      preorderMode: "OUT_OF_STOCK",
      preorderInDays: 3,
      shortBn: "পরিচিত সাদা বাটন মাশরুম — পিৎজা, পাস্তা আর স্যুপের জন্য।",
      shortEn: "The classic white button — for pizza, pasta and soups.",
      descriptionBn: "পরিচিত সাদা বাটন মাশরুম — ছোট, শক্ত আর পরিষ্কার।",
      descriptionEn: "Classic firm white button mushrooms.",
      highlights: ["সেলেনিয়াম ও পটাশিয়ামের উৎস · Source of selenium & potassium"],
      cookingTips: "স্লাইস করে মাখনে সতে করুন, অথবা আস্ত গ্রিল করুন।",
      storageTips: "ফ্রিজে পেপার ব্যাগে ৪ দিন পর্যন্ত।",
      variants: [
        { labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 180, pack: "boxS" },
        { labelEn: "500 g", labelBn: "৫০০ গ্রাম", unitAmount: 0.5, price: 340, pack: "boxM" },
      ],
    },
    {
      slug: "pink-oyster-mushroom",
      nameEn: "Pink Oyster Mushroom",
      nameBn: "গোলাপি ঝিনুক মাশরুম",
      cat: "specialty",
      art: "pink",
      isFeatured: true,
      stockQty: 0,
      lowStockAt: 0,
      costPerUnit: 210,
      preorderEnabled: true,
      preorderMode: "ALWAYS",
      preorderInDays: 4,
      preorderCap: 15,
      shortBn: "চোখ ধাঁধানো গোলাপি রঙ, রান্নায় হালকা সামুদ্রিক স্বাদ।",
      shortEn: "Stunning pink clusters with a savoury, seafood-like taste.",
      descriptionBn: "সীমিত পরিমাণে চাষ হয় — তাই শুধুমাত্র প্রি-অর্ডারে। হারভেস্টের দিন তুলে সরাসরি আপনার কাছে।",
      descriptionEn: "Grown in small batches, so we sell it by pre-order only — picked on harvest day and sent straight to you.",
      highlights: ["শুধুমাত্র প্রি-অর্ডার · Pre-order only", "সীমিত স্লট · Limited slots each harvest"],
      cookingTips: "উচ্চ আঁচে মচমচে করে ভাজুন — বেকন বা চিংড়ির মতো স্বাদ পাবেন।",
      storageTips: "দ্রুত নষ্ট হয় — ডেলিভারির দিনেই রান্না করা ভালো।",
      variants: [
        { labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 140, pack: "boxS" },
        { labelEn: "500 g", labelBn: "৫০০ গ্রাম", unitAmount: 0.5, price: 260, pack: "boxM" },
      ],
    },
    {
      slug: "shiitake-mushroom",
      nameEn: "Shiitake Mushroom",
      nameBn: "শিতাকে মাশরুম",
      cat: "specialty",
      art: "shiitake",
      stockQty: 0,
      lowStockAt: 0,
      costPerUnit: 520,
      preorderEnabled: true,
      preorderMode: "ALWAYS",
      preorderInDays: 7,
      preorderCap: 8,
      shortBn: "গভীর উমামি স্বাদের জাপানি মাশরুম — স্যুপ ও স্টার-ফ্রাইয়ের জন্য।",
      shortEn: "Deep umami flavour — the chef's favourite for soups & stir-fries.",
      descriptionBn: "কাঠের গুঁড়ার ব্লকে ধীরে ধীরে বেড়ে ওঠা শিতাকে। ঘন স্বাদ আর সুগন্ধ।",
      descriptionEn: "Slow-grown on hardwood sawdust blocks for a rich, smoky aroma.",
      highlights: ["শুধুমাত্র প্রি-অর্ডার · Pre-order only", "লেন্টিনান ও বিটা-গ্লুকানের উৎস · Source of beta-glucans"],
      cookingTips: "ডাঁটা ফেলে দিয়ে (বা স্টকে ব্যবহার করে) ক্যাপ স্লাইস করুন।",
      storageTips: "ফ্রিজে এক সপ্তাহ পর্যন্ত ভালো থাকে।",
      variants: [
        { labelEn: "200 g", labelBn: "২০০ গ্রাম", unitAmount: 0.2, price: 380, pack: "boxS" },
        { labelEn: "500 g", labelBn: "৫০০ গ্রাম", unitAmount: 0.5, price: 900, pack: "boxM" },
      ],
    },
    {
      slug: "lions-mane-mushroom",
      nameEn: "Lion's Mane Mushroom",
      nameBn: "লায়ন্স মেন মাশরুম",
      cat: "specialty",
      art: "lionsmane",
      stockQty: 0,
      lowStockAt: 0,
      costPerUnit: 650,
      preorderEnabled: true,
      preorderMode: "ALWAYS",
      preorderInDays: 10,
      preorderCap: 5,
      shortBn: "কাঁকড়ার মাংসের মতো নরম আঁশ — বিশ্বজুড়ে জনপ্রিয় ‘ব্রেইন মাশরুম’।",
      shortEn: "Soft, crab-like texture — the much-loved 'brain mushroom'.",
      descriptionBn: "ঝুলন্ত সাদা আঁশের মতো দেখতে এই বিরল মাশরুম ছোট ছোট ব্যাচে চাষ করা হয়।",
      descriptionEn: "A rare, cascading white mushroom grown in very small batches.",
      highlights: ["খুবই সীমিত · Very limited", "শুধুমাত্র প্রি-অর্ডার · Pre-order only"],
      cookingTips: "মোটা স্লাইস করে মাখনে স্টেকের মতো ভাজুন।",
      storageTips: "পেপার ব্যাগে ফ্রিজে ৩–৪ দিন।",
      variants: [{ labelEn: "200 g", labelBn: "২০০ গ্রাম", unitAmount: 0.2, price: 480, pack: "boxS" }],
    },
    {
      slug: "sun-dried-oyster-mushroom",
      nameEn: "Sun-dried Oyster Mushroom",
      nameBn: "রোদে শুকানো মাশরুম",
      cat: "dried",
      art: "dried",
      stockQty: 3,
      lowStockAt: 0.5,
      costPerUnit: 1100,
      shortBn: "মাসের পর মাস সংরক্ষণযোগ্য — ভিজিয়ে নিলেই রান্নার জন্য তৈরি।",
      shortEn: "Keeps for months — just soak and cook.",
      descriptionBn: "তাজা ঝিনুক মাশরুম রোদে শুকানো — এতে প্রাকৃতিকভাবে ভিটামিন ডি বাড়ে। ১০০ গ্রাম শুকনো ≈ ১ কেজি তাজা।",
      descriptionEn: "Fresh oyster mushrooms dried in the sun, which naturally boosts vitamin D. 100 g dried ≈ 1 kg fresh.",
      highlights: ["৬ মাস পর্যন্ত সংরক্ষণযোগ্য · Shelf life 6 months", "রোদে শুকানো = বেশি ভিটামিন ডি · Sun-dried for more vitamin D"],
      cookingTips: "২০ মিনিট গরম পানিতে ভিজিয়ে রাখুন। ভেজানো পানি স্যুপে ব্যবহার করুন।",
      storageTips: "এয়ারটাইট পাত্রে ঠান্ডা, শুকনো জায়গায় রাখুন।",
      variants: [
        { labelEn: "100 g", labelBn: "১০০ গ্রাম", unitAmount: 0.1, price: 260, pack: "pouch" },
        { labelEn: "250 g", labelBn: "২৫০ গ্রাম", unitAmount: 0.25, price: 600, pack: "pouch" },
      ],
    },
    {
      slug: "mushroom-powder",
      nameEn: "Mushroom Powder",
      nameBn: "মাশরুম পাউডার",
      cat: "dried",
      art: "powder",
      stockUnit: "pcs",
      stockQty: 25,
      lowStockAt: 5,
      costPerUnit: 150,
      costMode: "MANUAL",
      shortBn: "স্যুপ, ডাল, স্মুদি বা শিশুর খাবারে এক চামচ — পুষ্টি বাড়ান সহজে।",
      shortEn: "A spoonful in soups, dal or smoothies — easy everyday nutrition.",
      descriptionBn: "১০০% শুকনো ঝিনুক মাশরুম মিহি করে গুঁড়া করা। কোনো প্রিজারভেটিভ নেই।",
      descriptionEn: "100% dried oyster mushroom, finely milled. No preservatives or fillers.",
      highlights: ["১০০% খাঁটি · 100% pure", "কোনো প্রিজারভেটিভ নেই · No preservatives"],
      cookingTips: "প্রতিদিন ১ চা চামচ স্যুপ, ডাল, ভাত বা স্মুদিতে মিশিয়ে নিন।",
      storageTips: "ব্যবহারের পর মুখ ভালো করে বন্ধ রাখুন।",
      variants: [{ labelEn: "100 g jar", labelBn: "১০০ গ্রাম জার", unitAmount: 1, price: 320, pack: "jar" }],
    },
    {
      slug: "oyster-spawn-packet",
      nameEn: "Oyster Spawn Packet",
      nameBn: "মাশরুমের বীজ (স্পন)",
      cat: "grow",
      art: "spawn",
      stockUnit: "pcs",
      stockQty: 120,
      lowStockAt: 30,
      costPerUnit: 28,
      costMode: "MANUAL",
      shortBn: "নিজেই মাশরুম চাষ শুরু করুন।",
      shortEn: "Start growing oyster mushrooms yourself.",
      descriptionBn: "ঝিনুক মাশরুমের স্পন। প্রতিটি প্যাকেটে ১টি চাষ-ব্যাগ তৈরি করা যায়।",
      descriptionEn: "Oyster mushroom spawn. Each packet makes one grow bag.",
      highlights: ["চাষ পদ্ধতির গাইড সহ · Includes growing guide"],
      cookingTips: "",
      storageTips: "ঠান্ডা, ছায়াযুক্ত জায়গায় রাখুন। ১৫ দিনের মধ্যে ব্যবহার করুন।",
      variants: [
        { labelEn: "1 packet", labelBn: "১ প্যাকেট", unitAmount: 1, price: 60, pack: "sticker" },
        { labelEn: "5 packets", labelBn: "৫ প্যাকেট", unitAmount: 5, price: 280, comparePrice: 300, pack: "sticker" },
      ],
    },
    {
      slug: "home-grow-kit",
      nameEn: "Home Grow Kit",
      nameBn: "ঘরে মাশরুম চাষের কিট",
      cat: "grow",
      art: "kit",
      stockUnit: "pcs",
      stockQty: 15,
      lowStockAt: 4,
      costPerUnit: 210,
      costMode: "MANUAL",
      shortBn: "ঘরে বসেই মাশরুম চাষ করুন — নিয়মিত পানি স্প্রে করলেই হবে।",
      shortEn: "Grow mushrooms at home — just mist with water regularly.",
      descriptionBn: "রেডি-টু-গ্রো ব্যাগ — বারান্দা বা রান্নাঘরেই চাষ করুন। ২–৩ বার ফলন পাবেন।",
      descriptionEn: "A ready-to-fruit bag for your balcony or kitchen. Gives 2–3 flushes.",
      highlights: ["চাষের নির্দেশিকা সহ · Includes instructions"],
      cookingTips: "",
      storageTips: "সরাসরি রোদ থেকে দূরে রাখুন, দিনে ২–৩ বার পানি স্প্রে করুন।",
      variants: [{ labelEn: "1 kit", labelBn: "১টি কিট", unitAmount: 1, price: 450, pack: "sticker" }],
    },
  ];

  let sort = 0;
  for (const p of P) {
    const pre = (p as { preorderInDays?: number }).preorderInDays;
    const preDate = pre ? addDays(today, pre) : null;
    await db.product.create({
      data: {
        slug: p.slug,
        nameEn: p.nameEn,
        nameBn: p.nameBn,
        shortEn: p.shortEn,
        shortBn: p.shortBn,
        descriptionEn: p.descriptionEn,
        descriptionBn: p.descriptionBn,
        highlights: JSON.stringify(p.highlights),
        cookingTips: p.cookingTips,
        storageTips: p.storageTips,
        images: JSON.stringify([`art:${p.art}`]),
        badge: "",
        categoryId: cat(p.cat),
        isFeatured: p.isFeatured ?? false,
        sortOrder: sort++,
        stockUnit: (p as { stockUnit?: string }).stockUnit ?? "kg",
        stockQty: 0,
        lowStockAt: p.lowStockAt,
        costPerUnit: p.costPerUnit,
        costMode: (p as { costMode?: string }).costMode ?? "AUTO",
        preorderEnabled: (p as { preorderEnabled?: boolean }).preorderEnabled ?? false,
        preorderMode: (p as { preorderMode?: string }).preorderMode ?? "OUT_OF_STOCK",
        preorderDate: preDate,
        preorderCutoff: preDate ? new Date(preDate.getTime() - 4 * HOUR) : null,
        preorderCap: (p as { preorderCap?: number }).preorderCap ?? null,
        preorderNote: preDate ? "হারভেস্টের পর নির্ধারিত দিনে ডেলিভারি · Delivered on the scheduled harvest date" : "",
        variants: {
          create: p.variants.map((v, i) => ({
            labelEn: v.labelEn,
            labelBn: v.labelBn,
            unitAmount: v.unitAmount,
            price: v.price,
            comparePrice: (v as { comparePrice?: number }).comparePrice ?? null,
            packagingItemId: supplies[v.pack],
            packagingQty: 1,
            sortOrder: i,
          })),
        },
      },
    });
  }

  // ── Delivery areas inside Dhaka ──
  const zones: [string, string, number, number][] = [
    ["Dhanmondi", "ধানমন্ডি", 60, 45],
    ["Mohammadpur", "মোহাম্মদপুর", 60, 45],
    ["Lalmatia", "লালমাটিয়া", 60, 45],
    ["Farmgate & Tejgaon", "ফার্মগেট ও তেজগাঁও", 60, 40],
    ["Kawran Bazar & Panthapath", "কারওয়ান বাজার ও পান্থপথ", 60, 40],
    ["Shyamoli & Adabor", "শ্যামলী ও আদাবর", 60, 45],
    ["Gulshan", "গুলশান", 70, 50],
    ["Banani", "বনানী", 70, 50],
    ["Baridhara & DOHS", "বারিধারা ও ডিওএইচএস", 70, 50],
    ["Mohakhali", "মহাখালী", 70, 45],
    ["Mirpur", "মিরপুর", 70, 50],
    ["Pallabi & Kafrul", "পল্লবী ও কাফরুল", 70, 50],
    ["Cantonment", "ক্যান্টনমেন্ট", 80, 55],
    ["Badda & Aftabnagar", "বাড্ডা ও আফতাবনগর", 80, 55],
    ["Rampura & Banasree", "রামপুরা ও বনশ্রী", 80, 55],
    ["Bashundhara R/A", "বসুন্ধরা আ/এ", 80, 55],
    ["Malibagh & Moghbazar", "মালিবাগ ও মগবাজার", 70, 45],
    ["Shantinagar & Paltan", "শান্তিনগর ও পল্টন", 70, 45],
    ["Motijheel & Dilkusha", "মতিঝিল ও দিলকুশা", 80, 50],
    ["Khilgaon & Basabo", "খিলগাঁও ও বাসাবো", 80, 55],
    ["Azimpur & New Market", "আজিমপুর ও নিউমার্কেট", 70, 45],
    ["Old Dhaka (Lalbagh, Chawkbazar)", "পুরান ঢাকা (লালবাগ, চকবাজার)", 90, 60],
    ["Wari & Sutrapur", "ওয়ারী ও সূত্রাপুর", 90, 60],
    ["Jatrabari & Demra", "যাত্রাবাড়ী ও ডেমরা", 100, 65],
    ["Khilkhet & Nikunja", "খিলক্ষেত ও নিকুঞ্জ", 90, 60],
    ["Uttara", "উত্তরা", 100, 70],
  ];
  await db.deliveryZone.createMany({ data: zones.map(([nameEn, nameBn, charge, riderCost], i) => ({ nameEn, nameBn, charge, riderCost, sortOrder: i })) });

  await db.rider.createMany({
    data: [
      { name: "Rahim (in-house)", phone: "01700000001", type: "INHOUSE", costPerDelivery: 50 },
      { name: "Sohel (in-house)", phone: "01700000002", type: "INHOUSE", costPerDelivery: 50 },
      { name: "Courier partner", phone: "", type: "COURIER", costPerDelivery: 70 },
    ],
  });

  await db.supplier.createMany({
    data: [
      { name: "Savar Spawn Lab", phone: "01800000001", address: "Savar, Dhaka", note: "Oyster & milky spawn" },
      { name: "Keraniganj Straw Depot", phone: "01800000002", address: "Keraniganj" },
      { name: "Nilkhet Packaging House", phone: "01800000003", address: "Nilkhet, Dhaka", note: "Kraft boxes, pouches, stickers" },
    ],
  });

  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10, maxDiscount: 100, minOrder: 300, perCustomer: 1, note: "First order 10% off" },
      { code: "FREEDEL", type: "FREE_DELIVERY", value: 0, minOrder: 800, perCustomer: 3, note: "Free delivery over ৳800" },
      { code: "COMEBACK50", type: "FIXED", value: 50, minOrder: 400, perCustomer: 1, note: "Win-back offer for at-risk customers" },
    ],
  });
  console.log("✓ Catalog, delivery areas, supplies, riders and coupons created");
}

// ───────────────────────────── DEMO DATA ─────────────────────────────
const FIRST = ["Nusrat", "Tanvir", "Farzana", "Rafiq", "Sabrina", "Imran", "Ayesha", "Mahmud", "Sadia", "Arif", "Tasnim", "Shakil", "Mitu", "Kamrul", "Rumana", "Fahim", "Nadia", "Sajid", "Lamia", "Rashed", "Sharmin", "Zahid", "Tania", "Habib", "Jannat", "Rakib", "Munira", "Asif", "Shirin", "Nayeem", "Faria", "Jubayer", "Sumaiya", "Mehedi", "Afroza", "Tarek", "Priya", "Anik", "Moumita", "Sourav"];
const LAST = ["Rahman", "Hossain", "Ahmed", "Islam", "Chowdhury", "Khan", "Akter", "Sarkar", "Haque", "Uddin", "Begum", "Karim", "Siddique", "Mahmud", "Das", "Roy", "Kabir", "Alam"];
const STREETS = ["Road 27", "Road 8/A", "Lake Circus", "Satmasjid Road", "Road 11", "Block C, Road 5", "Sector 7, Road 14", "Avenue 3", "Gausul Azam Ave", "Shah Ali Bagh", "Green Road", "Kazi Nazrul Islam Ave"];

async function demo() {
  if (await db.order.count()) {
    console.log("• Orders already exist — skipping demo data");
    return;
  }
  const products = await db.product.findMany({ include: { variants: true } });
  const zones = await db.deliveryZone.findMany();
  const riders = await db.rider.findMany();
  const supplies = await db.supplyItem.findMany();
  const suppliers = await db.supplier.findMany();
  const sup = (name: string) => supplies.find((s) => s.name === name)!;
  const prod = (slug: string) => products.find((p) => p.slug === slug)!;

  const DAYS = 75;
  const start = addDays(today, -DAYS);

  // customers pool
  const customers: { id: string; phone: string; name: string; email: string; zone: (typeof zones)[number]; address: string; lat: number; lng: number }[] = [];
  const makeCustomer = async (created: Date) => {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const phone = `01${pick(["3", "5", "6", "7", "8", "9"])}${String(int(10000000, 99999999))}`;
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}${int(1, 99)}@example.com`;
    const zone = weighted(zones.map((z, i) => [z, i < 12 ? 3 : 1.4] as [typeof z, number]));
    const address = `House ${int(1, 120)}, ${pick(STREETS)}, ${zone.nameEn}`;
    const lat = 23.78 + between(-0.06, 0.08);
    const lng = 90.4 + between(-0.05, 0.05);
    const c = await db.customer.create({
      data: { name, phone, email, source: pick(["WEB", "WEB", "WEB", "FACEBOOK", "PHONE"]), hasAccount: rnd() < 0.35, createdAt: created, marketingOptIn: rnd() < 0.9 },
    });
    await db.address.create({ data: { customerId: c.id, line: address, zoneId: zone.id, lat, lng, isDefault: true, landmark: rnd() < 0.5 ? pick(["Near mosque", "Opposite school", "Beside pharmacy", "Lift 5th floor"]) : "" } });
    const row = { id: c.id, phone, name, email, zone, address, lat, lng };
    customers.push(row);
    return row;
  };

  const orderCounts = new Map<string, number>();
  let counter = 1000;
  const sold = new Map<string, Map<string, number>>(); // productId -> dayKey -> qty
  const addSold = (pid: string, d: Date, q: number) => {
    const m = sold.get(pid) ?? new Map();
    m.set(dateKey(d), (m.get(dateKey(d)) ?? 0) + q);
    sold.set(pid, m);
  };

  const regular = ["oyster-mushroom", "milky-mushroom", "button-mushroom", "sun-dried-oyster-mushroom", "mushroom-powder", "oyster-spawn-packet", "home-grow-kit"];
  const weights: Record<string, number> = { "oyster-mushroom": 50, "milky-mushroom": 22, "button-mushroom": 9, "sun-dried-oyster-mushroom": 6, "mushroom-powder": 5, "oyster-spawn-packet": 6, "home-grow-kit": 2 };
  const packCost = (v: { packagingItemId: string | null }) => supplies.find((s) => s.id === v.packagingItemId)?.avgCost ?? 0;

  for (let d = 0; d <= DAYS; d++) {
    const day = addDays(start, d);
    const age = DAYS - d; // 0 = today
    const dow = new Date(day.getTime() + 6 * HOUR).getUTCDay();
    const base = 2.2 + (d / DAYS) * 5.5 + (dow === 5 ? 2 : 0);
    const n = Math.max(0, Math.round(base + between(-1.5, 1.8)));
    for (let k = 0; k < n; k++) {
      const created = new Date(day.getTime() + between(8, 22) * HOUR);
      if (created > new Date()) continue;
      const repeatPool = customers.filter((c) => (orderCounts.get(c.id) ?? 0) > 0);
      const cust = rnd() < 0.4 || repeatPool.length < 5 ? await makeCustomer(new Date(created.getTime() - between(0, 2) * HOUR)) : pick(repeatPool);
      const isFirst = !orderCounts.get(cust.id);
      orderCounts.set(cust.id, (orderCounts.get(cust.id) ?? 0) + 1);

      // pre-order orders for specialty items (delivered on their harvest days)
      const isPre = rnd() < 0.1;
      const lines: { p: (typeof products)[number]; v: (typeof products)[number]["variants"][number]; qty: number }[] = [];
      if (isPre) {
        const p = prod(pick(["pink-oyster-mushroom", "pink-oyster-mushroom", "shiitake-mushroom", "lions-mane-mushroom"]));
        lines.push({ p, v: pick(p.variants), qty: int(1, 2) });
      } else {
        const count = weighted([[1, 55], [2, 33], [3, 12]] as [number, number][]);
        const used = new Set<string>();
        for (let j = 0; j < count; j++) {
          const slug = weighted(regular.map((s) => [s, weights[s]] as [string, number]));
          if (used.has(slug)) continue;
          used.add(slug);
          const p = prod(slug);
          const v = weighted(p.variants.map((vv, i) => [vv, i === 0 ? 5 : i === 1 ? 4 : 2] as [typeof vv, number]));
          lines.push({ p, v, qty: weighted([[1, 75], [2, 20], [3, 5]] as [number, number][]) });
        }
      }
      const subtotal = r2(lines.reduce((a, l) => a + l.v.price * l.qty, 0));
      const coupon = isFirst && rnd() < 0.18 && subtotal >= 300 ? "WELCOME10" : !isFirst && subtotal >= 800 && rnd() < 0.2 ? "FREEDEL" : "";
      const discount = coupon === "WELCOME10" ? r2(Math.min(100, subtotal * 0.1)) : 0;
      const deliveryCharge = coupon === "FREEDEL" || subtotal >= 1500 ? 0 : cust.zone.charge;
      const total = r2(subtotal - discount + deliveryCharge);
      const itemsCost = r2(lines.reduce((a, l) => a + l.p.costPerUnit * l.v.unitAmount * l.qty, 0));
      const packagingCost = r2(lines.reduce((a, l) => a + packCost(l.v) * l.qty, 0));
      const rider = weighted([[riders[0], 45], [riders[1], 40], [riders[2], 15]] as [(typeof riders)[number], number][]);

      // status by age
      let status = "DELIVERED";
      const roll = rnd();
      if (age >= 2) status = roll < 0.06 ? "CANCELLED" : roll < 0.085 ? "RETURNED" : "DELIVERED";
      else if (age === 1) status = roll < 0.85 ? "DELIVERED" : "OUT_FOR_DELIVERY";
      else status = weighted([["PENDING", 35], ["CONFIRMED", 30], ["PROCESSING", 15], ["OUT_FOR_DELIVERY", 12], ["DELIVERED", 8]] as [string, number][]);

      const deliveryDate = isPre ? startOfDay(addDays(created, int(2, 5))) : startOfDay(new Date(created.getTime() + (new Date(created.getTime() + 6 * HOUR).getUTCHours() < 12 ? 0 : 20 * HOUR)));
      let deliveredAt: Date | null = status === "DELIVERED" || status === "RETURNED" ? new Date(Math.max(deliveryDate.getTime() + between(11, 20) * HOUR, created.getTime() + 3 * HOUR)) : null;
      if (deliveredAt && deliveredAt > new Date()) deliveredAt = new Date(Math.min(Date.now() - 600_000, created.getTime() + 4 * HOUR));
      const cancelled = status === "CANCELLED";
      const packed = !cancelled && status !== "PENDING" && status !== "CONFIRMED";
      const stockDeducted = !isPre || packed;
      const orderNo = `FB${++counter}`;
      const source = cust && rnd() < 0.7 ? "WEB" : pick(["FACEBOOK", "FACEBOOK", "PHONE", "WHATSAPP"]);

      const evts: { status: string; createdAt: Date; note: string }[] = [{ status: "PENDING", createdAt: created, note: `Order placed via ${source.toLowerCase()}` }];
      if (status !== "PENDING") {
        if (cancelled) evts.push({ status: "CANCELLED", createdAt: new Date(created.getTime() + 2 * HOUR), note: pick(["Customer not reachable", "Customer changed mind", "Duplicate order"]) });
        else {
          evts.push({ status: "CONFIRMED", createdAt: new Date(created.getTime() + 0.5 * HOUR), note: "Confirmed by phone" });
          if (["PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"].includes(status)) evts.push({ status: "PROCESSING", createdAt: new Date((deliveredAt ?? new Date()).getTime() - 4 * HOUR), note: "" });
          if (["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"].includes(status)) evts.push({ status: "OUT_FOR_DELIVERY", createdAt: new Date((deliveredAt ?? new Date()).getTime() - 1.5 * HOUR), note: rider.name });
          if (status === "DELIVERED") evts.push({ status: "DELIVERED", createdAt: deliveredAt!, note: "" });
          if (status === "RETURNED") evts.push({ status: "RETURNED", createdAt: deliveredAt!, note: "Customer refused at door · Items not restocked (counted as loss)" });
        }
      }

      const o = await db.order.create({
        data: {
          orderNo,
          type: isPre ? "PREORDER" : "REGULAR",
          status,
          source,
          customerId: cust.id,
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          zoneId: cust.zone.id,
          zoneName: `${cust.zone.nameBn} · ${cust.zone.nameEn}`,
          addressLine: cust.address,
          lat: cust.lat,
          lng: cust.lng,
          deliveryDate,
          deliverySlot: pick(["সকাল ১০টা – দুপুর ১টা (10AM–1PM)", "দুপুর ২টা – বিকাল ৫টা (2PM–5PM)", "সন্ধ্যা ৬টা – রাত ৯টা (6PM–9PM)"]),
          subtotal,
          discount,
          couponCode: coupon,
          deliveryCharge,
          total,
          itemsCost: status === "RETURNED" ? itemsCost : itemsCost,
          packagingCost: packed || status === "RETURNED" ? packagingCost : 0,
          deliveryCost: cancelled ? 0 : rider.costPerDelivery,
          riderId: cancelled || status === "PENDING" || status === "CONFIRMED" ? null : rider.id,
          stockDeducted: cancelled ? false : stockDeducted,
          packed,
          paymentStatus: status === "DELIVERED" ? "PAID" : "UNPAID",
          paidAt: status === "DELIVERED" ? deliveredAt : null,
          collectedAmount: status === "DELIVERED" ? total : 0,
          createdAt: created,
          confirmedAt: status !== "PENDING" && !cancelled ? new Date(created.getTime() + 0.5 * HOUR) : null,
          deliveredAt: status === "DELIVERED" ? deliveredAt : null,
          returnedAt: status === "RETURNED" ? deliveredAt : null,
          cancelledAt: cancelled ? new Date(created.getTime() + 2 * HOUR) : null,
          cancelReason: cancelled ? evts[1].note : "",
          items: {
            create: lines.map((l) => ({
              productId: l.p.id,
              variantId: l.v.id,
              nameEn: l.p.nameEn,
              nameBn: l.p.nameBn,
              variantLabel: `${l.v.labelBn} · ${l.v.labelEn}`,
              unitAmount: l.v.unitAmount,
              qty: l.qty,
              unitPrice: l.v.price,
              unitCost: r2(l.p.costPerUnit * l.v.unitAmount),
              lineTotal: r2(l.v.price * l.qty),
              isPreorder: isPre,
            })),
          },
          events: { create: evts.map((e) => ({ ...e, by: e.status === "PENDING" ? "customer" : "FungiBd Owner" })) },
        },
      });
      // stock out (not for cancelled / un-fulfilled pre-orders)
      if (!cancelled && stockDeducted) {
        for (const l of lines) {
          const qty = r3(l.v.unitAmount * l.qty);
          addSold(l.p.id, created, qty);
          await db.stockMovement.create({ data: { productId: l.p.id, change: -qty, reason: isPre ? "PREORDER_FULFIL" : "ORDER", unitCost: l.p.costPerUnit, refId: o.id, note: orderNo, createdAt: created } });
        }
      }
      if (isPre && !stockDeducted && !cancelled) {
        for (const l of lines) await db.product.update({ where: { id: l.p.id }, data: { preorderBooked: { increment: r3(l.v.unitAmount * l.qty) } } });
      }
      if (packed || status === "RETURNED") {
        for (const l of lines)
          if (l.v.packagingItemId)
            await db.supplyUsage.create({ data: { supplyItemId: l.v.packagingItemId, qty: l.qty, unitCost: packCost(l.v), totalCost: r2(packCost(l.v) * l.qty), reason: "PACKAGING", orderId: o.id, date: created, note: orderNo } });
      }
    }
  }
  await db.counter.upsert({ where: { key: "order" }, create: { key: "order", value: counter }, update: { value: counter } });
  console.log(`✓ ${counter - 1000} demo orders, ${customers.length} customers`);

  // ── Production batches + daily harvests (fresh products) ──
  const growDefs: { slug: string; every: number; bags: number; yieldPerBag: number; perBag: [string, number][]; extra: number; firstHarvestAfter: number }[] = [
    { slug: "oyster-mushroom", every: 7, bags: 40, yieldPerBag: 0.42, perBag: [["Oyster spawn packet", 1], ["Rice straw", 1.6], ["Polybag 12×18", 1], ["Lime (chun)", 0.04]], extra: 300, firstHarvestAfter: 21 },
    { slug: "milky-mushroom", every: 10, bags: 24, yieldPerBag: 0.48, perBag: [["Oyster spawn packet", 1.2], ["Rice straw", 1.8], ["Polybag 12×18", 1], ["Lime (chun)", 0.05], ["Wheat bran", 0.08]], extra: 250, firstHarvestAfter: 28 },
    { slug: "button-mushroom", every: 21, bags: 16, yieldPerBag: 0.6, perBag: [["Rice straw", 3], ["Wheat bran", 0.2], ["Lime (chun)", 0.1], ["Polybag 12×18", 1]], extra: 500, firstHarvestAfter: 30 },
    { slug: "pink-oyster-mushroom", every: 14, bags: 6, yieldPerBag: 0.35, perBag: [["Oyster spawn packet", 1], ["Sawdust", 1.5], ["Polybag 12×18", 1]], extra: 80, firstHarvestAfter: 18 },
    { slug: "shiitake-mushroom", every: 30, bags: 4, yieldPerBag: 0.3, perBag: [["Sawdust", 2], ["Wheat bran", 0.3], ["Polybag 12×18", 1]], extra: 120, firstHarvestAfter: 45 },
    { slug: "lions-mane-mushroom", every: 30, bags: 3, yieldPerBag: 0.25, perBag: [["Sawdust", 2], ["Wheat bran", 0.3], ["Polybag 12×18", 1]], extra: 120, firstHarvestAfter: 40 },
  ];
  const usageTotals = new Map<string, number>();
  let batchNo = 100;
  for (const g of growDefs) {
    const p = prod(g.slug);
    const batches: { id: string; start: Date }[] = [];
    for (let d = -DAYS - g.firstHarvestAfter; d <= 0; d += g.every) {
      const startDate = addDays(today, d);
      const status = d > -g.firstHarvestAfter ? "GROWING" : d > -g.firstHarvestAfter - 28 ? "HARVESTING" : "COMPLETED";
      const b = await db.productionBatch.create({
        data: {
          code: `B-${++batchNo}`,
          productId: p.id,
          startDate,
          expectedHarvest: addDays(startDate, g.firstHarvestAfter),
          bagCount: g.bags,
          substrate: g.perBag.map(([n]) => n).join(", "),
          status: rnd() < 0.04 ? "FAILED" : status,
          extraCost: g.extra,
          note: status === "GROWING" ? "Spawn running well" : "",
        },
      });
      batches.push({ id: b.id, start: startDate });
      for (const [name, per] of g.perBag) {
        const s = sup(name);
        const qty = r3(per * g.bags);
        usageTotals.set(s.id, (usageTotals.get(s.id) ?? 0) + qty);
        await db.supplyUsage.create({ data: { supplyItemId: s.id, qty, unitCost: s.avgCost, totalCost: r2(qty * s.avgCost), reason: "PRODUCTION", batchId: b.id, date: startDate, note: b.code } });
      }
    }
    // daily harvest ≈ sales + buffer; spoilage weekly
    const soldMap = sold.get(p.id) ?? new Map();
    let stock = 0;
    for (let d = 0; d <= DAYS; d++) {
      const day = addDays(start, d);
      const need = soldMap.get(dateKey(day)) ?? 0;
      const target = g.slug === "oyster-mushroom" ? 14 : g.slug === "milky-mushroom" ? 5 : g.slug === "button-mushroom" ? 0 : 0;
      let qty = r3(Math.max(0, need - stock + target * between(0.4, 0.8)));
      if (g.slug === "button-mushroom" && d % 7 !== 0) qty = r3(Math.max(0, need - stock));
      if (qty > 0) {
        const batch = [...batches].reverse().find((b) => addDays(b.start, g.firstHarvestAfter) <= day) ?? batches[0];
        const h = await db.harvest.create({ data: { productId: p.id, batchId: batch.id, date: new Date(day.getTime() + 6 * HOUR), qty, wasteQty: r3(qty * between(0.02, 0.06)), grade: rnd() < 0.85 ? "A" : "B" } });
        await db.stockMovement.create({ data: { productId: p.id, change: qty, reason: "HARVEST", unitCost: p.costPerUnit, refId: h.id, createdAt: new Date(day.getTime() + 6 * HOUR) } });
        stock += qty;
      }
      stock -= need;
      if (d % 6 === 3 && stock > 2 && (g.slug === "oyster-mushroom" || g.slug === "milky-mushroom")) {
        const spoil = r3(between(0.3, 1.1));
        stock -= spoil;
        await db.stockMovement.create({ data: { productId: p.id, change: -spoil, reason: "SPOILAGE", unitCost: p.costPerUnit, note: "Over-ripe, not sellable", createdAt: new Date(day.getTime() + 20 * HOUR) } });
      }
    }
    const finalStock = g.slug === "oyster-mushroom" ? 16.5 : g.slug === "milky-mushroom" ? 4.75 : 0;
    const diff = r3(finalStock - stock);
    if (Math.abs(diff) > 0.001) {
      const h = await db.harvest.create({ data: { productId: p.id, batchId: batches[batches.length - 1].id, date: new Date(today.getTime() + 6 * HOUR), qty: Math.max(diff, 0), grade: "A" } });
      await db.stockMovement.create({ data: { productId: p.id, change: diff, reason: diff > 0 ? "HARVEST" : "ADJUST", unitCost: p.costPerUnit, refId: h.id, note: "Morning harvest" } });
    }
    await db.product.update({ where: { id: p.id }, data: { stockQty: finalStock } });

    // production cost per kg from batches (same formula the app uses)
    if (p.costMode === "AUTO") {
      const bs = await db.productionBatch.findMany({ where: { productId: p.id, status: { not: "FAILED" } }, orderBy: { startDate: "desc" }, take: 6, include: { harvests: true, usages: true } });
      let cost = 0;
      let kg = 0;
      for (const b of bs) {
        const hk = b.harvests.reduce((a, h) => a + h.qty, 0);
        if (hk <= 0) continue;
        cost += b.usages.reduce((a, u) => a + u.totalCost, 0) + b.extraCost;
        kg += hk;
      }
      if (kg > 0) await db.product.update({ where: { id: p.id }, data: { costPerUnit: r2(cost / kg) } });
    }
  }
  // non-fresh stock levels (simple)
  for (const [slug, q] of [["sun-dried-oyster-mushroom", 2.6], ["mushroom-powder", 22], ["oyster-spawn-packet", 96], ["home-grow-kit", 11]] as [string, number][]) {
    const p = prod(slug);
    await db.product.update({ where: { id: p.id }, data: { stockQty: q } });
    await db.stockMovement.create({ data: { productId: p.id, change: q, reason: "ADJUST", unitCost: p.costPerUnit, note: "Opening stock count", createdAt: start } });
  }

  // ── Supply purchases to cover usage (+ healthy stock) ──
  const packUsage = await db.supplyUsage.groupBy({ by: ["supplyItemId"], where: { reason: "PACKAGING" }, _sum: { qty: true } });
  for (const pu of packUsage) usageTotals.set(pu.supplyItemId, (usageTotals.get(pu.supplyItemId) ?? 0) + (pu._sum.qty ?? 0));
  for (const s of supplies) {
    const used = usageTotals.get(s.id) ?? 0;
    const finalQty = s.reorderLevel * between(0.6, 2.2);
    const totalBuy = used + finalQty;
    const lots = Math.max(1, Math.round(DAYS / 15));
    for (let i = 0; i < lots; i++) {
      const qty = r3(totalBuy / lots);
      const unitCost = r2(s.avgCost * between(0.94, 1.08));
      await db.supplyPurchase.create({
        data: { supplyItemId: s.id, supplierId: s.category === "PACKAGING" ? suppliers[2].id : s.name.includes("spawn") ? suppliers[0].id : suppliers[1].id, qty, unitCost, totalCost: r2(qty * unitCost), date: addDays(start, -20 + i * 15) },
      });
    }
    await db.supplyItem.update({ where: { id: s.id }, data: { stockQty: r3(finalQty) } });
  }
  // a bit of wasted supplies
  await db.supplyUsage.create({ data: { supplyItemId: sup("Kraft box 250 g").id, qty: 12, unitCost: 9, totalCost: 108, reason: "WASTE", date: addDays(today, -9), note: "Water damaged in rain" } });

  // ── Expenses ──
  for (let m = -3; m <= 0; m++) {
    const monthStart = new Date(Date.UTC(new Date(today.getTime() + 6 * HOUR).getUTCFullYear(), new Date(today.getTime() + 6 * HOUR).getUTCMonth() + m, 1) - 6 * HOUR);
    const add = async (dayOfMonth: number, category: string, amount: number, paidTo: string, note = "", method = "CASH") => {
      const date = addDays(monthStart, dayOfMonth - 1);
      if (date > new Date() || date < start) return;
      await db.expense.create({ data: { category, amount, date, paidTo, note, method } });
    };
    await add(1, "RENT", 8000, "Farm landlord", "Farm shed rent", "BANK");
    await add(5, "SALARY", 9000, "Farm worker", "Monthly salary");
    await add(5, "SALARY", 7000, "Packing assistant", "Monthly salary", "BKASH");
    await add(10, "UTILITIES", r2(between(1800, 2600)), "DESCO", "Electricity — humidifier & fans", "BKASH");
    await add(11, "UTILITIES", 650, "WASA", "Water");
    await add(12, "FEES", 1200, "ISP", "Internet", "BKASH");
    await add(3, "MARKETING", r2(between(1200, 2000)), "Meta (Facebook ads)", "Boosted posts", "CARD");
    await add(18, "MARKETING", r2(between(800, 1500)), "Meta (Facebook ads)", "Harvest campaign", "CARD");
    for (const w of [2, 16]) await add(w, "TRANSPORT", r2(between(500, 800)), "Fuel", "Delivery bike fuel");
    if (m === -1) await add(14, "MAINTENANCE", 2800, "Electrician", "Humidifier repair");
    if (m === -2) await add(20, "EQUIPMENT", 6500, "Hardware shop", "New shelving racks", "BANK");
  }

  // ── Customer stats ──
  for (const c of customers) {
    const all = await db.order.aggregate({ where: { customerId: c.id, status: { notIn: ["CANCELLED", "RETURNED"] } }, _count: { _all: true }, _min: { createdAt: true }, _max: { createdAt: true } });
    const del = await db.order.aggregate({ where: { customerId: c.id, status: "DELIVERED" }, _sum: { total: true } });
    await db.customer.update({
      where: { id: c.id },
      data: { totalOrders: all._count._all, totalSpent: r2(del._sum.total ?? 0), firstOrderAt: all._min.createdAt, lastOrderAt: all._max.createdAt, tags: all._count._all >= 5 ? "vip" : "" },
    });
  }
  await db.coupon.update({ where: { code: "WELCOME10" }, data: { usedCount: await db.order.count({ where: { couponCode: "WELCOME10" } }) } });
  await db.coupon.update({ where: { code: "FREEDEL" }, data: { usedCount: await db.order.count({ where: { couponCode: "FREEDEL" } }) } });

  // ── Customer interactions ──
  for (const c of customers.slice(0, 12)) {
    await db.activity.create({ data: { customerId: c.id, type: pick(["CALL", "WHATSAPP", "NOTE"]), summary: pick(["Asked about weekly subscription", "Prefers evening delivery", "Loved the milky mushroom", "Wants bigger pack for family"]), by: "FungiBd Owner", createdAt: addDays(today, -int(1, 30)) } });
  }

  // ── Leads ──
  const leadDefs: [string, string, string, string, string, number, string, number | null][] = [
    ["Chef Arman", "Spice Route Restaurant", "RESTAURANT", "WHOLESALE_FORM", "NEGOTIATION", 28000, "8 kg oyster per week for pasta & soups", 1],
    ["Tahmina Sultana", "", "RETAIL", "HARVEST_ALERT", "NEW", 0, "Notify about pink oyster harvest", null],
    ["Golam Mostofa", "Green Basket Superstore", "DISTRIBUTOR", "PHONE", "QUALIFIED", 45000, "Shelf space at 3 outlets", 2],
    ["Sanjida Rahman", "", "RETAIL", "FACEBOOK", "CONTACTED", 1500, "Asked for weekly delivery in Uttara", 0],
    ["Hotel Lakeview", "Hotel Lakeview Banani", "RESTAURANT", "WHOLESALE_FORM", "NEW", 35000, "Buffet — mixed mushrooms", 0],
    ["Masud Parvez", "Daily Fresh Online", "DISTRIBUTOR", "REFERRAL", "WON", 22000, "Reseller — oyster & milky", null],
    ["Farhana Akter", "", "RETAIL", "WEBSITE", "LOST", 800, "Outside Dhaka (Gazipur)", null],
    ["Café Bean & Leaf", "Café Bean & Leaf", "RESTAURANT", "EVENT", "CONTACTED", 12000, "Mushroom sandwich menu", 3],
    ["Rezaul Karim", "", "WHOLESALE", "PHONE", "QUALIFIED", 18000, "Wants spawn packets for his own farm", -1],
    ["Nabila Hasan", "", "RETAIL", "HARVEST_ALERT", "NEW", 0, "Shiitake pre-order alert", null],
    ["Kitchen by Mitu", "Kitchen by Mitu (home kitchen)", "RESTAURANT", "FACEBOOK", "NEGOTIATION", 9000, "Frozen mushroom momo", 2],
    ["Dhaka Agro Fair", "Dhaka Agro Fair 2026", "OTHER", "EVENT", "NEW", 0, "Stall invitation", 5],
  ];
  for (const [name, company, type, source, status, estValue, interest, follow] of leadDefs) {
    const l = await db.lead.create({
      data: {
        name,
        company,
        type,
        source,
        status,
        estValue,
        interest,
        phone: `017${int(10000000, 99999999)}`,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        message: interest,
        nextFollowUp: follow == null ? null : addDays(today, follow),
        assignedTo: "FungiBd Owner",
        lostReason: status === "LOST" ? "Outside delivery area" : "",
        createdAt: addDays(today, -int(1, 40)),
      },
    });
    if (status !== "NEW")
      await db.activity.create({ data: { leadId: l.id, type: pick(["CALL", "WHATSAPP", "MEETING", "EMAIL"]), summary: pick(["Shared price list", "Sent samples", "Discussed weekly volume", "Follow-up call scheduled"]), by: "FungiBd Owner", createdAt: addDays(today, -int(1, 10)) } });
  }

  // ── Support tickets ──
  const ticketDefs: [string, string, string, string, string][] = [
    ["Delivery was late", "DELIVERY", "RESOLVED", "NORMAL", "My order came 2 hours after the slot. Mushrooms were fine though."],
    ["One box was damaged", "QUALITY", "OPEN", "HIGH", "The 500g box was crushed and some mushrooms were broken."],
    ["Can I change delivery address?", "ORDER", "PENDING", "NORMAL", "I placed an order but need it delivered to my office in Gulshan instead."],
    ["Weekly subscription?", "GENERAL", "OPEN", "LOW", "Do you have a weekly subscription for 1kg oyster every Friday?"],
    ["Bulk order for wedding", "WHOLESALE", "OPEN", "URGENT", "Need 25 kg oyster mushroom on 5th next month for a wedding event."],
    ["Great quality!", "FEEDBACK", "CLOSED", "LOW", "Best mushrooms in Dhaka. Very fresh. Thank you!"],
  ];
  let tno = 500;
  for (const [subject, category, status, priority, body] of ticketDefs) {
    const c = pick(customers);
    const t = await db.ticket.create({
      data: { ticketNo: `T${++tno}`, customerId: c.id, name: c.name, email: c.email, phone: c.phone, subject, category, status, priority, createdAt: addDays(today, -int(0, 12)), assignedTo: "FungiBd Owner" },
    });
    await db.ticketMessage.create({ data: { ticketId: t.id, from: "CUSTOMER", authorName: c.name, body, createdAt: t.createdAt } });
    if (status !== "OPEN")
      await db.ticketMessage.create({ data: { ticketId: t.id, from: "STAFF", authorName: "FungiBd Owner", body: "ধন্যবাদ জানানোর জন্য! আমরা বিষয়টি দেখছি। · Thanks for letting us know — we're on it.", createdAt: new Date(t.createdAt.getTime() + 2 * HOUR) } });
  }

  await db.campaign.create({
    data: {
      name: "Win-back — at-risk customers",
      subject: "আপনাকে মিস করছি! ৳৫০ ছাড় আপনার জন্য 🍄",
      body: "অনেক দিন আপনার অর্ডার পাইনি। এই সপ্তাহে খামারে দারুণ ফলন হয়েছে — COMEBACK50 কোড দিয়ে ৳৫০ ছাড় নিন।\n\nWe miss you! Use code COMEBACK50 for ৳50 off this week.",
      segment: "AT_RISK",
    },
  });
  await db.emailLog.createMany({
    data: [
      { to: "demo@example.com", subject: "Order FB1001 received", type: "ORDER_PLACED", status: "SKIPPED", error: "SMTP not configured" },
    ],
  });
  console.log("✓ Demo farm, finance, CRM and support data created");
}

essentials()
  .then(() => (DEMO ? demo() : undefined))
  .then(() => console.log(DEMO ? "Done (with demo data)." : "Done. Run with --demo to add sample data."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
