import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export async function GET(_request: NextRequest, context: { params: Promise<{ qr: string }> }) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { qr } = await context.params
    const { data: pkg, error } = await (supabaseAdmin as any).from("packages").select("*").eq("qr_code", qr).maybeSingle()
    if (error) throw error
    if (!pkg) return NextResponse.json({ success: false, error: "Colis introuvable" }, { status: 404 })
    const [{ data: customer }, { data: container }] = await Promise.all([
      pkg.client_id ? (supabaseAdmin as any).from("customers").select("*").eq("id", pkg.client_id).maybeSingle() : Promise.resolve({ data: null }),
      pkg.container_id ? (supabaseAdmin as any).from("containers").select("*").eq("id", pkg.container_id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    return NextResponse.json({ success: true, data: { package: pkg, customer, container } })
  } catch (error) {
    console.error("[packages.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer le colis" }, { status: 500 })
  }
}
