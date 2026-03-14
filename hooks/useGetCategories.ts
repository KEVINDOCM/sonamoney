"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/types";
import { fetchCategories } from "@/lib/actions/categories";

interface UseGetCategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

export function useGetCategories(): UseGetCategoriesState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const result = await fetchCategories();
        if (!isActive) return;
        setCategories(result);
      } catch {
        if (!isActive) return;
        setError("Failed to load categories.");
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  return { categories, isLoading, error };
}

