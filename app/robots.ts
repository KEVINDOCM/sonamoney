import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
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
    sitemap: "https://sonamoney.vercel.app/sitemap.xml",
  }
}
