"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { getExchangeRates } from "@/lib/services/exchangeRate"
import {
  SupportedCurrency,
  formatCurrency,
  convertToBase,
  SUPPORTED_CURRENCIES
} from "@/lib/utils/currency"
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_CURRENCY,
} from "@/lib/constants"
import { LS_KEY_BASE_CURRENCY } from "@/lib/constants/storage"

const BASE_CURRENCY_KEY = LS_KEY_BASE_CURRENCY

interface SupabaseAuthClient {
  auth: {
    updateUser: (params: { data: { base_currency: SupportedCurrency } }) => Promise<void>;
  };
}

export interface CurrencyContextValue {
  baseCurrency: SupportedCurrency
  setBaseCurrency: (currency: SupportedCurrency) => Promise<void>
  rates: Record<string, number>
  loading: boolean
  mounted: boolean
  format: (amount: number, currency?: string) => string
  convert: (amount: number, fromCurrency: string, toCurrency?: string) => number
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null) as { Provider: React.ComponentType<{ value: CurrencyContextValue | null; children?: ReactNode }>; };

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY)
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(BASE_CURRENCY_KEY) as SupportedCurrency
    if (saved && SUPPORTED_CURRENCIES.includes(saved)) {
      setBaseCurrencyState(saved)
    }
    getExchangeRates("USD").then(fetchedRates => {
      setRates(fetchedRates)
      setLoading(false)
    })
  }, [])

  const setBaseCurrency = useCallback(async (currency: SupportedCurrency) => {
    setBaseCurrencyState(currency)
    localStorage.setItem(BASE_CURRENCY_KEY, currency)
    try {
      const supabase = createSupabaseBrowserClient() as unknown as SupabaseAuthClient
      await supabase.auth.updateUser({ data: { base_currency: currency } })
    } catch {
      // ignore
    }
    window.location.reload()
  }, [])

  const format = useCallback(
    (amount: number, currency?: string): string =>
      formatCurrency(amount, currency ?? baseCurrency),
    [baseCurrency]
  )

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string): number =>
      convertToBase(amount, fromCurrency, toCurrency ?? baseCurrency, rates),
    [baseCurrency, rates]
  )

  const value = useMemo(
    () => ({ baseCurrency, setBaseCurrency, rates, loading, mounted, format, convert }),
    [baseCurrency, setBaseCurrency, rates, loading, mounted, format, convert]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider")
  return ctx as CurrencyContextValue
}
