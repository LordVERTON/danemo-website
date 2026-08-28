export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface CustomerPaymentRecord {
  id: string
  customer_id?: string
  amount: number | string
  currency?: string | null
  paid_at: string
  payment_method?: string | null
  reference?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface PaymentProgressOrder {
  id: string
  value?: number | string | null
  created_at: string
}

export interface OrderPaymentProgress {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  paymentStatus: PaymentStatus
}

export interface CustomerPaymentSummary {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  creditAmount: number
  paymentStatus: PaymentStatus
  progressPercent: number
  orderProgress: Record<string, OrderPaymentProgress>
}

const MONEY_PRECISION = 100
const EPSILON = 0.005

function toMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_PRECISION) / MONEY_PRECISION
}

function toPositiveMoney(value: number | string | null | undefined): number {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? toMoney(amount) : 0
}

function resolvePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (totalAmount > 0 && paidAmount >= totalAmount - EPSILON) return 'paid'
  if (paidAmount > EPSILON) return 'partial'
  return 'unpaid'
}

/**
 * Les règlements sont enregistrés au niveau du client, sans commande obligatoire.
 * L'affectation par ancienneté des commandes sert uniquement à rendre l'avancement
 * lisible dans l'interface et sur la facture ; elle ne crée pas d'imputation comptable.
 */
export function calculateCustomerPaymentProgress(
  orders: PaymentProgressOrder[],
  payments: CustomerPaymentRecord[],
): CustomerPaymentSummary {
  const sortedOrders = [...orders].sort((left, right) => {
    const leftTime = Date.parse(left.created_at)
    const rightTime = Date.parse(right.created_at)
    const normalizedLeftTime = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime
    const normalizedRightTime = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime

    if (normalizedLeftTime !== normalizedRightTime) return normalizedLeftTime - normalizedRightTime
    return left.id.localeCompare(right.id)
  })

  const totalAmount = toMoney(sortedOrders.reduce((sum, order) => sum + toPositiveMoney(order.value), 0))
  const receivedAmount = toMoney(payments.reduce((sum, payment) => sum + toPositiveMoney(payment.amount), 0))
  const paidAmount = Math.min(receivedAmount, totalAmount)
  const remainingAmount = toMoney(Math.max(totalAmount - paidAmount, 0))
  const creditAmount = toMoney(Math.max(receivedAmount - totalAmount, 0))
  const orderProgress: Record<string, OrderPaymentProgress> = {}
  let amountToAllocate = paidAmount

  for (const order of sortedOrders) {
    const orderTotal = toPositiveMoney(order.value)
    const orderPaidAmount = toMoney(Math.min(orderTotal, amountToAllocate))
    const orderRemainingAmount = toMoney(Math.max(orderTotal - orderPaidAmount, 0))

    orderProgress[order.id] = {
      totalAmount: orderTotal,
      paidAmount: orderPaidAmount,
      remainingAmount: orderRemainingAmount,
      paymentStatus: resolvePaymentStatus(orderTotal, orderPaidAmount),
    }

    amountToAllocate = toMoney(Math.max(amountToAllocate - orderPaidAmount, 0))
  }

  return {
    totalAmount,
    paidAmount,
    remainingAmount,
    creditAmount,
    paymentStatus: resolvePaymentStatus(totalAmount, paidAmount),
    progressPercent: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    orderProgress,
  }
}
