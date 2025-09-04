import { NextRequest, NextResponse } from 'next/server'
import { ordersApi } from '@/lib/database'

// GET /api/orders - Récupérer toutes les commandes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    let orders
    if (search) {
      orders = await ordersApi.search(search)
    } else if (status) {
      orders = await ordersApi.getByStatus(status)
    } else {
      orders = await ordersApi.getAll()
    }

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Générer un numéro de commande unique
    const orderNumber = await ordersApi.generateOrderNumber()
    
    const orderData = {
      ...body,
      order_number: orderNumber,
      status: 'pending' as const
    }

    const order = await ordersApi.create(orderData)
    
    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
