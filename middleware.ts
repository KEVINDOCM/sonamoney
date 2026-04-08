import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import {
  checkGeneralRateLimit,
  checkAuthRateLimit,
  isBlocked,
  recordFailedAttempt,
} from "@/lib/security/rateLimiter"
import { requiresElevatedAccess, getCurrentUserRole } from "@/lib/security/rbac"
import { validateCSRFToken, requiresCSRFProtection, extractCSRFToken, generateCSRFToken } from "./lib/security/csrf"
import { extractClientIP, hashIP, checkIsAdminIP, detectAnonymizer } from "./lib/middleware/ip-utils"
import { logSecurityEvent } from "./lib/middleware/security-logger"
import { maintenanceHtml } from "./lib/middleware/maintenance-template"
import { getCachedSession, cacheSession } from "./lib/middleware/session-cache"
import type { MiddlewareRequest } from "./lib/middleware/types"

export async function middleware(request: MiddlewareRequest) {
  const { pathname } = request.nextUrl
  const requestUrl = request.url
  const hostname = request.headers.get("host") || ""
  const method = request.method || "GET"
  
  // Vercel canonical redirect (301 Permanent)
  if (
    hostname.endsWith(".vercel.app") &&
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("vercel.app")
  ) {
    const canonicalUrl = new URL(pathname, process.env.NEXT_PUBLIC_APP_URL)
    const currentUrl = new URL(requestUrl)
    canonicalUrl.search = currentUrl.search
    return new Response(null, {
      status: 301,
      headers: {
        Location: canonicalUrl.toString(),
      },
    })
  }
  
  // Extract IP and check security
  const ip = extractClientIP(request.headers)
  const userAgent = request.headers.get("user-agent") ?? "unknown"
  const anonymizerMarkers = detectAnonymizer(request.headers)
  
  // Check if IP is blocked - skip for static assets and health checks
  const isHealthCheck = pathname === "/api/health" || pathname === "/_next/static/"
  if (!isHealthCheck) {
    const blockStatus = await isBlocked(ip)
    if (blockStatus.blocked) {
      return new Response(
        JSON.stringify({ error: "Access temporarily blocked due to suspicious activity" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }
  }
  
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
  const isAdminIP = checkIsAdminIP(ip)
  const isMaintenancePage = pathname === "/maintenance"
  const isApiRoute = pathname.startsWith("/api/")
  
  // Maintenance mode handling
  if (isMaintenanceMode) {
    if (isAdminIP) {
      // Fire-and-forget logging for performance
      Promise.resolve().then(() => logSecurityEvent({
        timestamp: new Date().toISOString(),
        ip,
        ipHash: hashIP(ip),
        path: pathname,
        userAgent,
        event: "ADMIN_ACCESS",
        anonymizerMarkers,
        details: "Admin IP bypassed maintenance lockdown"
      })).catch(() => {/* silent fail */})
    } else {
      // Block API routes
      if (isApiRoute) {
        await recordFailedAttempt(ip, "API access during maintenance")
        // Async logging - don't block response
        Promise.resolve().then(() => logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip,
          ipHash: hashIP(ip),
          path: pathname,
          userAgent,
          event: "POTENTIAL_BYPASS_ATTEMPT",
          anonymizerMarkers,
          details: `API ${pathname} blocked during maintenance`
        })).catch(() => {/* silent fail */})
        return new Response(
          JSON.stringify({ 
            error: "Service Unavailable",
            message: "Under maintenance. Please try again later."
          }),
          {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "3600",
              "Cache-Control": "no-store"
            }
          }
        )
      }
      
      // Allow maintenance page
      if (isMaintenancePage) {
        return NextResponse.next()
      }
      
      // Serve maintenance page
      // Async logging - don't block response
      Promise.resolve().then(() => logSecurityEvent({
        timestamp: new Date().toISOString(),
        ip,
        ipHash: hashIP(ip),
        path: pathname,
        userAgent,
        event: "MAINTENANCE_BLOCK",
        anonymizerMarkers,
        details: `Served maintenance page for ${pathname}`
      })).catch(() => {/* silent fail */})
      
      return new Response(maintenanceHtml, {
        status: 503,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Retry-After": "3600"
        }
      })
    }
  }
  
  // Redirect away from maintenance page when not in maintenance mode
  if (!isMaintenanceMode && isMaintenancePage) {
    return NextResponse.redirect(new URL("/", requestUrl))
  }

  // Rate limiting - skip for health checks to improve monitoring response time
  const isTestEnv = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true"
  const isAuthEndpoint = pathname === "/api/auth/login" || pathname === "/api/auth/register"
  const isSensitiveEndpoint = pathname === "/api/scan-receipt"
  
  if (!isTestEnv && !isHealthCheck) {
    const generalLimit = await checkGeneralRateLimit(ip)
    if (!generalLimit.success) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { 
          "Content-Type": "application/json", 
          "Retry-After": String(Math.ceil((generalLimit.resetAt - Date.now()) / 1000))
        } }
      )
    }

    if (isSensitiveEndpoint || isAuthEndpoint) {
      const authLimit = await checkAuthRateLimit(ip)
      if (!authLimit.success) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(Math.ceil((authLimit.resetAt - Date.now()) / 1000))
          } }
        )
      }
    }
  }

  let response = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  // Check for cached session first (performance optimization)
  const sbAccessToken = request.cookies.get("sb-access-token")?.value
  let user: { id: string } | null = null
  
  if (sbAccessToken) {
    const cachedSession = await getCachedSession(sbAccessToken)
    if (cachedSession) {
      user = { id: cachedSession.userId }
    }
  }
  
  // If no cached session, verify with Supabase
  if (!user) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          request.cookies.set(name, value)
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          request.cookies.set(name, "")
          response.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    })

    const authResult = await supabase.auth.getUser()
    user = authResult.data.user as { id: string } | null
    
    // Cache the session for future requests
    if (user && sbAccessToken) {
      await cacheSession(sbAccessToken, { userId: user.id })
    }
  }
  
  if (isApiRoute && process.env.NODE_ENV === "development") {
    console.log(`[DEBUG] ${pathname} - User: ${user ? "authenticated" : "null"}`)
  }

  const protectedPaths = ["/dashboard","/transactions","/analytics","/budget","/accounts","/categories","/settings","/calendar","/goals","/recurring","/reports","/debt","/notifications"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = pathname === "/login" || pathname === "/signup"

  // CSRF Protection
  if (isApiRoute && requiresCSRFProtection(method) && !isAuthEndpoint) {
    if (!user) {
      const csrfToken = extractCSRFToken(request.headers)
      const validation = await validateCSRFToken(csrfToken)
      
      if (!validation.valid) {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip,
          ipHash: hashIP(ip),
          path: pathname,
          userAgent,
          event: "CSRF_FAILURE",
          anonymizerMarkers,
          details: `Unauthenticated request rejected: ${validation.reason}`
        })
        return new Response(
          JSON.stringify({ 
            error: "Authentication required or CSRF token missing",
            details: validation.reason
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
    }
  }

  // RBAC
  if (user) {
    const accessCheck = requiresElevatedAccess(pathname)
    if (accessCheck.required) {
      const userRole = await getCurrentUserRole()
      
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip,
          ipHash: hashIP(ip),
          path: pathname,
          userAgent,
          event: "RBAC_VIOLATION",
          anonymizerMarkers,
          details: `Non-admin user attempted to access admin path`
        })
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
      
      if (pathname.startsWith("/audit") && userRole !== "auditor" && userRole !== "admin") {
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip,
          ipHash: hashIP(ip),
          path: pathname,
          userAgent,
          event: "RBAC_VIOLATION",
          anonymizerMarkers,
          details: `Non-auditor user attempted to access auditor path`
        })
        return new Response(
          JSON.stringify({ error: "Auditor access required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // Set CSRF token cookie
    const csrfCookie = request.cookies.get("csrf_token")
    if (!csrfCookie) {
      const csrfToken = generateCSRFToken()
      response.cookies.set({
        name: "csrf_token",
        value: csrfToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 24 * 60 * 60
      })
    }
  }

  // Auth redirects
  if (isProtected && !user) {
    const loginUrl = new URL("/login", requestUrl)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl))
  }

  // Security headers
  if (user) {
    (response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("Cache-Control", "no-store")
    ;(response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("Pragma", "no-cache")
  }

  ;(response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("X-Content-Type-Options", "nosniff")

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192.svg|icon-512.svg|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
}
