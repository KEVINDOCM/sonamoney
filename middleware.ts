import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

// ============================================
// IN-MEMORY IP RATE LIMITER
// 60 requests per minute per IP
// Resets every minute
// ============================================

interface IpRateLimitEntry {
  count: number
  resetAt: number
}

const ipRateLimitMap = new Map<string, IpRateLimitEntry>()
const IP_RATE_LIMIT = 60
const IP_RATE_WINDOW_MS = 60 * 1000

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + IP_RATE_WINDOW_MS,
    })
    return true
  }

  if (entry.count >= IP_RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

// Clean up old entries every 100 requests
let cleanupCounter = 0
function maybeCleanup() {
  cleanupCounter++
  if (cleanupCounter < 100) return
  cleanupCounter = 0
  const now = Date.now()
  for (const [key, entry] of ipRateLimitMap.entries()) {
    if (now > entry.resetAt) {
      ipRateLimitMap.delete(key)
    }
  }
}

interface MiddlewareRequest {
  url: string
  nextUrl: {
    pathname: string
  }
  cookies: {
    get: (name: string) => { value?: string } | undefined
    set: (name: string, value: string) => void
  }
}

export async function middleware(request: MiddlewareRequest) {
  const { pathname } = request.nextUrl
  const requestUrl = request.url

  // IP-based rate limiting
  const ip =
    (request as { headers?: { get?: (h: string) => string | null } })
      .headers
      ?.get?.("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ?? "unknown"

  maybeCleanup()

  if (!checkIpRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    )
  }

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return request.cookies.get(name)?.value
        },
        set: (name: string, value: string, options: CookieOptions) => {
          request.cookies.set(name, value)
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          request.cookies.set(name, "")
          response.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = [
    "/dashboard",
    "/transactions",
    "/analytics",
    "/budget",
    "/accounts",
    "/categories",
    "/settings",
    "/calendar",
  ]

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )

  const isAuthPath =
    pathname === "/login" ||
    pathname === "/signup"

  if (isProtected && !user) {
    const loginUrl = new URL("/login", requestUrl)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(
      new URL("/dashboard", requestUrl)
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192.svg|icon-512.svg|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
}