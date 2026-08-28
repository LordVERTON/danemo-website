import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Simple protection: require a header that matches an env key
    const seedKey = process.env.ADMIN_SEED_KEY
    const providedKey = request.headers.get('x-admin-seed-key')
    if (!seedKey || providedKey !== seedKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin not initialized' }, { status: 500 })
    }

    const usersToCreate = [
      { email: 'admin@danemo.be', password: 'admin123', user_metadata: { role: 'admin' } },
      { email: 'operator@danemo.be', password: 'operator123', user_metadata: { role: 'operator' } },
    ]

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
        results.push({ email: u.email, ok: false, message: msg })
      } else {
        results.push({ email: u.email, ok: true, id: data.user?.id })
      }
    }

    const allOk = results.every(r => r.ok)
    return NextResponse.json({ success: allOk, results }, { status: allOk ? 200 : 207 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed users' },
      { status: 500 }
    )
  }
}


