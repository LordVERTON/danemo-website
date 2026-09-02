import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const schema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.enum(["bank_transfer", "cash", "card", "mobile", "other"]),
  reference: z.string().trim().max(120).optional().transform((value) => value || null),
  notes: z.string().trim().max(1000).optional().transform((value) => value || null),
})

async function requireExistingCustomer(id: string) {
  const { data, error } = await (supabaseAdmin as any).from("customers").select("id").eq("id", id).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false, error: "Identifiant client invalide" }, { status: 400 })
    if (!(await requireExistingCustomer(id))) return NextResponse.json({ success: false, error: "Client introuvable" }, { status: 404 })
    const { data, error } = await (supabaseAdmin as any).from("customer_payments").select("*").eq("customer_id", id).order("paid_at", { ascending: false }).order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[customers.payments.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer les règlements" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: false, error: "Identifiant client invalide" }, { status: 400 })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: "Données de règlement invalides" }, { status: 400 })
    if (!(await requireExistingCustomer(id))) return NextResponse.json({ success: false, error: "Client introuvable" }, { status: 404 })
    const { data, error } = await (supabaseAdmin as any).from("customer_payments").insert({ customer_id: id, currency: "EUR", ...parsed.data }).select("*").single()
    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[customers.payments.post]", error)
    return NextResponse.json({ success: false, error: "Impossible d'enregistrer le règlement" }, { status: 500 })
  }
}
