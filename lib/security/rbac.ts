// RBAC (Role-Based Access Control) Utilities
// Enterprise-grade access control for SonaMoney

import { createSupabaseServerClient } from "@/lib/supabase/server"

export type UserRole = "user" | "admin" | "auditor" | "support"

export type Resource =
  | "transactions"
  | "categories"
  | "goals"
  | "settings"
  | "users"
  | "reports"
  | "analytics"
  | "audit_logs"
  | "system"

export type Action = "read" | "create" | "update" | "delete" | "admin"

export interface RBACCheck {
  allowed: boolean
  role: UserRole | null
  reason?: string
}

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
}

// ============================================
// ROLE CHECK FUNCTIONS
// ============================================

/**
 * Get current user's role from database
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser() as { data: { user: { id: string } | null } }

    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single() as { data: { role: UserRole } | null; error: any }

    if (error || !data) {
      // Default to 'user' if no role assigned
      return "user"
    }

    return data.role as UserRole
  } catch (error) {
    console.error("[RBAC] Error getting user role:", error)
    return null
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "admin"
}

/**
 * Check if current user is auditor
 */
export async function isAuditor(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "auditor"
}

/**
 * Check if current user is support
 */
export async function isSupport(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "support"
}

/**
 * Check if current user has elevated privileges (admin, auditor, or support)
 */
export async function hasElevatedAccess(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "admin" || role === "auditor" || role === "support"
}

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

/**
 * Check if user has permission for a specific resource and action
 * Uses database function for centralized permission logic
 */
export async function hasPermission(
  resource: Resource,
  action: Action
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser() as { data: { user: { id: string } | null } }

    if (!user) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("has_permission", {
      p_user_id: user.id,
      p_resource: resource,
      p_action: action,
    })

    if (error) {
      console.error("[RBAC] Permission check error:", error)
      return false
    }

    return data || false
  } catch (error) {
    console.error("[RBAC] Error checking permission:", error)
    return false
  }
}

/**
 * Require permission or throw error
 * For use in server actions
 */
export async function requirePermission(
  resource: Resource,
  action: Action
): Promise<void> {
  const allowed = await hasPermission(resource, action)

  if (!allowed) {
    throw new Error(`Access denied: ${action} permission required for ${resource}`)
  }
}

/**
 * Check resource access with ownership validation
 * Returns true if:
 * - User is admin
 * - User is owner and has permission
 * - User is auditor/support and action is read
 */
export async function canAccessResource(
  resourceOwnerId: string,
  resource: Resource,
  action: Action = "read"
): Promise<RBACCheck> {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { allowed: false, role: null, reason: "Not authenticated" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (user as any).id as string

    const role = await getCurrentUserRole()

    // Admin has full access
    if (role === "admin") {
      return { allowed: true, role, reason: "Admin access" }
    }

    // Owner has access with proper permissions
    if (userId === resourceOwnerId) {
      const hasPerm = await hasPermission(resource, action)
      if (hasPerm) {
        return { allowed: true, role, reason: "Resource owner" }
      }
      return { allowed: false, role, reason: `Missing ${action} permission for ${resource}` }
    }

    // Auditors and Support can read any resource
    if ((role === "auditor" || role === "support") && action === "read") {
      return { allowed: true, role, reason: `${role} read access` }
    }

    return { allowed: false, role, reason: "Access denied" }
  } catch (error) {
    console.error("[RBAC] Error in canAccessResource:", error)
    return { allowed: false, role: null, reason: "Error checking access" }
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Assign role to user (admin only)
 */
export async function assignUserRole(
  targetUserId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (user as any).id as string

    // Check if current user is admin
    const currentRole = await getCurrentUserRole()
    if (currentRole !== "admin") {
      return { success: false, error: "Admin permission required" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("assign_role", {
      p_target_user_id: targetUserId,
      p_role: role,
      p_assigned_by: userId,
    })

    if (error) {
      console.error("[RBAC] Error assigning role:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[RBAC] Error in assignUserRole:", error)
    return { success: false, error: "Failed to assign role" }
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles(): Promise<{
  success: boolean
  users?: UserWithRole[]
  error?: string
}> {
  try {
    const supabase = await createSupabaseServerClient()

    const currentRole = await getCurrentUserRole()
    if (currentRole !== "admin") {
      return { success: false, error: "Admin permission required" }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("user_roles")
      .select(`
        user_id,
        role,
        users:auth.users!inner(email)
      `)

    if (error) {
      console.error("[RBAC] Error fetching users:", error)
      return { success: false, error: error.message }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users: UserWithRole[] = (data as any[]).map((row) => ({
      id: row.user_id,
      email: row.users?.email || "",
      role: row.role as UserRole,
    }))

    return { success: true, users }
  } catch (error) {
    console.error("[RBAC] Error in getAllUsersWithRoles:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Check if path requires elevated privileges
 */
export function requiresElevatedAccess(pathname: string): {
  required: boolean
  resource?: Resource
  action?: Action
} {
  // Admin-only paths
  const adminPaths = ["/admin", "/system", "/user-management"]
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    return { required: true, resource: "system", action: "admin" }
  }

  // Auditor paths
  const auditorPaths = ["/audit-logs", "/compliance-reports"]
  if (auditorPaths.some((path) => pathname.startsWith(path))) {
    return { required: true, resource: "audit_logs", action: "read" }
  }

  return { required: false }
}

/**
 * Protect API routes by resource and action
 * For use in API route handlers
 */
export async function protectRoute(
  resource: Resource,
  action: Action
): Promise<{ user: { id: string; role: UserRole } } | { error: string; status: number }> {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Authentication required", status: 401 }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (user as any).id as string

    const role = await getCurrentUserRole()

    if (!role) {
      return { error: "Role not found", status: 403 }
    }

    const hasPerm = await hasPermission(resource, action)

    if (!hasPerm) {
      return { error: `Access denied: ${action} permission required for ${resource}`, status: 403 }
    }

    return { user: { id: userId, role } }
  } catch (error) {
    console.error("[RBAC] Error in protectRoute:", error)
    return { error: "Authorization check failed", status: 500 }
  }
}
