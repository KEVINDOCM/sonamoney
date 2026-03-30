"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { fetchCategories } from "@/lib/actions/categories"
import { useGuestCategories } from "@/lib/guest/hooks/useGuestCategories"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Category } from "@/types"

interface UserDataContextValue {
  categories: Category[]
  isLoading: boolean
  refetchCategories: () => Promise<void>
  refetchAll: () => Promise<void>
  isGuest: boolean
}

const UserDataContext = createContext<UserDataContextValue | null>(null) as { Provider: React.ComponentType<{ value: UserDataContextValue | null; children?: ReactNode }>; };

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authCategories, setAuthCategories] = useState<Category[]>([])
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  // Guest mode categories
  const { categories: guestCategories, isLoading: isGuestLoading, refreshCategories: refreshGuestCategories } = useGuestCategories()

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient() as { auth: { getUser: () => Promise<{ data: { user: unknown } }> } }
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setIsAuthLoading(false)
    }
    checkAuth()
  }, [])

  const refetchAuthCategories = useCallback(async () => {
    const data = await fetchCategories()
    setAuthCategories(data)
  }, [])

  const refetchCategories = useCallback(async () => {
    if (isAuthenticated) {
      await refetchAuthCategories()
    } else {
      refreshGuestCategories()
    }
  }, [isAuthenticated, refetchAuthCategories, refreshGuestCategories])

  const refetchAll = useCallback(async () => {
    await refetchCategories()
  }, [refetchCategories])

  // Load auth categories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refetchAuthCategories()
    }
  }, [isAuthenticated, refetchAuthCategories])

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createSupabaseBrowserClient() as { auth: { onAuthStateChange: (callback: (event: string, session: { user: unknown } | null) => void) => { data: { subscription: { unsubscribe: () => void } } } } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isLoading = isAuthLoading || (isAuthenticated ? false : isGuestLoading)
  const categories = isAuthenticated ? authCategories : (guestCategories as Category[])
  const isGuest = !isAuthenticated

  return (
    <UserDataContext.Provider
      value={{
        categories,
        isLoading,
        refetchCategories,
        refetchAll,
        isGuest,
      }}
    >
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData(): UserDataContextValue {
  const context = useContext(UserDataContext)
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider")
  }
  return context as UserDataContextValue
}
