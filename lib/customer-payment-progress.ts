export type PaymentStatus = "unpaid" | "partial" | "paid"

export type CustomerPaymentRecord = {
  id: string
  amount: number | string
  paid_at: string
  payment_method?: string | null
  reference?: string | null
  notes?: string | null
}

export function calculateCustomerPaymentProgress(orders: Array<{ id: string; value?: number | string | null; created_at: string }>, payments: CustomerPaymentRecord[]) {
  const toAmount = (value: unknown) => Math.max(0, Number(value) || 0)
  const totalAmount = orders.reduce((total, order) => total + toAmount(order.value), 0)
  const receivedAmount = payments.reduce((total, payment) => total + toAmount(payment.amount), 0)
  const paidAmount = Math.min(totalAmount, receivedAmount)
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  return {
    totalAmount, paidAmount, remainingAmount, creditAmount: Math.max(0, receivedAmount - totalAmount),
    paymentStatus: totalAmount > 0 && remainingAmount === 0 ? "paid" as PaymentStatus : paidAmount > 0 ? "partial" as PaymentStatus : "unpaid" as PaymentStatus,
    progressPercent: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
  }
}
