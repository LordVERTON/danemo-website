"use client"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import type { Lang } from "@/lib/translations"

export default function LanguageSwitcher() {
  const { lang, setLang, messages } = useI18n()
  const next = (lang === "fr" ? "en" : "fr") as Lang

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(next)}
      aria-label={messages.languageSwitcher.ariaLabel}
    >
      {messages.languageSwitcher.button}
    </Button>
  )
}


