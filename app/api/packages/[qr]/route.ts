import { NextRequest, NextResponse } from 'next/server'
import { trackingApi } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'

export async function GET(request: NextRequest, context: { params: Promise<{ qr: string }> }) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { qr } = await context.params
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('qr_code', qr)
      .maybeSingle()
    const pkg = packageData as Database['public']['Tables']['packages']['Row'] | null

    if (packageError) throw packageError

    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 })
    }

    const [clientResult, containerResult, events] = await Promise.all([
      pkg.client_id
        ? supabaseAdmin.from('customers').select('*').eq('id', pkg.client_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      pkg.container_id
        ? supabaseAdmin.from('containers').select('*').eq('id', pkg.container_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      pkg.container_id ? trackingApi.getByOrderId(pkg.container_id) : Promise.resolve([]),
    ])

    if (clientResult.error) throw clientResult.error
    if (containerResult.error) throw containerResult.error

    return NextResponse.json({
      success: true,
      data: {
        package: pkg,
        client: clientResult.data,
        container: containerResult.data,
        events,
      },
    })
  } catch (error) {
    console.error('Error fetching package by QR:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch package' }, { status: 500 })
  }
}


