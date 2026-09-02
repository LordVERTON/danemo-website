import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const customerFields = ["name", "email", "phone", "address", "city", "postal_code", "country", "company", "tax_id", "notes", "status", "opted_in_sms", "opted_in_whatsapp"]

function payload(body: Record<string, unknown>) {
  return Object.fromEntries(customerFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
}

export async function GET(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { searchParams } = new URL(request.url)
    let query = (supabaseAdmin as any).from("customers").select("*, orders (*) ").order("created_at", { ascending: false })
    const status = searchParams.get("status")
    if (status && status !== "all") query = query.eq("status", status)
    const { data, error } = await query
    if (error) throw error
    const search = searchParams.get("search")?.toLowerCase().trim()
    const filtered = !search ? data || [] : (data || []).filter((customer: any) =>
      [customer.name, customer.email, customer.phone, customer.company].some((value) => String(value || "").toLowerCase().includes(search)),
    )
    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error("[customers.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer les clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const body = await request.json()
    if (!String(body.name || "").trim()) {
      return NextResponse.json({ success: false, error: "Le nom complet est requis" }, { status: 400 })
    }
    const { data, error } = await (supabaseAdmin as any).from("customers").insert({ ...payload(body), name: String(body.name).trim(), status: body.status || "active" }).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[customers.post]", error)
    return NextResponse.json({ success: false, error: "Impossible de créer le client" }, { status: 500 })
  }
}
