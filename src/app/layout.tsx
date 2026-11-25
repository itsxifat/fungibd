import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Noto_Sans_Bengali, Tiro_Bangla } from "next/font/google";
import { getSettings, isHex } from "@/lib/settings";
import { defaultShareImage } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

export const dynamic = "force-dynamic";

// Tiro Bangla for headings and prices, Noto Sans Bengali for reading and UI — both draw Bangla and Latin.
const display = Tiro_Bangla({ subsets: ["bengali", "latin"], weight: "400", variable: "--font-tiro", display: "swap" });
const body = Noto_Sans_Bengali({ subsets: ["bengali", "latin"], variable: "--font-noto", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.store.name} — তাজা মাশরুম · Farm-fresh mushrooms in Dhaka`, template: `%s · ${s.store.name}` },
    description: `${s.store.taglineBn}। ${s.store.taglineEn}. Order online, delivered in Dhaka and nearby areas. Pre-order specialty mushrooms.`,
    openGraph: { type: "website", siteName: s.store.name, images: [defaultShareImage], locale: "bn_BD" },
    twitter: { card: "summary_large_image", images: [defaultShareImage] },
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = { themeColor: "#02604A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const b = s.brand;
  const vars = {
    ...(isHex(b.primary) ? { "--brand": b.primary } : {}),
    ...(isHex(b.accent) ? { "--tan": b.accent } : {}),
    ...(isHex(b.background) ? { "--cream": b.background } : {}),
    ...(isHex(b.ink) ? { "--ink": b.ink } : {}),
  } as CSSProperties;
  return (
    <html lang="bn" style={vars} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
