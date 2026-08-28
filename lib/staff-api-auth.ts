import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function isStaffApiRequest(request: NextRequest): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })

  return token?.role === "admin" || token?.role === "operator"
}

export async function requireStaffApiAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    )
  }

  if (token.role !== "admin" && token.role !== "operator") {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    )
  }

  return null
}
