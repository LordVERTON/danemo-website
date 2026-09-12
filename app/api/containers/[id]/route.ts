import { NextRequest, NextResponse } from 'next/server'
import { containersApi } from '@/lib/database'
import { notifyContainerStatusChange } from '@/lib/container-notifications'
import { toPublicContainer } from '@/lib/public-container'
import { isStaffApiRequest, requireStaffApiAccess } from '@/lib/staff-api-auth'
import { recordBusinessAudit } from '@/lib/business-audit'

// GET /api/containers/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const container = await containersApi.getById(id)
    if (!container) {
      return NextResponse.json({ success: false, error: 'Container not found' }, { status: 404 })
    }
    const isStaff = await isStaffApiRequest(request)
    return NextResponse.json({
      success: true,
      data: isStaff ? container : toPublicContainer(container),
    })
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
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

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

    await recordBusinessAudit(request, {
      action: 'update',
      entityType: 'container',
      entityId: id,
      changedFields: Object.keys(updates),
    })

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
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { id } = await context.params
    await containersApi.delete(id)
    await recordBusinessAudit(request, {
      action: 'delete',
      entityType: 'container',
      entityId: id,
    })
    return NextResponse.json({ success: true, message: 'Container deleted successfully' })
  } catch (error) {
    console.error('Error deleting container:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete container' }, { status: 500 })
  }
}


