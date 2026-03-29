/**
 * Middleware types
 */

export interface MiddlewareRequest {
  url: string
  method?: string
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
