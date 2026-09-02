import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const fields = ["name", "email", "phone", "address", "city", "postal_code", "country", "company", "tax_id", "notes", "status", "opted_in_sms", "opted_in_whatsapp"]

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const [{ data: customer, error: customerError }, { data: orders, error: ordersError }, { data: invoices }, { data: payments }] = await Promise.all([
    (supabaseAdmin as any).from("customers").select("*").eq("id", id).maybeSingle(),
    (supabaseAdmin as any).from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    (supabaseAdmin as any).from("invoices").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    (supabaseAdmin as any).from("customer_payments").select("*").eq("customer_id", id).order("paid_at", { ascending: false }),
  ])
  if (customerError || ordersError) return NextResponse.json({ success: false, error: "Impossible de récupérer le client" }, { status: 500 })
  if (!customer) return NextResponse.json({ success: false, error: "Client introuvable" }, { status: 404 })
  return NextResponse.json({ success: true, data: { ...customer, orders: orders || [], invoices: invoices || [], payments: payments || [] } })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    const body = await request.json()
    const updates = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
    const { data, error } = await (supabaseAdmin as any).from("customers").update(updates).eq("id", id).select().maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ success: false, error: "Client introuvable" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[customers.put]", error)
    return NextResponse.json({ success: false, error: "Impossible de mettre à jour le client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const { data: customer } = await (supabaseAdmin as any).from("customers").select("name").eq("id", id).maybeSingle()
  if (!customer) return NextResponse.json({ success: false, error: "Client introuvable" }, { status: 404 })
  if (body.confirmationName !== customer.name) return NextResponse.json({ success: false, error: "Le nom de confirmation ne correspond pas" }, { status: 400 })
  const { count } = await (supabaseAdmin as any).from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id)
  if (count) return NextResponse.json({ success: false, error: "Impossible de supprimer un client ayant des commandes" }, { status: 409 })
  const { error } = await (supabaseAdmin as any).from("customers").delete().eq("id", id)
  if (error) return NextResponse.json({ success: false, error: "Impossible de supprimer le client" }, { status: 500 })
  return NextResponse.json({ success: true })
}
