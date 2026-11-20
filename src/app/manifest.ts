import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FungiBd — Farm-fresh mushrooms",
    short_name: "FungiBd",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EDDB",
    theme_color: "#02604A",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
