import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function hasStaffSession(): Promise<boolean> {
  return Boolean(await getServerSession(authOptions))
}

export async function requireStaffApiAccess() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  return null
}

export async function requireAdminApiAccess() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
  }
  return null
}
