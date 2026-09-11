import "server-only"

import { supabaseAdmin } from "@/lib/supabase"

export type StaffRole = "admin" | "operator"

export type ActiveStaffUser = {
  email: string | null
  role: StaffRole
}

type EmployeeAuthorizationRecord = {
  is_active: boolean
  role: unknown
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "operator"
}

/**
 * Resolves a staff role from server-controlled sources only.
 *
 * `user_metadata` must never be used for authorization: Supabase users can
 * update it themselves. A user needs matching `app_metadata` and an active
 * employee record to be considered staff.
 */
export async function getActiveStaffUser(userId: string): Promise<ActiveStaffUser | null> {
  if (!userId) return null

  const [authResult, employeeResult] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin
      .from("employees")
      .select("role, is_active")
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  if (authResult.error || employeeResult.error || !authResult.data.user) {
    return null
  }

  const role = authResult.data.user.app_metadata?.role
  const employee = employeeResult.data as EmployeeAuthorizationRecord | null

  if (!isStaffRole(role) || !employee?.is_active || employee.role !== role) {
    return null
  }

  return {
    email: authResult.data.user.email ?? null,
    role,
  }
}
