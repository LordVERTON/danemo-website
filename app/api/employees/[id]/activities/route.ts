import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const { data, error } = await (supabaseAdmin as any).from("employee_activities").select("*").eq("employee_id", id).order("created_at", { ascending: false })
  if (error) return NextResponse.json({ success: false, error: "Impossible de récupérer l'activité" }, { status: 500 })
  return NextResponse.json({ success: true, data: data || [] })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const body = await request.json()
  if (!body.activity_type || !body.description) return NextResponse.json({ success: false, error: "Type et description requis" }, { status: 400 })
  const { data, error } = await (supabaseAdmin as any).from("employee_activities").insert({ employee_id: id, activity_type: body.activity_type, description: body.description, metadata: body.metadata || {} }).select().single()
  if (error) return NextResponse.json({ success: false, error: "Impossible d'ajouter l'activité" }, { status: 500 })
  return NextResponse.json({ success: true, data }, { status: 201 })
}
