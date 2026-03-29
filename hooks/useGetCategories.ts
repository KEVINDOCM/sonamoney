"use client";

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/types";
import { fetchCategories } from "@/lib/actions/categories";

// Query key for categories cache
const CATEGORIES_QUERY_KEY = ["categories"];

/**
 * React Query hook for fetching categories
 * Replaces legacy useEffect pattern with proper caching
 */
export function useGetCategories() {
  return useQuery<Category[], Error>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchCategories();
      return result;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
}

// Export query key for cache invalidation
export { CATEGORIES_QUERY_KEY };

