'use client'

import { createContext, useContext, useMemo, useState } from 'react'

type Lang = 'fr' | 'en'

const dictionary: Record<Lang, Record<string, string>> = {
  fr: {
    language: 'Français',
    switch: 'EN',
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    containers: 'Conteneurs',
    tracking: 'Suivi',
  },
  en: {
    language: 'English',
    switch: 'FR',
    dashboard: 'Dashboard',
    clients: 'Clients',
    containers: 'Containers',
    tracking: 'Tracking',
  },
}

interface I18nContextValue {
  lang: Lang
  t: (key: string) => string
  setLang: (l: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>((typeof window !== 'undefined' && (localStorage.getItem('danemo_lang') as Lang)) || 'fr')
  const t = (key: string) => dictionary[lang]?.[key] || key
  const value = useMemo(
    () => ({
      lang,
      t,
      setLang: (l: Lang) => {
        setLang(l)
        if (typeof window !== 'undefined') localStorage.setItem('danemo_lang', l)
      },
    }),
    [lang],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}


