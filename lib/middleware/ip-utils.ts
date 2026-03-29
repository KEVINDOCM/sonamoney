/**
 * IP extraction and validation utilities for middleware
 */

/**
 * Extract client IP using industry-standard header priority
 * Order: CF-Connecting-IP > True-Client-IP > X-Forwarded-For > X-Real-IP
 */
export function extractClientIP(headers: { get: (name: string) => string | null }): string {
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
export function isValidIP(ip: string): boolean {
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
export function isPrivateIP(ip: string): boolean {
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
 * Simple synchronous hash for Edge Runtime
 */
export function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  // Convert to hex string for readability
  return (hash >>> 0).toString(16).padStart(8, "0")
}

/**
 * Get admin IPs from environment
 */
export function getAdminIPs(): string[] {
  const envIPs = process.env.MAINTENANCE_ADMIN_IPS
  if (!envIPs) return []
  return envIPs.split(",").map(ip => ip.trim()).filter(Boolean)
}

/**
 * Securely check if IP is admin using hashed comparison
 */
export function checkIsAdminIP(ip: string): boolean {
  const envIPs = process.env.MAINTENANCE_ADMIN_IPS
  if (!envIPs) return false
  
  const adminHashes = new Set(
    envIPs.split(",").map(ip => ip.trim()).filter(isValidIP).map(hashIP)
  )
  
  return adminHashes.has(hashIP(ip))
}

/**
 * VPN / PROXY / TOR DETECTION
 */
export function detectAnonymizer(headers: { get: (name: string) => string | null }): string[] {
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
