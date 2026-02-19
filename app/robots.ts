import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
      crawlDelay: 0.01,
    },
    sitemap: "https://signa-moz.vercel.app/sitemap.xml",
  };
}
