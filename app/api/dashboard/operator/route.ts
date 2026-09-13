import { NextRequest, NextResponse } from "next/server"

import { calculateCustomerPaymentProgress, type CustomerPaymentRecord } from "@/lib/customer-payment-progress"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"
import { supabaseAdmin } from "@/lib/supabase"

type DashboardTaskKind = "tracking" | "payment" | "milestone" | "incident"

type DashboardTask = {
  id: string
  kind: DashboardTaskKind
  title: string
  description: string
  href: string
}

type DashboardOrder = {
  id: string
  order_number: string
  client_name: string
  customer_id: string | null
  value: number | null
  status: string
  updated_at: string
  created_at: string
}

type DashboardPayment = CustomerPaymentRecord & {
  customer_id: string
}

type DashboardContainer = {
  id: string
  code: string
  departure_port: string | null
  arrival_port: string | null
  etd: string | null
  eta: string | null
  status: string
}

const DAY_IN_MS = 24 * 60 * 60 * 1000
const FOLLOW_UP_AFTER_DAYS = 7
const MILESTONE_WINDOW_DAYS = 3

function isBefore(timestamp: string, limit: number) {
  const time = Date.parse(timestamp)
  return !Number.isNaN(time) && time < limit
}

function isWithinUpcomingWindow(timestamp: string | null, now: number) {
  if (!timestamp) return false
  const time = Date.parse(timestamp)
  return !Number.isNaN(time) && time >= now && time <= now + MILESTONE_WINDOW_DAYS * DAY_IN_MS
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp))
}

// GET /api/dashboard/operator - File d'action du tableau de bord collaborateur
export async function GET(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  try {
    const [ordersResult, paymentsResult, containersResult] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, order_number, client_name, customer_id, value, status, updated_at, created_at"),
      supabaseAdmin
        .from("customer_payments")
        .select("id, customer_id, amount, currency, paid_at, payment_method, reference, notes, created_at, updated_at"),
      supabaseAdmin
        .from("containers")
        .select("id, code, departure_port, arrival_port, etd, eta, status"),
    ])

    if (ordersResult.error || paymentsResult.error || containersResult.error) {
      console.error("[operator-dashboard] Unable to load action queue", {
        orders: ordersResult.error?.message,
        payments: paymentsResult.error?.message,
        containers: containersResult.error?.message,
      })
      throw new Error("Unable to load action queue")
    }

    const orders = (ordersResult.data ?? []) as DashboardOrder[]
    const payments = (paymentsResult.data ?? []) as DashboardPayment[]
    const containers = (containersResult.data ?? []) as DashboardContainer[]
    const now = Date.now()
    const followUpLimit = now - FOLLOW_UP_AFTER_DAYS * DAY_IN_MS
    const tasks: DashboardTask[] = []

    const delayedContainers = containers.filter((container) => container.status === "delayed")
    for (const container of delayedContainers) {
      tasks.push({
        id: `incident-${container.id}`,
        kind: "incident",
        title: `Retard signalé · ${container.code}`,
        description: "Vérifiez la situation du conteneur et informez le responsable si nécessaire.",
        href: "/admin/containers",
      })
    }

    const milestoneContainers = containers.filter((container) =>
      container.status !== "delivered" &&
      (isWithinUpcomingWindow(container.etd, now) || isWithinUpcomingWindow(container.eta, now)),
    )
    for (const container of milestoneContainers) {
      const isDeparture = isWithinUpcomingWindow(container.etd, now)
      const date = isDeparture ? container.etd : container.eta
      tasks.push({
        id: `milestone-${container.id}-${isDeparture ? "departure" : "arrival"}`,
        kind: "milestone",
        title: `${isDeparture ? "Départ proche" : "Arrivée proche"} · ${container.code}`,
        description: `${container.departure_port || "Départ"} → ${container.arrival_port || "arrivée"}${date ? ` · ${formatDate(date)}` : ""}`,
        href: "/admin/containers",
      })
    }

    const followUpOrders = orders.filter(
      (order) =>
        order.status !== "completed" &&
        order.status !== "cancelled" &&
        isBefore(order.updated_at, followUpLimit),
    )
    for (const order of followUpOrders) {
      tasks.push({
        id: `tracking-${order.id}`,
        kind: "tracking",
        title: `Suivi à relancer · ${order.order_number}`,
        description: `${order.client_name} · dernière mise à jour le ${formatDate(order.updated_at)}`,
        href: `/admin/qr?code=${encodeURIComponent(order.order_number)}`,
      })
    }

    const ordersByCustomer = new Map<string, typeof orders>()
    for (const order of orders) {
      if (!order.customer_id) continue
      const customerOrders = ordersByCustomer.get(order.customer_id) ?? []
      customerOrders.push(order)
      ordersByCustomer.set(order.customer_id, customerOrders)
    }

    const paymentsByCustomer = new Map<string, CustomerPaymentRecord[]>()
    for (const payment of payments) {
      const customerPayments = paymentsByCustomer.get(payment.customer_id) ?? []
      customerPayments.push(payment)
      paymentsByCustomer.set(payment.customer_id, customerPayments)
    }

    for (const [customerId, customerOrders] of ordersByCustomer) {
      const summary = calculateCustomerPaymentProgress(
        customerOrders,
        paymentsByCustomer.get(customerId) ?? [],
      )
      if (summary.totalAmount <= 0 || summary.paymentStatus === "paid") continue

      tasks.push({
        id: `payment-${customerId}`,
        kind: "payment",
        title: `Règlement à compléter · ${customerOrders[0]?.client_name || "Client"}`,
        description: `${summary.remainingAmount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} restant à régler`,
        href: `/admin/clients/${customerId}`,
      })
    }

    const priority: Record<DashboardTaskKind, number> = {
      incident: 0,
      milestone: 1,
      tracking: 2,
      payment: 3,
    }
    tasks.sort((left, right) => priority[left.kind] - priority[right.kind] || left.title.localeCompare(right.title))

    return NextResponse.json(
      {
        success: true,
        data: {
          tasks: tasks.slice(0, 12),
          totals: {
            toProcess: tasks.length,
            tracking: followUpOrders.length,
            payments: tasks.filter((task) => task.kind === "payment").length,
            milestones: milestoneContainers.length,
            incidents: delayedContainers.length,
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json(
      { success: false, error: "Impossible de charger la file d'action pour le moment." },
      { status: 500 },
    )
  }
}
