import { NextRequest, NextResponse } from 'next/server'
import { ordersApi, trackingApi } from '@/lib/database'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'
import { recordBusinessAudit } from '@/lib/business-audit'
import { z } from 'zod'

// POST /api/qr/scan
// Body: { qr: string, status?: Order['status'], location?: string, description?: string, operator?: string }
const scanSchema = z.object({
  qr: z.string().trim().min(1, 'Le code QR est requis.').max(255),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  location: z.string().trim().max(255).optional(),
  description: z.string().trim().max(2_000).optional(),
  operator: z.string().trim().max(255).optional(),
})

export async function POST(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  try {
    const parsed = scanSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données de scan invalides.' },
        { status: 400 },
      )
    }

    const { qr, status, location, description, operator } = parsed.data
    // Les QR actifs sont générés pour les commandes et sont résolus dans orders.
    const order = await ordersApi.getByQr(qr) || await ordersApi.getByOrderNumber(qr)
    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable pour ce code QR.' }, { status: 404 })
    }

    const nextStatus = status || order.status
    const updatedOrder = nextStatus === order.status
      ? order
      : await ordersApi.update(order.id, { status: nextStatus }, { notificationLocation: location })
    const event = await trackingApi.addEvent({
      order_id: order.id,
      status: nextStatus,
      location: location || null,
      description: description || `Scan QR : ${qr}`,
      operator: operator || null,
      event_date: new Date().toISOString(),
    })

    await recordBusinessAudit(request, {
      action: 'update',
      entityType: 'order',
      entityId: order.id,
      changedFields: nextStatus === order.status ? ['tracking_event'] : ['tracking_event', 'status'],
    })

    return NextResponse.json({
      success: true,
      data: { type: 'order', item: updatedOrder, event },
    })
  } catch (error) {
    console.error('Error processing QR scan:', error)
    return NextResponse.json({ success: false, error: 'Impossible de traiter le scan.' }, { status: 500 })
  }
}


