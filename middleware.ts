import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createHash } from "crypto"

// ============================================
// CRITICAL: ADMIN IP WHITELIST
// Set MAINTENANCE_ADMIN_IPS in env (comma-separated)
// Example: MAINTENANCE_ADMIN_IPS=192.168.1.1,10.0.0.5
// ============================================
const getAdminIPs = (): string[] => {
  const envIPs = process.env.MAINTENANCE_ADMIN_IPS
  if (!envIPs) return []
  return envIPs.split(",").map(ip => ip.trim()).filter(Boolean)
}

// ============================================
// SECURITY LOGGING
// ============================================
interface SecurityLogEntry {
  timestamp: string
  ip: string
  ipHash: string
  path: string
  userAgent: string
  event: "POTENTIAL_BYPASS_ATTEMPT" | "MAINTENANCE_BLOCK" | "ADMIN_ACCESS" | "IP_BLOCKED" | "SUSPICIOUS_ACTIVITY"
  details?: string
  anonymizerMarkers?: string[]
}

function logSecurityEvent(entry: SecurityLogEntry): void {
  const logLine = `[SECURITY] ${entry.timestamp} | ${entry.event} | IP_HASH: ${entry.ipHash} | IP: ${entry.ip} | Path: ${entry.path}${entry.anonymizerMarkers?.length ? ` | Markers: ${entry.anonymizerMarkers.join(",")}` : ""}${entry.details ? ` | ${entry.details}` : ""}`
  console.error(logLine)
}

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

// ============================================
// AUTH ENDPOINT RATE LIMITER
// 10 requests per 15 minutes per IP for auth endpoints
// ============================================
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const AUTH_RATE_LIMIT = 10
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = authRateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= AUTH_RATE_LIMIT) return false
  entry.count++
  return true
}

interface MiddlewareRequest {
  url: string
  nextUrl: {
    pathname: string
  }
  headers: {
    get: (name: string) => string | null
  }
  cookies: {
    get: (name: string) => { value?: string } | undefined
    set: (name: string, value: string) => void
  }
}

/**
 * Extract client IP using industry-standard header priority
 * Order: CF-Connecting-IP > True-Client-IP > X-Forwarded-For > X-Real-IP
 */
function extractClientIP(headers: { get: (name: string) => string | null }): string {
  // Priority 1: Cloudflare
  const cfIP = headers.get("cf-connecting-ip")
  if (cfIP && isValidIP(cfIP)) return cfIP.trim()
  
  // Priority 2: Akamai/Enterprise
  const trueClient = headers.get("true-client-ip")
  if (trueClient && isValidIP(trueClient)) return trueClient.trim()
  
  // Priority 3: Standard proxy chain (take first valid non-private IP)
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim())
    for (const ip of ips) {
      if (isValidIP(ip) && !isPrivateIP(ip)) {
        return ip
      }
    }
  }
  
  // Priority 4: Nginx/Apache
  const realIP = headers.get("x-real-ip")
  if (realIP && isValidIP(realIP)) return realIP.trim()
  
  return "unknown"
}

/**
 * Validate IPv4 and IPv6 addresses
 */
function isValidIP(ip: string): boolean {
  if (!ip || ip === "unknown") return false
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  if (ipv4Regex.test(ip)) return true
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  if (ipv6Regex.test(ip)) return true
  
  return false
}

/**
 * Check if IP is private/internal (RFC 1918)
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,                           // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^127\./,                          // 127.0.0.0/8 (loopback)
    /^169\.254\./,                    // 169.254.0.0/16 (link-local)
    /^::1$/,                           // IPv6 loopback
    /^fc00:/,                          // IPv6 ULA
    /^fe80:/,                          // IPv6 link-local
  ]
  return privateRanges.some(range => range.test(ip))
}

/**
 * Hash IP for secure comparison (prevents timing attacks)
 */
function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex")
}

/**
 * Securely check if IP is admin using hashed comparison
 */
function checkIsAdminIP(ip: string): boolean {
  const envIPs = process.env.MAINTENANCE_ADMIN_IPS
  if (!envIPs) return false
  
  const adminHashes = new Set(
    envIPs.split(",").map(ip => ip.trim()).filter(isValidIP).map(hashIP)
  )
  
  return adminHashes.has(hashIP(ip))
}

// ============================================
// FAILED ATTEMPT TRACKING & TEMPORARY BLOCKING
// ============================================
interface FailedAttemptEntry {
  count: number
  firstAttempt: number
  blocked: boolean
  blockExpires?: number
}

const failedAttempts = new Map<string, FailedAttemptEntry>()
const MAX_FAILED_ATTEMPTS = 5
const BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000   // 5 minutes

function recordFailedAttempt(ip: string, reason: string): void {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  
  if (!entry || now - entry.firstAttempt > ATTEMPT_WINDOW_MS) {
    failedAttempts.set(ip, {
      count: 1,
      firstAttempt: now,
      blocked: false
    })
  } else {
    entry.count++
    
    if (entry.count >= MAX_FAILED_ATTEMPTS && !entry.blocked) {
      entry.blocked = true
      entry.blockExpires = now + BLOCK_DURATION_MS
      console.error(`[SECURITY] IP ${ip} BLOCKED for ${BLOCK_DURATION_MS/60000}m: ${reason}`)
    }
  }
}

function isBlocked(ip: string): boolean {
  const entry = failedAttempts.get(ip)
  if (!entry) return false
  
  const now = Date.now()
  
  if (entry.blocked && entry.blockExpires && now > entry.blockExpires) {
    failedAttempts.delete(ip)
    return false
  }
  
  return entry.blocked
}

// ============================================
// VPN / PROXY / TOR DETECTION
// ============================================
function detectAnonymizer(headers: { get: (name: string) => string | null }): string[] {
  const markers: string[] = []
  
  if (headers.get("via")?.toLowerCase().includes("vpn")) markers.push("VPN_HEADER")
  if (headers.get("forwarded")) markers.push("FORWARDED_HEADER")
  
  const ua = headers.get("user-agent") || ""
  if (/tor/i.test(ua)) markers.push("TOR_UA")
  if (/vpn/i.test(ua)) markers.push("VPN_UA")
  
  const cfBotScore = headers.get("cf-bot-management-score")
  if (cfBotScore && parseInt(cfBotScore) < 30) markers.push("LOW_BOT_SCORE")
  
  return markers
}

// ============================================
// TOTAL LOCKDOWN MIDDLEWARE
// ============================================
export async function middleware(request: MiddlewareRequest) {
  const { pathname } = request.nextUrl
  const requestUrl = request.url
  
  // Extract IP using industry-standard method
  const ip = extractClientIP(request.headers)
  const userAgent = request.headers.get("user-agent") ?? "unknown"
  const anonymizerMarkers = detectAnonymizer(request.headers)
  
  // Check if IP is temporarily blocked
  if (isBlocked(ip)) {
    return new Response(
      JSON.stringify({ error: "Access temporarily blocked due to suspicious activity" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
  
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
  const isAdminIP = checkIsAdminIP(ip)
  
  const isMaintenancePage = pathname === "/maintenance"
  const isApiRoute = pathname.startsWith("/api/")
  
  // ============================================
  // MAINTENANCE MODE: TOTAL LOCKDOWN
  // ============================================
  if (isMaintenanceMode) {
    // Admin IPs get full access
    if (isAdminIP) {
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        ip,
        ipHash: hashIP(ip),
        path: pathname,
        userAgent,
        event: "ADMIN_ACCESS",
        anonymizerMarkers,
        details: "Admin IP bypassed maintenance lockdown"
      })
      // Continue to normal processing
    } else {
      // TOTAL LOCKDOWN for public IPs
      
      // 1. BLOCK ALL API ROUTES with 503
      if (isApiRoute) {
        recordFailedAttempt(ip, "API access during maintenance")
        
        logSecurityEvent({
          timestamp: new Date().toISOString(),
          ip,
          ipHash: hashIP(ip),
          path: pathname,
          userAgent,
          event: "POTENTIAL_BYPASS_ATTEMPT",
          anonymizerMarkers,
          details: `API ${pathname} blocked during maintenance`
        })
        
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
      
      // 2. Allow maintenance page only
      if (isMaintenancePage) {
        return NextResponse.next()
      }
      
      // 3. SERVE MAINTENANCE PAGE (return HTML directly, not redirect)
      // This prevents URL manipulation - user sees /dashboard in URL but gets maintenance content
      logSecurityEvent({
        timestamp: new Date().toISOString(),
        ip,
        ipHash: hashIP(ip),
        path: pathname,
        userAgent,
        event: "MAINTENANCE_BLOCK",
        anonymizerMarkers,
        details: `Served maintenance page for ${pathname}`
      })
      
      const maintenanceHtml = `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Maintenance | SonaMoney</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1A1A2E 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #00B9A7 0%, #0099A0 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
      box-shadow: 0 20px 40px rgba(0, 185, 167, 0.3);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .logo svg {
      width: 40px;
      height: 40px;
      color: white;
      animation: spin 4s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 40px 32px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    h1 {
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      color: #9CA3AF;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .status {
      background: rgba(0, 185, 167, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .status svg {
      width: 20px;
      height: 20px;
      color: #00B9A7;
    }
    .status span {
      color: #00B9A7;
      font-weight: 600;
    }
    .progress {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-bar {
      height: 100%;
      width: 75%;
      background: linear-gradient(90deg, #00B9A7, #0099A0);
      border-radius: 3px;
      animation: progress 3s ease-in-out infinite;
    }
    @keyframes progress {
      0%, 100% { width: 60%; }
      50% { width: 85%; }
    }
    .progress-text {
      color: #6B7280;
      font-size: 12px;
    }
    .footer {
      color: #6B7280;
      font-size: 14px;
      margin-top: 24px;
    }
    .footer a {
      color: #00B9A7;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <div class="card">
      <h1>System Maintenance</h1>
      <p>We're performing scheduled maintenance to improve your experience. SonaMoney will be back shortly.</p>
      <div class="status">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Service Temporarily Unavailable</span>
      </div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
      <p class="progress-text">Maintenance in progress...</p>
    </div>
    <p class="footer">Need help? Contact <a href="mailto:support@sonamoney.my.id">support@sonamoney.my.id</a></p>
  </div>
</body>
</html>`
      
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
  
  // Normal mode: redirect away from maintenance page
  if (!isMaintenanceMode && isMaintenancePage) {
    return NextResponse.redirect(new URL("/", requestUrl))
  }

  // ============================================
  // STANDARD MIDDLEWARE (Rate limiting, auth)
  // ============================================
  maybeCleanup()

  if (!checkIpRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    )
  }

  const isAuthEndpoint = pathname === "/api/auth/login" || pathname === "/api/auth/register"
  const isSensitiveEndpoint = pathname === "/api/scan-receipt"

  if ((isSensitiveEndpoint || isAuthEndpoint) && !checkAuthRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "900" } }
    )
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

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ["/dashboard","/transactions","/analytics","/budget","/accounts","/categories","/settings","/calendar","/goals","/recurring","/reports","/debt","/notifications"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = pathname === "/login" || pathname === "/signup"

  if (isProtected && !user) {
    const loginUrl = new URL("/login", requestUrl)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl))
  }

  if (user) {
    (response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("Cache-Control", "no-store")
    ;(response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("Pragma", "no-cache")
  }

  ;(response as unknown as { headers: { set: (k: string, v: string) => void } }).headers.set("X-Content-Type-Options", "nosniff")

  return response
}

// ============================================
// MATCHER: ALL routes including API
// ============================================
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192.svg|icon-512.svg|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
}