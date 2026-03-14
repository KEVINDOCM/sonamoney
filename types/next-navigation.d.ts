// Type declarations to help TypeScript resolve Next.js navigation exports
declare module "next/navigation" {
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
  };
  export function useParams<T extends Record<string, string> = Record<string, string>>(): T;
}

// Type declarations for useTranslation
declare module "@/lib/i18n/useTranslation" {
  export interface TranslationContextValue {
    lang: "en" | "id";
    setLanguage: (lang: "en" | "id") => void;
    t: (path: string) => string;
    mounted: boolean;
  }
  export function useTranslation(): TranslationContextValue;
}

// Type declarations for useCurrency
declare module "@/lib/hooks/useCurrency" {
  export interface CurrencyContextValue {
    baseCurrency: string;
    setBaseCurrency: (currency: string) => Promise<void>;
    rates: Record<string, number>;
    loading: boolean;
    mounted: boolean;
    format: (amount: number, currency?: string) => string;
    convert: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  }
  export function useCurrency(): CurrencyContextValue;
}
