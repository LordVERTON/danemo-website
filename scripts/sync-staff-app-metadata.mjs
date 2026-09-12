import nextEnv from "@next/env"
import { createClient } from "@supabase/supabase-js"

const { loadEnvConfig } = nextEnv

const PAGE_SIZE = 1000

function isStaffRole(value) {
  return value === "admin" || value === "operator"
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function getMode() {
  const argumentsList = process.argv.slice(2)
  if (argumentsList.length === 0 || argumentsList.every((argument) => argument === "--dry-run")) {
    return "dry-run"
  }

  if (argumentsList.length === 1 && argumentsList[0] === "--apply") {
    return "apply"
  }

  throw new Error("Usage: node scripts/sync-staff-app-metadata.mjs [--dry-run|--apply]")
}

async function listAllAuthUsers(supabaseAdmin) {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error("Unable to read authentication accounts")

    const pageUsers = data.users || []
    users.push(...pageUsers)
    if (pageUsers.length < PAGE_SIZE) return users
    page += 1
  }
}

async function listAllEmployees(supabaseAdmin) {
  const employees = []
  let from = 0

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("user_id, role, is_active")
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error("Unable to read employee records")

    const pageEmployees = data || []
    employees.push(...pageEmployees)
    if (pageEmployees.length < PAGE_SIZE) return employees
    from += PAGE_SIZE
  }
}

async function main() {
  const mode = getMode()
  loadEnvConfig(process.cwd())

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing required Supabase server configuration")
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const [employees, authUsers] = await Promise.all([
    listAllEmployees(supabaseAdmin),
    listAllAuthUsers(supabaseAdmin),
  ])
  const authUsersById = new Map(authUsers.map((user) => [user.id, user]))
  const summary = {
    mode,
    employees: employees.length,
    authentication_accounts: authUsers.length,
    updates_required: 0,
    changes_applied: 0,
    missing_authentication_account: 0,
    invalid_employee_role: 0,
    failed_updates: 0,
  }

  for (const employee of employees) {
    if (!employee.user_id || !isStaffRole(employee.role)) {
      summary.invalid_employee_role += 1
      continue
    }

    const authUser = authUsersById.get(employee.user_id)
    if (!authUser) {
      summary.missing_authentication_account += 1
      continue
    }

    if (authUser.app_metadata?.role === employee.role) continue
    summary.updates_required += 1

    if (mode !== "apply") continue

    const { error } = await supabaseAdmin.auth.admin.updateUserById(employee.user_id, {
      app_metadata: {
        ...asRecord(authUser.app_metadata),
        role: employee.role,
      },
    })

    if (error) {
      summary.failed_updates += 1
      continue
    }

    summary.changes_applied += 1
  }

  console.log(JSON.stringify(summary))

  if (
    summary.missing_authentication_account > 0 ||
    summary.invalid_employee_role > 0 ||
    summary.failed_updates > 0
  ) {
    process.exitCode = 1
  }
}

main().catch(() => {
  console.error("Staff-role synchronization did not complete.")
  process.exitCode = 1
})
