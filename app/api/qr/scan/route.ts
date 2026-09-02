import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

const orderStatuses = new Set(["pending", "confirmed", "in_progress", "completed", "cancelled"])
const packageStatuses = new Set(["preparation", "expedie", "en_transit", "arrive_port", "dedouane", "livre"])

export async function POST(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const body = await request.json()
    const code = String(body.qr || "").trim()
    if (!code) return NextResponse.json({ success: false, error: "Code QR requis" }, { status: 400 })
    const { data: pkg, error: packageError } = await (supabaseAdmin as any).from("packages").select("*").eq("qr_code", code).maybeSingle()
    if (!packageError && pkg) {
      const status = packageStatuses.has(body.status) ? body.status : pkg.status
      const { data, error } = await (supabaseAdmin as any).from("packages").update({ status, last_scan_at: new Date().toISOString() }).eq("id", pkg.id).select("*").single()
      if (error) throw error
      return NextResponse.json({ success: true, data: { type: "package", item: data } })
    }
    const { data: order, error: orderError } = await (supabaseAdmin as any).from("orders").select("*").or(`qr_code.eq.${code},order_number.eq.${code}`).maybeSingle()
    if (orderError) throw orderError
    if (!order) return NextResponse.json({ success: false, error: "Aucun colis ni commande ne correspond à ce code" }, { status: 404 })
    const status = orderStatuses.has(body.status) ? body.status : order.status
    const { data, error } = await (supabaseAdmin as any).from("orders").update({ status }).eq("id", order.id).select("*").single()
    if (error) throw error
    if (status !== order.status || body.location || body.description) {
      await (supabaseAdmin as any).from("tracking_events").insert({ order_id: order.id, status, location: body.location || null, description: body.description || `Mise à jour via scan QR ${code}`, event_date: new Date().toISOString() })
    }
    return NextResponse.json({ success: true, data: { type: "order", item: data } })
  } catch (error) {
    console.error("[qr.scan]", error)
    return NextResponse.json({ success: false, error: "Impossible de traiter le scan QR" }, { status: 500 })
  }
}
