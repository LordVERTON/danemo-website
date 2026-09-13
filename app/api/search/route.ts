import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ordersApi } from "@/lib/database"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"
import { supabaseAdmin } from "@/lib/supabase"

type SearchCustomer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
}

type SearchContainer = {
  id: string
  code: string
  departure_port: string | null
  arrival_port: string | null
  status: string
}

const searchSchema = z.object({
  q: z.string().trim().min(2).max(100),
})

function toSafeSearchText(value: string) {
  return value.replace(/[%,_()]/g, " ").replace(/\s+/g, " ").trim()
}

// GET /api/search?q= - Recherche globale interne, limitée aux collaborateurs actifs.
export async function GET(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  const parsed = searchSchema.safeParse({ q: new URL(request.url).searchParams.get("q") || "" })
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Saisissez au moins deux caractères pour rechercher." },
      { status: 400 },
    )
  }

  try {
    const safeSearchText = toSafeSearchText(parsed.data.q)
    if (safeSearchText.length < 2) {
      return NextResponse.json(
        { success: false, error: "Saisissez une recherche exploitable." },
        { status: 400 },
      )
    }
    const term = `%${safeSearchText}%`

    const [matchingOrders, qrOrder, customersResult, containersResult] = await Promise.all([
      ordersApi.search(safeSearchText),
      ordersApi.getByQr(parsed.data.q),
      supabaseAdmin
        .from("customers")
        .select("id, name, email, phone, company")
        .or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term},company.ilike.${term}`)
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("containers")
        .select("id, code, departure_port, arrival_port, status")
        .ilike("code", term)
        .order("created_at", { ascending: false })
        .limit(6),
    ])

    if (customersResult.error || containersResult.error) {
      console.error("[global-search] Unable to load results", {
        customers: customersResult.error?.message,
        containers: containersResult.error?.message,
      })
      throw new Error("Unable to load results")
    }

    const orders = qrOrder
      ? [qrOrder, ...matchingOrders.filter((order) => order.id !== qrOrder.id)]
      : matchingOrders

    return NextResponse.json(
      {
        success: true,
        data: {
          orders: orders.slice(0, 6).map((order) => ({
            id: order.id,
            title: order.order_number,
            description: `${order.client_name} · ${order.origin} → ${order.destination}`,
            href: `/admin/qr?code=${encodeURIComponent(order.order_number)}`,
          })),
          customers: ((customersResult.data || []) as SearchCustomer[]).map((customer) => ({
            id: customer.id,
            title: customer.name,
            description: customer.company || customer.email || customer.phone || "Client sans coordonnées complémentaires",
            href: `/admin/clients/${customer.id}`,
          })),
          containers: ((containersResult.data || []) as SearchContainer[]).map((container) => ({
            id: container.id,
            title: container.code,
            description: `${container.departure_port || "Départ"} → ${container.arrival_port || "arrivée"} · ${container.status}`,
            href: "/admin/containers",
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return NextResponse.json(
      { success: false, error: "Impossible de rechercher pour le moment." },
      { status: 500 },
    )
  }
}
