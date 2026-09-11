import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireDevelopmentSeedAccess } from '@/lib/admin-seed-auth'

function getConfiguredSeedUsers() {
  const adminEmail = process.env.DANEMO_DEMO_ADMIN_EMAIL?.trim()
  const adminPassword = process.env.DANEMO_DEMO_ADMIN_PASSWORD
  const operatorEmail = process.env.DANEMO_DEMO_OPERATOR_EMAIL?.trim()
  const operatorPassword = process.env.DANEMO_DEMO_OPERATOR_PASSWORD

  if (!adminEmail || !adminPassword || !operatorEmail || !operatorPassword) {
    return null
  }

  return [
    { email: adminEmail, password: adminPassword, user_metadata: { role: 'admin' } },
    { email: operatorEmail, password: operatorPassword, user_metadata: { role: 'operator' } },
  ]
}

export async function POST(request: NextRequest) {
  const authError = await requireDevelopmentSeedAccess(request)
  if (authError) return authError

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin not initialized' }, { status: 500 })
    }

    const usersToCreate = getConfiguredSeedUsers()
    if (!usersToCreate) {
      return NextResponse.json(
        { success: false, error: 'La configuration des comptes de démonstration est incomplète.' },
        { status: 503 },
      )
    }

    const results: Array<{ email: string; ok: boolean; message?: string; id?: string }> = []

    for (const u of usersToCreate) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: u.user_metadata,
      })
      if (error) {
        // If user already exists, treat as success for idempotency
        const msg = error.message || 'Unknown error'
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          results.push({ email: u.email, ok: true, message: 'Already exists' })
          continue
        }
        console.error('[seed-users] Unable to create a demo user')
        results.push({ email: u.email, ok: false, message: 'Unable to create user' })
      } else {
        results.push({ email: u.email, ok: true, id: data.user?.id })
      }
    }

    const allOk = results.every(r => r.ok)
    return NextResponse.json({ success: allOk, results }, { status: allOk ? 200 : 207 })
  } catch {
    console.error('[seed-users] Unexpected seed failure')
    return NextResponse.json(
      { success: false, error: 'Failed to seed users' },
      { status: 500 }
    )
  }
}


