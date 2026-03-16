import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
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
    sitemap: "https://sona-money.vercel.app/sitemap.xml",
  }
}
