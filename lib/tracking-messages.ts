const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Commande en attente de prise en charge',
  confirmed: 'Commande confirmée',
  in_progress: "Commande en cours d’acheminement",
  completed: 'Commande livrée',
  cancelled: 'Commande annulée',
}

/** Message métier utilisé par défaut dans l’historique de suivi. */
export function getTrackingStatusMessage(status?: string | null) {
  return STATUS_MESSAGES[status || ''] || 'Mise à jour du suivi de la commande'
}

/**
 * Les anciennes entrées de scan contenaient un code technique. Ne l’exposons
 * pas dans l’historique : le statut donne au client l’information utile.
 */
export function getDisplayTrackingDescription(status?: string | null, description?: string | null) {
  const text = description?.trim()
  if (!text || /^scan\s+qr\s*:/i.test(text)) return getTrackingStatusMessage(status)
  return text
}
