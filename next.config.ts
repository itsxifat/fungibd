import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "nodemailer"],
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: { unoptimized: false },
  async headers() {
    return [
      "/account/:path*", "/admin/:path*", "/cart", "/checkout", "/track", "/order/:path*",
      "/support/ticket/:path*", "/review", "/unsubscribe", "/leaflet",
    ].map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex" }] }));
  },
};

export default nextConfig;
