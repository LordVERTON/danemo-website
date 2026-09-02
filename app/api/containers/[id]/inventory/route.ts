import { NextRequest, NextResponse } from "next/server"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export async function GET() {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  return NextResponse.json({ success: true, data: [] })
}
