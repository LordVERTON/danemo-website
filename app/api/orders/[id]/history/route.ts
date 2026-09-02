import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { id } = await context.params
    const { data, error } = await (supabaseAdmin as any).from("order_history").select("id, action, description, changes, created_at").eq("order_id", id).order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[orders.history]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer l’historique" }, { status: 500 })
  }
}
