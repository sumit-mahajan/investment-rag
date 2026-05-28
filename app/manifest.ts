import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: "Inv. RAG",
    description: siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    categories: ["finance", "productivity", "business"],
    icons: [
      {
        src: "/icon",
        type: "image/png",
        sizes: "32x32",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
    lang: "en-US",
  };
}
