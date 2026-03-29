/**
 * Security logging utilities for middleware
 */

export type SecurityEvent = 
  | "POTENTIAL_BYPASS_ATTEMPT" 
  | "MAINTENANCE_BLOCK" 
  | "ADMIN_ACCESS" 
  | "IP_BLOCKED" 
  | "SUSPICIOUS_ACTIVITY" 
  | "CSRF_FAILURE" 
  | "RBAC_VIOLATION"

export interface SecurityLogEntry {
  timestamp: string
  ip: string
  ipHash: string
  path: string
  userAgent: string
  event: SecurityEvent
  details?: string
  anonymizerMarkers?: string[]
}

/**
 * Log security event to console
 */
export function logSecurityEvent(entry: SecurityLogEntry): void {
  const logLine = `[SECURITY] ${entry.timestamp} | ${entry.event} | IP_HASH: ${entry.ipHash} | IP: ${entry.ip} | Path: ${entry.path}${entry.anonymizerMarkers?.length ? ` | Markers: ${entry.anonymizerMarkers.join(",")}` : ""}${entry.details ? ` | ${entry.details}` : ""}`
  console.error(logLine)
}
