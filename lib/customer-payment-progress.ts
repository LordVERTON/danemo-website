export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface CustomerPaymentRecord {
  id: string
  customer_id?: string
  order_id?: string | null
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
 * Chaque règlement est imputé à la commande choisie. Les anciens règlements sans
 * `order_id` restent visibles, mais ne sont pas répartis artificiellement entre
 * les commandes.
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
  const orderProgress: Record<string, OrderPaymentProgress> = {}
  let paidAmount = 0
  let creditAmount = 0

  for (const order of sortedOrders) {
    const orderTotal = toPositiveMoney(order.value)
    const receivedForOrder = toMoney(
      payments
        .filter((payment) => payment.order_id === order.id)
        .reduce((sum, payment) => sum + toPositiveMoney(payment.amount), 0),
    )
    const orderPaidAmount = toMoney(Math.min(orderTotal, receivedForOrder))
    const orderRemainingAmount = toMoney(Math.max(orderTotal - orderPaidAmount, 0))

    orderProgress[order.id] = {
      totalAmount: orderTotal,
      paidAmount: orderPaidAmount,
      remainingAmount: orderRemainingAmount,
      paymentStatus: resolvePaymentStatus(orderTotal, orderPaidAmount),
    }

    paidAmount = toMoney(paidAmount + orderPaidAmount)
    creditAmount = toMoney(creditAmount + Math.max(receivedForOrder - orderPaidAmount, 0))
  }

  const remainingAmount = toMoney(Math.max(totalAmount - paidAmount, 0))

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
