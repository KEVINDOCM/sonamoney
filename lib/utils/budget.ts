import type { Category } from "@/types";

export interface BudgetWarning {
  categoryName: string;
  spent: number;
  budget: number;
  percentage: number;
  level: "warning" | "danger";
}

export function computeBudgetWarnings(categories: (Category & { spent?: number })[]): BudgetWarning[] {
  return categories
    .filter(cat => cat.budget_limit && cat.budget_limit > 0)
    .map(cat => {
      const spent = cat.spent ?? 0;
      const budget = cat.budget_limit ?? 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const level: "warning" | "danger" = percentage >= 100 ? "danger" : "warning";
      return {
        categoryName: cat.name,
        spent,
        budget,
        percentage,
        level,
      };
    })
    .filter(w => w.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage);
}

export function hasBudgetWarning(percentage: number): boolean {
  return percentage >= 70;
}
