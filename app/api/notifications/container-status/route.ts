import { NextRequest, NextResponse } from "next/server"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export async function POST(_request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  return NextResponse.json({ success: true, data: { sent: 0, simulated: true } })
}
