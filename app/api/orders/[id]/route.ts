import { NextRequest, NextResponse } from 'next/server'
import { ordersApi } from '@/lib/database'
import { hasStaffSession } from '@/lib/staff-api-auth'

// GET /api/orders/[id] - Récupérer une commande par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await hasStaffSession())) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const { id } = await params
    const order = await ordersApi.getById(id)
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Mettre à jour une commande
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await hasStaffSession())) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const order = await ordersApi.update(id, body)
    
    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Supprimer une commande
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await hasStaffSession())) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const { id } = await params
    await ordersApi.delete(id)
    
    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
