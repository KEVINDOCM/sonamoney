/**
 * React Query hooks for data fetching with caching
 * Provides efficient data fetching, caching, and synchronization
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

// Typed Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSupabaseClient = (): any => createSupabaseBrowserClient()

// Query keys for cache management
export const queryKeys = {
  transactions: (filters?: object) => ["transactions", filters],
  transaction: (id: string) => ["transaction", id],
  categories: () => ["categories"],
  category: (id: string) => ["category", id],
  accounts: () => ["accounts"],
  account: (id: string) => ["account", id],
  goals: () => ["goals"],
  dashboard: () => ["dashboard"],
  analytics: (period?: string) => ["analytics", period],
  user: () => ["user"],
  settings: () => ["settings"],
}

// Transaction hooks
export function useTransactions(
  filters?: {
    startDate?: string
    endDate?: string
    categoryId?: string
    accountId?: string
    type?: string
    limit?: number
  },
  options?: Parameters<typeof useQuery>[0]
) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      let query = supabase
        .from("transactions")
        .select("*, category:categories(*), account:accounts(*)")
        .order("transaction_date", { ascending: false })

      if (filters?.startDate) {
        query = query.gte("transaction_date", filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte("transaction_date", filters.endDate)
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId)
      }
      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId)
      }
      if (filters?.type) {
        query = query.eq("type", filters.type)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

export function useTransaction(id: string, options?: Parameters<typeof useQuery>[0]) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*), account:accounts(*)")
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction: Database["public"]["Tables"]["transactions"]["Insert"]) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() })
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Database["public"]["Tables"]["transactions"]["Update"]
    }) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update cache for specific transaction
      queryClient.setQueryData(queryKeys.transaction(data.id), data)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("transactions").delete().eq("id", id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.transaction(id) })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() })
    },
  })
}

// Category hooks
export function useCategories(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (error) throw error
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Database["public"]["Tables"]["categories"]["Insert"]) => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories() })
    },
  })
}

// Account hooks
export function useAccounts(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("name")

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Dashboard analytics hook
export function useDashboardAnalytics(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      // Fetch aggregated data from materialized view
      const { data, error } = await supabase
        .from("mv_monthly_aggregates")
        .select("*")
        .order("month", { ascending: false })
        .limit(12)

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - uses materialized view
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

// Goals hooks
export function useGoals(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("target_date", { ascending: true })

      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

// User profile hook
export function useUserProfile(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.user(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Prefetch helpers for SSR or optimistic updates
export function prefetchTransaction(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
  })
}

export function prefetchCategories(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("categories").select("*")

      if (error) throw error
      return data
    },
  })
}
