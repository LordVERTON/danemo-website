import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const fields = ["code", "vessel", "departure_port", "arrival_port", "etd", "eta", "status", "client_id"]

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { data, error } = await (supabaseAdmin as any).from("containers").select("*").eq("id", id).maybeSingle()
  if (error) return NextResponse.json({ success: false, error: "Impossible de récupérer le conteneur" }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: "Conteneur introuvable" }, { status: 404 })
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    const body = await request.json()
    const updates = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
    const { data, error } = await (supabaseAdmin as any).from("containers").update(updates).eq("id", id).select().maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ success: false, error: "Conteneur introuvable" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[containers.put]", error)
    return NextResponse.json({ success: false, error: "Impossible de mettre à jour le conteneur" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const { error } = await (supabaseAdmin as any).from("containers").delete().eq("id", id)
  if (error) return NextResponse.json({ success: false, error: "Impossible de supprimer le conteneur" }, { status: 500 })
  return NextResponse.json({ success: true })
}
