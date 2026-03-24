import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface AuthenticatedUser {
  id: string
  email: string | undefined
}

export class AuthError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message)
    this.name = "AuthError"
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError("Unauthorized")
  }

  const typedUser = user as { id: string; email?: string }

  return {
    id: typedUser.id,
    email: typedUser.email,
  }
}

// Helper to get supabase client + user in one call
export async function getAuthenticatedClient() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new AuthError("Unauthorized")
  }

  const typedUser = user as { id: string; email?: string }

  return {
    // Return the raw supabase client — it has all methods (.from, .auth, etc.)
    // Typed as ReturnType to preserve the real query builder chains
    supabase,
    userId: typedUser.id,
    user: {
      id: typedUser.id,
      email: typedUser.email,
    },
  }
}
