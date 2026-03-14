// @ts-nocheck
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { seedDefaultCategories } from "@/lib/actions/categories"

export async function GET(request: NextRequest): Promise<Response> {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const origin = requestUrl.origin

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

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
