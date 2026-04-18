import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Novakou — Plateforme des créateurs digitaux",
    short_name: "Novakou",
    description:
      "Vendez vos formations, e-books et sessions de coaching. La plateforme des créateurs digitaux en Afrique francophone.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#006e2f",
    lang: "fr",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
