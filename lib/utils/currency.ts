export const SUPPORTED_CURRENCIES = ["USD", "IDR"] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

export const CURRENCY_CONFIG: Record<SupportedCurrency, {
  symbol: string
  locale: string
  name: string
  flag: string
}> = {
  USD: {
    symbol: "$",
    locale: "en-US",
    name: "US Dollar",
    flag: "🇺🇸",
  },
  IDR: {
    symbol: "Rp",
    locale: "id-ID",
    name: "Indonesian Rupiah",
    flag: "🇮🇩",
  },
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency | string = "USD"
): string {
  // Guard against invalid inputs
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }

  const config = CURRENCY_CONFIG[currency as SupportedCurrency]
  if (!config) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (currency === "IDR") {
    // IDR format: Rp 1.000.000 (no decimals)
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(amount)}`
  }

  // USD format: $1,000.00
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function convertToBase(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  // Convert to USD first, then to target
  const fromRate = rates[fromCurrency] ?? 1
  const toRate = rates[toCurrency] ?? 1
  // rates are relative to base (USD)
  // amount in fromCurrency → USD → toCurrency
  const inUSD = amount / fromRate
  return inUSD * toRate
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG[currency as SupportedCurrency]?.symbol ?? currency
}

/**
 * Parse a formatted currency string into a number.
 * Handles both dot-separated (IDR) and comma-separated (USD) inputs.
 * e.g. "50.000" → 50000, "1,500.00" → 1500
 */
export function parseFormattedAmount(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(/,/g, "")
  const parsed = Number(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
