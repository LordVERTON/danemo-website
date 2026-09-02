import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

async function recipients(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const { data, error } = await (supabaseAdmin as any).from("customers").select("id, name, phone, city").not("phone", "is", null)
  if (error) throw error
  const mode = searchParams.get("mode") || "all"
  const city = searchParams.get("city")
  return (data || []).filter((customer: any) => mode !== "city" || !city || customer.city === city)
}

export async function GET(request: NextRequest) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  try {
    const data = await recipients(request)
    return NextResponse.json({ success: true, data: { recipients: data.length, sample: data.slice(0, 5).map((customer: any) => ({ name: customer.name, phone: customer.phone })) } })
  } catch (error) {
    console.error("[messages.preview]", error)
    return NextResponse.json({ success: false, error: "Impossible de calculer les destinataires" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const body = await request.json()
  if (!String(body.message || "").trim()) return NextResponse.json({ success: false, error: "Le message est requis" }, { status: 400 })
  const data = await recipients(new NextRequest(new URL(`http://localhost?mode=${body.mode || "all"}&city=${encodeURIComponent(body.city || "")}`)))
  return NextResponse.json({ success: true, data: { recipients: data.length, sent: 0, failed: 0, simulated: true } })
}
