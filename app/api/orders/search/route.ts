import { NextRequest, NextResponse } from 'next/server'
import { ordersApi } from '@/lib/database'

// GET /api/orders/search - Rechercher des commandes (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tracking = searchParams.get('tracking')
    const email = searchParams.get('email')

    if (!tracking && !email) {
      return NextResponse.json(
        { success: false, error: 'Numéro de suivi ou email requis' },
        { status: 400 }
      )
    }

    let orders
    if (tracking) {
      // Recherche par numéro de commande
      const order = await ordersApi.getByOrderNumber(tracking)
      orders = order ? [order] : []
    } else if (email) {
      // Recherche par email client
      orders = await ordersApi.search(email)
    }

    // Retourner seulement les informations publiques (sans données sensibles)
    const publicOrders = orders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      client_name: order.client_name,
      client_email: order.client_email,
      service_type: order.service_type,
      origin: order.origin,
      destination: order.destination,
      weight: order.weight,
      value: order.value,
      status: order.status,
      estimated_delivery: order.estimated_delivery,
      created_at: order.created_at,
      updated_at: order.updated_at
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
