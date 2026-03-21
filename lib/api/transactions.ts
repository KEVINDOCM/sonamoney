// Client-side helpers for secure transaction API calls
import { generateSecureHeaders } from "@/lib/security/client"

export interface CreateTransactionPayload {
  category_id: string
  amount: number
  type: "income" | "expense"
  date: string
  notes?: string
  account_id?: string | null
  is_recurring?: boolean
  recurring_interval?: number | null
  recurring_unit?: string | null
  recurring_next_date?: string | null
  tax_rate?: number | null
  commission_rate?: number | null
  currency?: string
  exchange_rate_at_time?: number
}

export interface UpdateTransactionPayload extends CreateTransactionPayload {}

/**
 * Create a new transaction with HMAC signature protection
 */
export async function createTransactionApi(payload: CreateTransactionPayload): Promise<{ success: boolean; error?: string }> {
  const headers = await generateSecureHeaders(payload as unknown as Record<string, unknown>)

  const res = await fetch("/api/transactions", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }))
    return { success: false, error: data.error || `Error ${res.status}` }
  }

  return { success: true }
}

/**
 * Update an existing transaction with HMAC signature protection
 */
export async function updateTransactionApi(
  id: string,
  payload: UpdateTransactionPayload
): Promise<{ success: boolean; error?: string }> {
  const headers = await generateSecureHeaders(payload as unknown as Record<string, unknown>)

  const res = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }))
    return { success: false, error: data.error || `Error ${res.status}` }
  }

  return { success: true }
}

/**
 * Delete a transaction with HMAC signature protection
 */
export async function deleteTransactionApi(id: string): Promise<{ success: boolean; error?: string }> {
  // For DELETE, we still need to send a signature but body is empty
  // We'll sign a minimal payload with the transaction ID
  const payload = { id, action: "delete" }
  const headers = await generateSecureHeaders(payload)

  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }))
    return { success: false, error: data.error || `Error ${res.status}` }
  }

  return { success: true }
}
