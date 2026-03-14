import { revalidatePath } from "next/cache"

// Revalidate all finance-related paths
export function revalidateFinancePaths(): void {
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/analytics")
  revalidatePath("/budget")
  revalidatePath("/accounts")
  revalidatePath("/calendar")
}

// Revalidate transaction-related paths only
export function revalidateTransactionPaths(): void {
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  revalidatePath("/analytics")
  revalidatePath("/budget")
  revalidatePath("/calendar")
}

// Revalidate account-related paths only
export function revalidateAccountPaths(): void {
  revalidatePath("/dashboard")
  revalidatePath("/accounts")
  revalidatePath("/transactions")
}

// Revalidate category-related paths only
export function revalidateCategoryPaths(): void {
  revalidatePath("/budget")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/analytics")
}
