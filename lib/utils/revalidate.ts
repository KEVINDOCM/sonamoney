import { revalidatePath } from "next/cache"

// Base paths that most operations need to revalidate
const CORE_FINANCE_PATHS = ["/dashboard", "/transactions", "/analytics", "/budget", "/calendar"];

// Category-related paths
const CATEGORY_PATHS = ["/budget", "/categories", "/transactions", "/analytics"];

interface RevalidateOptions {
  includeCategories?: boolean;
  includeGoals?: boolean;
}

/**
 * Revalidate finance-related paths with optional category inclusion
 * Consolidates revalidateFinancePaths, revalidateTransactionPaths, and revalidateCategoryPaths
 */
export function revalidateFinancePaths(options?: RevalidateOptions): void {
  const paths = new Set<string>(CORE_FINANCE_PATHS);
  
  if (options?.includeCategories) {
    CATEGORY_PATHS.forEach(p => paths.add(p));
  }
  
  if (options?.includeGoals) {
    paths.add("/goals");
  }
  
  paths.forEach(path => revalidatePath(path));
}

// Backward-compatible aliases
/** @deprecated Use revalidateFinancePaths({ includeCategories: true }) */
export function revalidateCategoryPaths(): void {
  revalidateFinancePaths({ includeCategories: true });
}

/** @deprecated Use revalidateFinancePaths() */
export function revalidateTransactionPaths(): void {
  revalidateFinancePaths();
}
