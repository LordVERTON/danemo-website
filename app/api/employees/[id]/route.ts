import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const { data, error } = await (supabaseAdmin as any).from("employees").select("*").eq("id", id).maybeSingle()
  if (error) return NextResponse.json({ success: false, error: "Impossible de récupérer le collaborateur" }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: "Collaborateur introuvable" }, { status: 404 })
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const body = await request.json()
  const { data, error } = await (supabaseAdmin as any).from("employees").update({ name: body.name, email: body.email, role: body.role, salary: Number(body.salary || 0), position: body.position, hire_date: body.hire_date, is_active: body.is_active, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle()
  if (error) return NextResponse.json({ success: false, error: "Impossible de mettre à jour le collaborateur" }, { status: 500 })
  if (!data) return NextResponse.json({ success: false, error: "Collaborateur introuvable" }, { status: 404 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const { id } = await context.params
  const { error } = await (supabaseAdmin as any).from("employees").delete().eq("id", id)
  if (error) return NextResponse.json({ success: false, error: "Impossible de supprimer le collaborateur" }, { status: 500 })
  return NextResponse.json({ success: true })
}
