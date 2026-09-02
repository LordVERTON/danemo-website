import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await (supabaseAdmin as any).from("containers").select("code, departure_port, arrival_port, etd, eta, status").in("status", ["planned", "departed", "in_transit"]).order("etd", { ascending: true }).limit(1)
    if (error) throw error
    return NextResponse.json({ success: true, data: data?.[0] || null })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Impossible de charger le prochain départ" }, { status: 500 })
  }
}
