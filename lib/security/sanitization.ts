// XSS and injection sanitization utilities

/**
 * Remove dangerous characters to prevent XSS and injection attacks
 * Removes: < > / \ ' " javascript: on* event handlers
 */
export function sanitizeXSS(input: string): string {
  if (!input) return input
  return input
    .replace(/[<>\\/]/g, "") // Remove < > \
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers (onclick=, etc.)
    .replace(/[\"']/g, "'") // Normalize quotes to single quote
    .trim()
}

/**
 * Sanitize HTML content - removes all HTML tags
 */
export function stripHtml(input: string): string {
  if (!input) return input
  return input.replace(/<[^>]*>/g, "").trim()
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return email
  return email.toLowerCase().trim().replace(/[^a-z0-9._%+-@]/g, "")
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return filename
  return filename
    .replace(/[\\/:*?"<>|]/g, "_") // Replace illegal chars
    .replace(/\.\./g, "_") // Prevent path traversal
    .trim()
}

/**
 * Escape special regex characters
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
