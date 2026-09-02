import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

export async function GET() {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const startedAt = Date.now()
  try {
    const { error } = await (supabaseAdmin as any).from("containers").select("id", { head: true, count: "exact" })
    if (error) throw error
    return NextResponse.json({ success: true, data: { status: "ok", database: "ok", latencyMs: Date.now() - startedAt, timestamp: new Date().toISOString() } })
  } catch (error) {
    return NextResponse.json({ success: false, data: { status: "degraded", database: "unavailable", latencyMs: Date.now() - startedAt, timestamp: new Date().toISOString() } }, { status: 503 })
  }
}
