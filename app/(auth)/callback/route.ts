import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { seedDefaultCategories } from "@/lib/actions/categories"

interface Cookie {
  name: string;
  value: string;
  options: Record<string, unknown>;
}

interface SupabaseAuthClient {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ data: { session: { user: { id: string } } | null } }>;
  };
}

export async function GET(request: NextRequest): Promise<Response> {
    const req = request as unknown as { url: string };
    const requestUrl = new URL(req.url)
    const code = requestUrl.searchParams.get("code")
    const origin = requestUrl.origin

    if (code) {
        const cookieStore = await cookies() as unknown as { get: (name: string) => { value: string } | undefined; set: (name: string, value: string, options: Record<string, unknown>) => void };
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: Record<string, unknown>) {
                        cookieStore.set(name, value, options)
                    },
                    remove(name: string, options: Record<string, unknown>) {
                        cookieStore.set(name, "", { ...options, maxAge: 0 })
                    },
                },
            }
        ) as unknown as SupabaseAuthClient

        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        if (session?.user) {
            try {
                await seedDefaultCategories(session.user.id)
            } catch (error) {
                console.error("Seeding failed:", error)
            }
        }
    }

    return NextResponse.redirect(`${origin}/dashboard`) as unknown as Response
}
