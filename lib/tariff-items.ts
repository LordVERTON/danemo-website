import type { Lang } from '@/lib/translations'
import { translations } from '@/lib/translations'

/**
 * Prix unitaire indicatif (EUR), même ordre que `translations.fr.rates.items` / index API.
 * Sert au calcul d’estimation sur le formulaire client (les libellés affichés suivent la langue).
 */
export const TARIFF_REFERENCE_UNIT_PRICE_EUR: readonly number[] = [
  250, 350, 350, 140, 125, 700, 550, 275, 350, 175, 160, 30, 170, 220, 180, 165, 100, 40, 400, 220, 280, 310, 400,
  120, 800, 100, 150, 300, 75, 35,
]

export function getTariffItemsForLang(lang: Lang) {
  const prices = TARIFF_REFERENCE_UNIT_PRICE_EUR
  return translations[lang].rates.items.map((item, index) => ({
    index,
    label: item.label,
    price: item.price,
    unitPriceEur: prices[index] ?? null,
  }))
}

export function getTariffItemCount(): number {
  return translations.fr.rates.items.length
}

const _expected = translations.fr.rates.items.length
if (TARIFF_REFERENCE_UNIT_PRICE_EUR.length !== _expected) {
  throw new Error(
    `tariff-items: TARIFF_REFERENCE_UNIT_PRICE_EUR length ${TARIFF_REFERENCE_UNIT_PRICE_EUR.length} !== rates.items ${_expected}`,
  )
}

/** Libellé canonique (FR) pour stockage en base / notes */
export function getCanonicalTariffLabel(index: number): string | null {
  const items = translations.fr.rates.items
  if (index < 0 || index >= items.length) return null
  return items[index].label
}

export function getCanonicalTariffDescription(index: number): string | null {
  const item = translations.fr.rates.items[index]
  if (!item) return null
  return `${item.label} - ${item.price}`
}
