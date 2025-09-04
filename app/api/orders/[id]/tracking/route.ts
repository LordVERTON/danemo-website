import { NextRequest, NextResponse } from 'next/server'
import { trackingApi, ordersApi } from '@/lib/database'

// GET /api/orders/[id]/tracking - Récupérer les événements de suivi d'une commande
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const events = await trackingApi.getByOrderId(params.id)
    
    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('Error fetching tracking events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking events' },
      { status: 500 }
    )
  }
}

// POST /api/orders/[id]/tracking - Ajouter un événement de suivi
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Vérifier que la commande existe
    const order = await ordersApi.getById(params.id)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Ajouter l'événement
    const event = await trackingApi.addEvent({
      order_id: params.id,
      ...body
    })

    // Si un nouveau statut est fourni, mettre à jour la commande
    if (body.status && body.status !== order.status) {
      await ordersApi.update(params.id, { status: body.status })
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
