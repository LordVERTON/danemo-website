import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

export async function GET() {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  try {
    const { data, error } = await (supabaseAdmin as any).from("employees").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[employees.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer les collaborateurs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  try {
    const body = await request.json()
    if (!body.name || !body.email || !body.password) return NextResponse.json({ success: false, error: "Nom, email et mot de passe requis" }, { status: 400 })
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { role: body.role === "admin" ? "admin" : "operator", name: body.name } })
    if (authError) return NextResponse.json({ success: false, error: "Impossible de créer le compte" }, { status: 400 })
    const { data, error } = await (supabaseAdmin as any).from("employees").insert({ user_id: authData.user.id, name: body.name, email: body.email, role: body.role === "admin" ? "admin" : "operator", salary: Number(body.salary || 0), position: body.position || "Collaborateur", hire_date: body.hire_date || new Date().toISOString().slice(0, 10), is_active: body.is_active !== false }).select().single()
    if (error) throw error
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("[employees.post]", error)
    return NextResponse.json({ success: false, error: "Impossible de créer le collaborateur" }, { status: 500 })
  }
}
