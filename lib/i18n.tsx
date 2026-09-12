'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'

import { resolveTranslationValue, translations, type Lang, type TranslationSchema } from './translations'

interface I18nContextValue {
  lang: Lang
  t: (key: string) => string
  setLang: (lang: Lang) => void
  messages: TranslationSchema
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'danemo_lang'
const LANGUAGE_CHANGE_EVENT = 'danemo-language-change'
const SUPPORTED_LANGS: Lang[] = ['fr', 'en']

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LANGS.includes(value as Lang)
}

function translate(lang: Lang, key: string): string {
  const segments = key.split('.').filter(Boolean)
  const resolved = resolveTranslationValue(translations[lang] as any, segments)
  return resolved ?? key
}

function getStoredLanguage(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLang(stored) ? stored : 'fr'
}

function getServerLanguage(): Lang {
  return 'fr'
}

function subscribeToLanguageChanges(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange)
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Le snapshot serveur reste en français pour conserver une hydratation stable.
  const lang = useSyncExternalStore<Lang>(subscribeToLanguageChanges, getStoredLanguage, getServerLanguage)

  const setLang = useCallback((next: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT))
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


