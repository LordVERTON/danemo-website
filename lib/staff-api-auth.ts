import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export type StaffApiRole = "admin" | "operator"

async function getStaffRole(request: NextRequest): Promise<StaffApiRole | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })

  return token?.role === "admin" || token?.role === "operator" ? token.role : null
}

export async function isStaffApiRequest(request: NextRequest): Promise<boolean> {
  return (await getStaffRole(request)) !== null
}

export async function requireStaffApiAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const role = await getStaffRole(request)
  if (!role) {
    return NextResponse.json(
      { success: false, error: "Authentication required or insufficient permissions" },
      { status: 401 },
    )
  }

  return null
}

export async function requireAdminApiAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const role = await getStaffRole(request)
  if (!role) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    )
  }
  if (role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    )
  }

  return null
}
