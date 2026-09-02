import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const fields = ["code", "vessel", "departure_port", "arrival_port", "etd", "eta", "status", "client_id"]

export async function GET() {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { data, error } = await (supabaseAdmin as any).from("containers").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[containers.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer les conteneurs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const body = await request.json()
    if (!String(body.code || "").trim()) return NextResponse.json({ success: false, error: "Le code est requis" }, { status: 400 })
    const row = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
    const { data, error } = await (supabaseAdmin as any).from("containers").insert({ ...row, code: String(body.code).trim(), status: body.status || "planned" }).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[containers.post]", error)
    return NextResponse.json({ success: false, error: "Impossible de créer le conteneur" }, { status: 500 })
  }
}
