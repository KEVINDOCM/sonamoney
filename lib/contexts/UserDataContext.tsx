"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { getOrSeedAccounts } from "@/lib/actions/accounts"
import { fetchCategories } from "@/lib/actions/categories"
import type { Account, Category } from "@/types"

interface UserDataContextValue {
  accounts: Account[]
  categories: Category[]
  isLoading: boolean
  refetchAccounts: () => Promise<void>
  refetchCategories: () => Promise<void>
  refetchAll: () => Promise<void>
}

const UserDataContext = createContext<UserDataContextValue | null>(null) as { Provider: React.ComponentType<{ value: UserDataContextValue | null; children?: ReactNode }>; };

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetchAccounts = useCallback(async () => {
    console.log('[UserDataContext] Starting refetchAccounts...');
    const data = await getOrSeedAccounts()
    console.log('[UserDataContext] refetchAccounts received data:', data);
    console.log('[UserDataContext] refetchAccounts data.length:', data?.length);
    setAccounts(data)
  }, [])

  const refetchCategories = useCallback(async () => {
    const data = await fetchCategories()
    setCategories(data)
  }, [])

  const refetchAll = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([refetchAccounts(), refetchCategories()])
    setIsLoading(false)
  }, [refetchAccounts, refetchCategories])

  useEffect(() => {
    refetchAll()
  }, [refetchAll])

  return (
    <UserDataContext.Provider
      value={{
        accounts,
        categories,
        isLoading,
        refetchAccounts,
        refetchCategories,
        refetchAll,
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
