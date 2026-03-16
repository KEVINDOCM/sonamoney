import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/register"],
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
    sitemap: "https://sona-money.vercel.app/sitemap.xml",
  }
}
