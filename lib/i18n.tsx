'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { resolveTranslationValue, translations, type Lang, type TranslationSchema } from './translations'

interface I18nContextValue {
  lang: Lang
  t: (key: string) => string
  setLang: (lang: Lang) => void
  messages: TranslationSchema
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'danemo_lang'
const SUPPORTED_LANGS: Lang[] = ['fr', 'en']

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LANGS.includes(value as Lang)
}

function translate(lang: Lang, key: string): string {
  const segments = key.split('.').filter(Boolean)
  const resolved = resolveTranslationValue(translations[lang] as any, segments)
  return resolved ?? key
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Toujours commencer par 'fr' pour éviter les erreurs d'hydratation
  // La langue sera mise à jour depuis localStorage après le montage
  const [lang, setLangState] = useState<Lang>('fr')
  const [isMounted, setIsMounted] = useState(false)

  // Lire localStorage uniquement après le montage pour éviter les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLang(stored) && stored !== lang) {
        setLangState(stored)
      }
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const t = useCallback((key: string) => translate(lang, key), [lang])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t,
      setLang,
      messages: translations[lang],
    }),
    [lang, setLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}


