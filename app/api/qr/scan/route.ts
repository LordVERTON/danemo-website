import { NextRequest, NextResponse } from 'next/server'
import { packagesApi, trackingApi } from '@/lib/database'

// POST /api/qr/scan
// Body: { qr: string, status?: Package['status'], location?: string, description?: string, operator?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const qr = String(body.qr || '').trim()
    if (!qr) {
      return NextResponse.json({ success: false, error: 'Missing qr' }, { status: 400 })
    }
    const pkg = await packagesApi.getByQr(qr)
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 })
    }
    const nextStatus = (body.status as typeof pkg.status) || pkg.status
    const updated = await packagesApi.updateStatus(pkg.id, nextStatus, {})
    // Mirror to tracking_events (linked to orders if applicable)
    try {
      if (pkg.container_id) {
        await trackingApi.addEvent({
          order_id: pkg.container_id, // if you later separate order vs container, adjust
          status: nextStatus,
          location: body.location || null,
          description: body.description || `Scan QR: ${qr}`,
          operator: body.operator || null,
          event_date: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Could not add tracking event for QR scan:', e)
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error processing QR scan:', error)
    return NextResponse.json({ success: false, error: 'Failed to process scan' }, { status: 500 })
  }
}


