import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "nodemailer"],
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  images: { unoptimized: false },
};

export default nextConfig;
