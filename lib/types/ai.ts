// ============================================
// AI TYPES
// ============================================

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isError?: boolean
}

export interface ChatRequest {
  message: string
  history: ChatMessage[]
}

export interface ChatResponse {
  reply: string
  error?: string
}

export interface AnonymizedTransaction {
  date?: string
  amount: number
  type: "income" | "expense"
  categoryName: string
  currency: string
}

export interface AnonymizedAccount {
  name: string
  type: string
  balance: number
  currency: string
}

export interface AnonymizedCategory {
  name: string
  type: "income" | "expense"
  budgetLimit: number | null
  spent: number
  isOverBudget: boolean
}

export interface AIContext {
  generatedAt: string
  thisMonthIncome: number
  thisMonthExpenses: number
  netSavings: number
  currency: string
  accounts: AnonymizedAccount[]
  topCategories: AnonymizedCategory[]
  recentTransactions: AnonymizedTransaction[]
  budgetsOverLimit: AnonymizedCategory[]
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetAt: Date
}
