import { NextRequest, NextResponse } from "next/server"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

function decodeCity(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// GET /api/locations/city
// La ville est estimée à partir de l’adresse IP par l’hébergeur ; aucune position GPS n’est demandée.
export async function GET(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  const cityHeader = request.headers.get("x-vercel-ip-city")
  const city = cityHeader ? decodeCity(cityHeader).trim() : ""

  if (!city) {
    return NextResponse.json({ success: false, error: "La ville ne peut pas être estimée à partir de cette adresse IP." }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: { city } })
}
