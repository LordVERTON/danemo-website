import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    const body = await request.json()
    const orderId = String(body.order_id || "")
    if (!orderId) return NextResponse.json({ success: false, error: "Commande requise" }, { status: 400 })
    const { data: order, error: orderError } = await (supabaseAdmin as any).from("orders").select("id, customer_id, value").eq("id", orderId).maybeSingle()
    if (orderError) throw orderError
    if (!order || order.customer_id !== id) return NextResponse.json({ success: false, error: "Commande introuvable pour ce client" }, { status: 404 })
    const subtotal = Number(order.value || 0)
    const { data, error } = await (supabaseAdmin as any).from("invoices").insert({ customer_id: id, order_id: order.id, subtotal, tax_rate: Number(body.tax_rate || 0), status: "draft", due_date: body.due_date || null, notes: body.notes || null }).select("*").single()
    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[customers.invoices.post]", error)
    return NextResponse.json({ success: false, error: "Impossible de créer la facture" }, { status: 500 })
  }
}
