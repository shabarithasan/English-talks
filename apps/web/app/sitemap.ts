import type { MetadataRoute } from "next";
import { marketingPages } from "../lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_MARKETING_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "business", "schools", "programs", "dashboard", "practice", "results", "subscriptions"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}/${route}`.replace(/\/$/, ""),
      lastModified: new Date(),
    })),
    ...marketingPages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(),
    })),
  ];
}
