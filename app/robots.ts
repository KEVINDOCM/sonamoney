import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/utils/url"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/register", "/mint-alternative", "/budget-calculator", "/id", "/templates", "/manual-tracker"],
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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
