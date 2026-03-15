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
import { translations, Language } from "@/lib/i18n/translations"
import { LS_KEY_LANGUAGE } from "@/lib/constants/storage"

const LANGUAGE_KEY = LS_KEY_LANGUAGE

export interface TranslationContextValue {
  lang: Language
  setLanguage: (lang: Language) => void
  t: (path: string) => string
  mounted: boolean
}

const TranslationContext = createContext<TranslationContextValue | null>(null) as { Provider: React.ComponentType<{ value: TranslationContextValue | null; children?: ReactNode }>; };

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language
    if (saved === "en" || saved === "id") {
      setLangState(saved)
    }
  }, [])

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem(LANGUAGE_KEY, newLang)
    window.location.reload()
  }, [])

  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".")
      let result: unknown = translations[lang]
      for (const key of keys) {
        if (result && typeof result === "object") {
          result = (result as Record<string, unknown>)[key]
        } else {
          return path
        }
      }
      return typeof result === "string" ? result : path
    },
    [lang]
  )

  const value = useMemo(
    () => ({ lang, setLanguage, t, mounted }),
    [lang, setLanguage, t, mounted]
  )

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error("useTranslation must be used within TranslationProvider")
  return ctx as TranslationContextValue
}
