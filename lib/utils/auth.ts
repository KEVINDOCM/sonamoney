// @ts-nocheck
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError("Unauthorized")
  }

  const typedUser = user as { id: string; email?: string }

  return {
    id: typedUser.id,
    email: typedUser.email,
  }
}

// Helper to get supabase client + user in one call
export async function getAuthenticatedClient(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  user: AuthenticatedUser
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError("Unauthorized")
  }

  const typedUser = user as { id: string; email?: string }

  return {
    supabase,
    user: {
      id: typedUser.id,
      email: typedUser.email,
    },
  }
}
