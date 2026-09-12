export const ORDER_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  in_progress: 'En cours d’acheminement',
  completed: 'Livrée',
  cancelled: 'Annulée',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS

const ALLOWED_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
}

export function isOrderStatus(value: string): value is OrderStatus {
  return value in ORDER_STATUS_LABELS
}

export function getAllowedNextOrderStatuses(status: string): OrderStatus[] {
  return isOrderStatus(status) ? ALLOWED_NEXT_STATUSES[status] : []
}

export function isAllowedOrderStatusTransition(current: string, next: string) {
  return isOrderStatus(next) && getAllowedNextOrderStatuses(current).includes(next)
}

export function getOrderStatusActionLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: 'Remettre en attente',
    confirmed: 'Confirmer la commande',
    in_progress: 'Démarrer l’acheminement',
    completed: 'Marquer comme livrée',
    cancelled: 'Annuler la commande',
  }
  return labels[status]
}
