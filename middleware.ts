import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

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
    "/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|workbox-.*\\.js).*)",
  ],
}

