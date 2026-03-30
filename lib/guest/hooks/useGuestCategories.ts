'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getGuestCategories,
  addGuestCategory,
  updateGuestCategory,
  deleteGuestCategory,
  initializeGuestStorage,
} from '../guestStorage';
import type { GuestCategory } from '../constants';

interface UseGuestCategoriesReturn {
  categories: GuestCategory[];
  isLoading: boolean;
  addCategory: (category: Omit<GuestCategory, 'id'>) => GuestCategory | null;
  updateCategory: (
    id: string,
    updates: Partial<GuestCategory>
  ) => GuestCategory | null;
  deleteCategory: (id: string) => boolean;
  refreshCategories: () => void;
  getCategoryById: (id: string) => GuestCategory | undefined;
}

export function useGuestCategories(): UseGuestCategoriesReturn {
  const [categories, setCategories] = useState<GuestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize storage on first load
  useEffect(() => {
    initializeGuestStorage();
    refreshCategories();
  }, []);

  const refreshCategories = useCallback(() => {
    setIsLoading(true);
    const data = getGuestCategories();
    setCategories(data);
    setIsLoading(false);
  }, []);

  const addCategory = useCallback(
    (category: Omit<GuestCategory, 'id'>): GuestCategory | null => {
      try {
        const newCategory = addGuestCategory(category);
        setCategories((prev) => [...prev, newCategory]);
        return newCategory;
      } catch {
        return null;
      }
    },
    []
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<GuestCategory>): GuestCategory | null => {
      const updated = updateGuestCategory(id, updates);
      if (updated) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
      }
      return updated;
    },
    []
  );

  const deleteCategory = useCallback((id: string): boolean => {
    const success = deleteGuestCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  const getCategoryById = useCallback(
    (id: string): GuestCategory | undefined => {
      return categories.find((c) => c.id === id);
    },
    [categories]
  );

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
    getCategoryById,
  };
}
