import { NextRequest, NextResponse } from 'next/server'
import { containersApi } from '@/lib/database'
import { notifyContainerStatusChange } from '@/lib/container-notifications'

// GET /api/containers/[id]
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const container = await containersApi.getById(id)
    if (!container) {
      return NextResponse.json({ success: false, error: 'Container not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: container })
  } catch (error) {
    console.error('Error fetching container:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch container' }, { status: 500 })
  }
}

// PUT /api/containers/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const current = await containersApi.getById(id)
    if (!current) {
      return NextResponse.json({ success: false, error: 'Container not found' }, { status: 404 })
    }
    const body = await request.json()
    const updates: any = {}
    ;['code', 'vessel', 'departure_port', 'arrival_port', 'etd', 'eta', 'status', 'client_id'].forEach((k) => {
      if (body[k] !== undefined) updates[k] = body[k]
    })
    const updated = await containersApi.update(id, updates)

    if (updates.status && updates.status !== current.status) {
      notifyContainerStatusChange(id, updates.status, {
        previousStatus: current.status,
        customMessage: body.notificationMessage,
      }).catch((error) => {
        console.error('Failed to dispatch container status notifications:', error)
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating container:', error)
    return NextResponse.json({ success: false, error: 'Failed to update container' }, { status: 500 })
  }
}

// DELETE /api/containers/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await containersApi.delete(id)
    return NextResponse.json({ success: true, message: 'Container deleted successfully' })
  } catch (error) {
    console.error('Error deleting container:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete container' }, { status: 500 })
  }
}


