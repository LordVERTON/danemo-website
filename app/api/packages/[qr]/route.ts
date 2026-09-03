import { NextRequest, NextResponse } from 'next/server'
import { packagesApi, customersApi, containersApi, trackingApi } from '@/lib/database'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'

export async function GET(request: NextRequest, context: { params: Promise<{ qr: string }> }) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  try {
    const { qr } = await context.params
    let pkg: Awaited<ReturnType<typeof packagesApi.getByQr>> | null = null
    try {
      pkg = await packagesApi.getByQr(qr)
    } catch (error: any) {
      const code = error?.code || error?.message
      if (code && String(code).includes('PGRST116')) {
        return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 })
      }
      throw error
    }

    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 })
    }

    const [client, container, events] = await Promise.all([
      pkg.client_id ? customersApi.getById(pkg.client_id) : Promise.resolve(null),
      pkg.container_id ? containersApi.getById(pkg.container_id) : Promise.resolve(null),
      pkg.container_id ? trackingApi.getByOrderId(pkg.container_id) : Promise.resolve([]),
    ])

    return NextResponse.json({
      success: true,
      data: {
        package: pkg,
        client,
        container,
        events,
      },
    })
  } catch (error) {
    console.error('Error fetching package by QR:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch package' }, { status: 500 })
  }
}


