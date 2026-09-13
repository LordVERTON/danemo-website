const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const e164Pattern = /^\+[1-9]\d{7,14}$/

/**
 * Normalise une adresse e-mail destinée à être stockée.
 * Renvoie `null` lorsque la valeur est vide ou ne respecte pas le format attendu.
 */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  return normalized && normalized.length <= 254 && emailPattern.test(normalized)
    ? normalized
    : null
}

/**
 * Accepte les séparateurs usuels, mais exige un indicatif pays explicite.
 * Les numéros locaux ne sont volontairement pas devinés : ils restent ambigus.
 */
export function normalizeInternationalPhoneE164(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const compact = value.trim().replace(/[\s().-]/g, '')
  const withInternationalPrefix = compact.startsWith('00')
    ? `+${compact.slice(2)}`
    : compact

  return e164Pattern.test(withInternationalPrefix) ? withInternationalPrefix : null
}
