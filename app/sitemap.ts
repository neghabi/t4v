import type { MetadataRoute } from "next";

const SITE_URL = "https://t4v.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-08-17"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/api-docs`,
      lastModified: new Date("2026-08-17"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
