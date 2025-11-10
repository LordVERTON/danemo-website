import { NextRequest, NextResponse } from 'next/server'
import { notifyContainerStatusChange } from '@/lib/container-notifications'

// POST /api/notifications/container-event
// Body: { container_id: string, event: 'depart'|'arrive'|'deliver'|'delay', message?: string }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const containerId = String(body.container_id || '')
    const event = String(body.event || '')
    if (!containerId || !event) {
      return NextResponse.json({ success: false, error: 'Missing container_id or event' }, { status: 400 })
    }
    const eventToStatus: Record<string, 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'> = {
      depart: 'departed',
      arrive: 'arrived',
      deliver: 'delivered',
      delay: 'delayed',
    }

    const nextStatus = eventToStatus[event] || 'in_transit'
    const result = await notifyContainerStatusChange(containerId, nextStatus, {
      customMessage: body.message,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ success: false, error: 'Failed to send notifications' }, { status: 500 })
  }
}


