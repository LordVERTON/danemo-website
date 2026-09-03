import { NextRequest, NextResponse } from "next/server"
import { requireAdminApiAccess } from "@/lib/staff-api-auth"

/**
 * Demo-data routes must never be callable in production. The optional key is
 * retained as a second factor for local environments where these routes exist.
 */
export async function requireDevelopmentSeedAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const authError = await requireAdminApiAccess(request)
  if (authError) return authError

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  const seedKey = process.env.ADMIN_SEED_KEY
  if (!seedKey || request.headers.get("x-admin-seed-key") !== seedKey) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  return null
}
