"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const next = lang === 'fr' ? 'en' : 'fr'
  return (
    <Button variant="outline" size="sm" onClick={() => setLang(next as any)}>
      {lang.toUpperCase()}
    </Button>
  )
}


