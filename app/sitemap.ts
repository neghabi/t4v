import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/siteUrl";

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
