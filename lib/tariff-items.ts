export const TARIFF_REFERENCE_ITEMS = [
  ["Canapé 2 places", 250], ["Canapé 3 places", 350], ["Canapé d'angle", 350], ["Cantine 100 cm", 140],
  ["Cantine 80/90 cm", 125], ["Carreaux (par palette)", 700], ["Congélateur + de 500 kg", 550],
  ["Congélateur 150 - 250 l", 275], ["Congélateur 251 - 490 l", 350], ["Cuisinière + de 4 foyers", 175],
  ["Cuisinière - de 4 foyers", 160], ["Fût orange vide", 30], ["Fût orange 220 l", 170],
  ["Groupe électrogène", 220], ["Lave-linge - de 10 kg", 180], ["Lave-linge 6 - 10 kg", 165],
  ["Matelas", 100], ["Micro-ondes standard", 40], ["Moteur véhicule", 400], ["Réfrigérateur 140 cm", 220],
  ["Réfrigérateur 170 cm", 280], ["Réfrigérateur 190 cm", 310], ["Réfrigérateur américain", 400],
  ["Réfrigérateur de chambre", 120], ["Salon complet", 800], ["Téléviseur jusqu'à 30 pouces", 100],
  ["Téléviseur jusqu'à 40 pouces", 150], ["Téléviseur 50 pouces et +", 300], ["Vélo adulte", 75], ["Vélo enfant", 35],
] as const

export const TARIFF_REFERENCE_UNIT_PRICE_EUR = TARIFF_REFERENCE_ITEMS.map(([, price]) => price)

export function getTariffItemsForLang(_lang: string) {
  return TARIFF_REFERENCE_ITEMS.map(([label, unitPriceEur], index) => ({
    index,
    label,
    descriptionLabel: getTariffDescriptionLabel(label),
    price: `${unitPriceEur} €`,
    unitPriceEur,
  }))
}

export function getTariffItemCount(): number {
  return TARIFF_REFERENCE_ITEMS.length
}

export function getCanonicalTariffLabel(index: number): string | null {
  return TARIFF_REFERENCE_ITEMS[index]?.[0] ?? null
}

export function getTariffDescriptionLabel(label: string): string {
  return label
    .replace(/\s*(?:,\s*)?(?:à|a) partir de$/i, '')
    .replace(/\s*,?\s*from$/i, '')
    .trim()
}

export function getCanonicalTariffDescription(index: number): string | null {
  const item = getCanonicalTariffLabel(index)
  return item ? getTariffDescriptionLabel(item) : null
}
