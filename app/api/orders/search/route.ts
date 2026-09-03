import { NextRequest, NextResponse } from 'next/server'
import { ordersApi } from '@/lib/database'

// GET /api/orders/search - Rechercher des commandes (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tracking = searchParams.get('tracking')

    if (!tracking) {
      return NextResponse.json(
        { success: false, error: 'Numéro de suivi requis' },
        { status: 400 }
      )
    }

    let orders: any[] = []
    const trimmed = String(tracking).trim()
    let order = await ordersApi.getByOrderNumber(trimmed)
    if (!order) order = await ordersApi.getFirstByContainerCode(trimmed)
    orders = order ? [order] : []

    // Le suivi public ne divulgue ni coordonnées ni informations financières.
    const publicOrders = orders.map((order) => ({
      order_number: order.order_number,
      service_type: order.service_type,
      origin: order.origin,
      destination: order.destination,
      status: order.status,
      estimated_delivery: order.estimated_delivery,
      updated_at: order.updated_at,
      container_code: order.container_code ?? null,
      container_status: order.container_status ?? null,
    }))

    return NextResponse.json({ success: true, data: publicOrders })
  } catch (error) {
    console.error('Error searching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search orders' },
      { status: 500 }
    )
  }
}
