import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/utils/url"

/**
 * SEO Optimized Sitemap
 * - Priority based on business value and search intent
 * - ChangeFrequency based on content update patterns
 * - LastModified for freshness signals
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl()
  const currentDate = new Date()

  const routes = [
    { path: "", priority: 1.0, freq: "weekly" as const },
    { path: "/id", priority: 0.95, freq: "weekly" as const },
    { path: "/mint-alternative", priority: 0.9, freq: "weekly" as const },
    { path: "/budget-calculator", priority: 0.85, freq: "monthly" as const },
    { path: "/templates", priority: 0.8, freq: "monthly" as const },
    { path: "/manual-tracker", priority: 0.8, freq: "monthly" as const },
    { path: "/signup", priority: 0.7, freq: "yearly" as const },
    { path: "/register", priority: 0.7, freq: "yearly" as const },
    { path: "/login", priority: 0.6, freq: "yearly" as const },
  ]

  return routes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: freq,
    priority,
  }))
}
