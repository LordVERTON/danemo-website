import { NextRequest, NextResponse } from 'next/server'
import { trackingApi, ordersApi } from '@/lib/database'

// Helper function to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET /api/orders/[id]/tracking - Récupérer les événements de suivi d'une commande
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Determine if the parameter is a UUID (ID) or a QR code
    const isId = isUUID(id)
    
    let orderId = id
    if (!isId) {
      // Get order by QR code to find the actual ID
      const order = await ordersApi.getByQr(id)
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        )
      }
      orderId = order.id
    }
    
    const events = await trackingApi.getByOrderId(orderId)
    
    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('Error fetching tracking events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking events' },
      { status: 500 }
    )
  }
}

// POST /api/orders/[id]/tracking - Ajouter un événement de suivi (par ID ou QR code)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    // Determine if the parameter is a UUID (ID) or a QR code
    const isId = isUUID(id)
    
    let order
    let orderId = id
    
    if (isId) {
      // Get order by ID
      order = await ordersApi.getById(id)
    } else {
      // Get order by QR code
      order = await ordersApi.getByQr(id)
      if (order) {
        orderId = order.id
      }
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Ajouter l'événement
    const event = await trackingApi.addEvent({
      order_id: orderId,
      status: body.status || order.status,
      location: body.location || null,
      description: body.description || (isId ? null : `Scan QR: ${id}`),
      operator: body.operator || null,
      event_date: body.event_date || new Date().toISOString(),
    })

    // Si un nouveau statut est fourni, mettre à jour la commande
    if (body.status && body.status !== order.status) {
      await ordersApi.update(orderId, { status: body.status })
    }

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('Error adding tracking event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add tracking event' },
      { status: 500 }
    )
  }
}
