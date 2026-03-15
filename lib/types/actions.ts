// ============================================
// ACTION RESULT TYPE
// Use for all server action return types
// ============================================
export type ActionResult<T = void> =
  | { success: true; data?: T; error?: never }
  | { success: false; error: string; data?: never }

// Common action payloads
export interface CreateTransactionPayload {
  amount: number
  type: "income" | "expense"
  category_id: string
  date: string
  notes?: string
  account_id?: string
  currency?: string
  exchange_rate_at_time?: number
  tax_rate?: number
  commission_rate?: number
  is_recurring?: boolean
  recurring_interval?: number
  recurring_unit?: string
  recurring_next_date?: string
}

export interface UpdateTransactionPayload extends Partial<CreateTransactionPayload> {
  id: string
}

export interface CreateAccountPayload {
  name: string
  type: "reguler" | "tabungan" | "utang"
  icon?: string
  currency: string
  balance?: number
  is_default?: boolean
}

export interface UpdateAccountPayload extends Partial<CreateAccountPayload> {
  // id is passed as a separate argument, not in the payload
}

export interface CreateCategoryPayload {
  name: string
  type: "income" | "expense"
  color?: string
  icon?: string
  budget_limit?: number
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
  id: string
}

export interface CreateTransferPayload {
  from_account_id: string
  to_account_id: string
  amount: number
  from_currency?: string
  to_currency?: string
  exchange_rate?: number
  converted_amount?: number
  date: string
  notes?: string
}
