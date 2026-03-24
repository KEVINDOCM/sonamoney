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
import type { Category } from "@/types"

interface UserDataContextValue {
  categories: Category[]
  isLoading: boolean
  refetchCategories: () => Promise<void>
  refetchAll: () => Promise<void>
}

const UserDataContext = createContext<UserDataContextValue | null>(null) as { Provider: React.ComponentType<{ value: UserDataContextValue | null; children?: ReactNode }>; };

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetchCategories = useCallback(async () => {
    const data = await fetchCategories()
    setCategories(data)
  }, [])

  const refetchAll = useCallback(async () => {
    setIsLoading(true)
    await refetchCategories()
    setIsLoading(false)
  }, [refetchCategories])

  useEffect(() => {
    refetchAll()
  }, [refetchAll])

  return (
    <UserDataContext.Provider
      value={{
        categories,
        isLoading,
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
