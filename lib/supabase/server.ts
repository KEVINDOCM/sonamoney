import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  type CookieStore = {
    get: (name: string) => { value: string } | undefined
    set: (options: {
      name: string
      value: string
      [key: string]: unknown
    }) => void
  }

  const store = cookieStore as unknown as CookieStore

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            store.set({ name, value, ...options })
          } catch {
            // Expected in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            store.set({ name, value: "", ...options, maxAge: 0 })
          } catch {
            // Expected in Server Components
          }
        },
      },
    }
  )
}
