/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

const isProd = process.env.NODE_ENV === "production"

// Dynamic origin for CORS based on environment
const getOrigin = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 
         process.env.NEXT_PUBLIC_SITE_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
         "https://sonamoney.my.id"
}

// Allowed origins for strict CORS
const allowedOrigins = [
  "https://sonamoney.my.id",
  "https://www.sonamoney.my.id",
]

// Add development origins if not in production
if (!isProd) {
  allowedOrigins.push("http://localhost:3000")
}

// Add Vercel preview URLs if available
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
}

const securityHeaders = [
  // Prevent clickjacking - DENY is stronger than SAMEORIGIN
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // XSS Protection (legacy browsers)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Control referrer information
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable browser features not needed
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), xr-spatial-tracking=(self)"
  },
  // Cross-Origin policies
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "unsafe-none",
  },
  // HSTS — force HTTPS
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      // Default: only same origin
      "default-src 'self'",
      // Scripts: self + inline + Cloudflare Insights + Turnstile + challenge platform
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://cdn-cgi.challenges.cloudflare.com",
      // Styles: self + inline + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self + data URIs + Supabase storage + Cloudflare challenge
      "img-src 'self' data: blob: https://*.supabase.co https://challenges.cloudflare.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // API connections allowed
      "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://api.pwnedpasswords.com https://open.er-api.com https://api.frankfurter.app",
      // Frames: Turnstile requires iframe + challenge platform
      "frame-src https://challenges.cloudflare.com https://challenges.cloudflare.com/cdn-cgi/challenge-platform/",
      // Objects: none
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form submissions: self only
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests;" +
      "report-uri /api/csp-report",
    ].join("; "),
  },
  // Rate limit hint for clients
  {
    key: "X-RateLimit-Limit",
    value: "60",
  },
]

module.exports = withBundleAnalyzer(
  withPWA({
  turbopack: {},

  // Compress responses
  compress: true,

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Webpack config to disable console in production
  webpack: (config, { isServer }) => {
    if (isProd && !isServer) {
      // Strip console logs in production
      const TerserPlugin = require("terser-webpack-plugin")
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
        })
      )
    }
    return config
  },

  async headers() {
    const origin = getOrigin()
    
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "X-RateLimit-Limit",
            value: "60",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          // Strict CORS - only allow specific origins
          {
            key: "Access-Control-Allow-Origin",
            value: origin || allowedOrigins[0] || "https://sonamoney.my.id",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Request-Signature, X-Request-Timestamp",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          {
            key: "Vary",
            value: "Origin",
          },
        ],
      },
    ]
  },
})
)
