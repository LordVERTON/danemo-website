import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: true, data: null })
  }

  try {
    const { data, error } = await supabase
      .from("containers")
      .select("id, code, vessel, departure_port, arrival_port, etd, eta, status")
      .eq("status", "planned")
      .not("etd", "is", null)
      .gte("etd", new Date().toISOString())
      .order("etd", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ success: true, data: data ?? null })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "42501"
    ) {
      return NextResponse.json({ success: true, data: null })
    }

    console.error("[public.upcoming-departure] error", error)
    return NextResponse.json(
      { success: false, error: "Failed to load upcoming departure" },
      { status: 500 },
    )
  }
}
