// URL Utility - Centralized URL getter for consistency across the app
// This prevents hardcoded URLs and makes the app scalable across environments

/**
 * Validates that required environment variables are set in production
 * Logs warnings in development for missing optional variables
 */
function validateEnvVars(): void {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
  
  // In production, we strongly recommend setting an explicit URL
  if (isProd && !process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
    // Don't throw, but log a warning - we have fallbacks
    console.warn(
      "[ENV WARNING] Production environment detected but NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL is not set. " +
      "Falling back to VERCEL_URL or localhost. This may cause issues with redirects and metadata."
    )
  }
}

/**
 * Gets the site URL based on environment variables or defaults
 * Priority: NEXT_PUBLIC_APP_URL > NEXT_PUBLIC_SITE_URL > VERCEL_URL > localhost
 * 
 * @throws {Error} If URL format is invalid
 * @returns {string} Valid site URL with protocol
 */
export function getSiteUrl(): string {
  validateEnvVars()
  
  // Check for explicit app URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim()
    if (isValidUrl(url)) {
      return url
    }
    console.warn(`[ENV WARNING] Invalid NEXT_PUBLIC_APP_URL: ${url}`)
  }

  // Fall back to site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim()
    if (isValidUrl(url)) {
      return url
    }
    console.warn(`[ENV WARNING] Invalid NEXT_PUBLIC_SITE_URL: ${url}`)
  }

  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL.trim()}`
    if (isValidUrl(url)) {
      return url
    }
    console.warn(`[ENV WARNING] Invalid VERCEL_URL: ${url}`)
  }

  // Default to localhost for development
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000"
  }

  // Last resort fallback for production
  console.warn("[ENV WARNING] No valid URL environment variable found. Using fallback.")
  return "https://localhost:3000"
}

/**
 * Validates a URL string format
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  
  // Basic URL validation - must start with http:// or https://
  // or be a valid domain (which we'll prepend with https://)
  const hasProtocol = url.startsWith("http://") || url.startsWith("https://")
  const hasDomain = url.includes(".") || url === "localhost" || url.includes(":")
  
  return hasProtocol || hasDomain
}

/**
 * Gets the base URL for API requests or server-side rendering
 * Same logic as getSiteUrl but ensures https in production
 * 
 * @throws {Error} If resulting URL is invalid
 * @returns {string} Valid base URL with proper protocol
 */
export function getBaseUrl(): string {
  const url = getSiteUrl()
  
  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    // In production/Vercel, default to https
    if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
      return `https://${url}`
    }
    return `http://${url}`
  }

  return url
}

/**
 * Constructs a full URL from a path
 * @param path - The path to append (should start with /)
 * @returns Full URL with domain
 * @throws {Error} If resulting URL is invalid
 */
export function getUrl(path: string = ""): string {
  if (typeof path !== "string") {
    throw new Error(`[URL ERROR] Invalid path type: ${typeof path}. Expected string.`)
  }
  
  const baseUrl = getBaseUrl()
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const fullUrl = `${baseUrl}${cleanPath}`
  
  if (!isValidUrl(fullUrl)) {
    throw new Error(`[URL ERROR] Generated invalid URL: ${fullUrl}`)
  }
  
  return fullUrl
}

/**
 * Gets the origin for CORS headers
 * @returns {string} Valid origin URL
 */
export function getOrigin(): string {
  return getBaseUrl()
}

/**
 * Checks if the current environment is production
 * @returns {boolean} True if in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
}

/**
 * Gets the canonical URL for SEO purposes
 * @param path - Optional path segment
 * @returns {string} Valid canonical URL
 * @throws {Error} If URL generation fails
 */
export function getCanonicalUrl(path: string = ""): string {
  return getUrl(path)
}

/**
 * Safe URL getter that returns null instead of throwing
 * Use this when you need optional URL handling
 * @param path - Optional path
 * @returns {string | null} Valid URL or null if generation fails
 */
export function getSafeUrl(path: string = ""): string | null {
  try {
    return getUrl(path)
  } catch {
    return null
  }
}
