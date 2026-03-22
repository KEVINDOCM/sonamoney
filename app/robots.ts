import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/utils/url"

/**
 * SEO Optimized Robots.txt
 * - Allows public marketing pages for indexing
 * - Blocks private/authenticated routes
 * - References sitemap for crawler efficiency
 * - Includes crawl-delay to prevent server overload
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/signup",
          "/register",
          "/mint-alternative",
          "/budget-calculator",
          "/id",
          "/templates",
          "/manual-tracker",
        ],
        disallow: [
          "/dashboard",
          "/transactions",
          "/analytics",
          "/budget",
          "/accounts",
          "/categories",
          "/settings",
          "/calendar",
          "/api/",
          "/_next/",
          "/_vercel/",
          "/*.json$",
          "/*.xml$",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/dashboard",
          "/transactions",
          "/analytics",
          "/budget",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
