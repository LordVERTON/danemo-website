import { NextRequest, NextResponse } from 'next/server'
import { ordersApi, containersApi, trackingApi, customersApi } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET /api/orders/[id] - Récupérer une commande par ID ou QR code
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Determine if the parameter is a UUID (ID) or a QR code
    const isId = isUUID(id)
    
    let order
    if (isId) {
      // Try to get by ID first
      order = await ordersApi.getById(id)
    } else {
      // Try to get by QR code
      order = await ordersApi.getByQr(id)
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // If it was a QR code lookup, return with related data (like the old [qr] route)
    if (!isId) {
      const [container, events, customer] = await Promise.all([
        order.container_id ? containersApi.getById(order.container_id).catch(() => null) : Promise.resolve(null),
        trackingApi.getByOrderId(order.id).catch(() => []),
        order.client_email ? customersApi.getByEmail(order.client_email).catch(() => null) : Promise.resolve(null),
      ])

      return NextResponse.json({
        success: true,
        data: {
          order,
          container,
          events: events || [],
          customer,
        },
      })
    }

    // For ID lookups, return just the order (existing behavior)
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { user_id, user_name, ...orderData } = body
    
    // Determine if the parameter is a UUID (ID) or a QR code
    const isId = isUUID(id)
    
    // Get the order first to find the actual ID if QR code was provided
    let orderId = id
    if (!isId) {
      const order = await ordersApi.getByQr(id)
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        )
      }
      orderId = order.id
    }
    
    // Récupérer l'ancienne commande pour comparer les changements
    const oldOrder = await ordersApi.getById(orderId)
    if (!oldOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Mettre à jour la commande
    const order = await ordersApi.update(orderId, orderData)
    
    // TODO: Activer l'historique une fois la table order_history créée
    /*
    // Créer un historique manuel si l'utilisateur est fourni
    if (user_id || user_name) {
      try {
        await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: id,
            user_id: user_id || null,
            action: 'update',
            description: 'Modification de la commande',
            changes: {
              modified_by: user_name || 'Utilisateur inconnu',
              timestamp: new Date().toISOString()
            }
          })
      } catch (historyError) {
        console.error('Error creating order history:', historyError)
        // Si la table n'existe pas encore, c'est normal
        if (historyError.code === 'PGRST116' || historyError.message?.includes('relation "order_history" does not exist')) {
          console.log('Order history table does not exist yet, skipping history creation')
        }
        // Ne pas faire échouer la mise à jour si l'historique échoue
      }
    }
    */
    
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
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

// PATCH /api/orders/[id] - Actions spéciales sur une commande (comme générer QR code)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const action = body.action

    if (action === 'generate-qr') {
      // Determine if the parameter is a UUID (ID) or a QR code
      const isId = isUUID(id)
      
      // Get the order first to find the actual ID if QR code was provided
      let orderId = id
      let order
      if (isId) {
        order = await ordersApi.getById(id)
        orderId = id
      } else {
        order = await ordersApi.getByQr(id)
        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          )
        }
        orderId = order.id
      }
      
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        )
      }

      // Si la commande a déjà un QR code, le retourner
      if (order.qr_code) {
        return NextResponse.json({
          success: true,
          data: { qr_code: order.qr_code },
          message: 'Order already has a QR code'
        })
      }

      // Générer un nouveau QR code unique
      // Format: ORD-{timestamp}-{random}
      let qrCode: string = ''
      let exists = true
      let attempts = 0
      const maxAttempts = 10

      while (exists && attempts < maxAttempts) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        qrCode = `ORD-${timestamp}-${random}`
        
        // Vérifier si ce QR code existe déjà
        const { data: existing } = await (supabaseAdmin as any)
          .from('orders')
          .select('id')
          .eq('qr_code', qrCode)
          .single()
        
        exists = !!existing
        attempts++
      }

      if (attempts >= maxAttempts || !qrCode) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate unique QR code' },
          { status: 500 }
        )
      }

      // Mettre à jour la commande avec le nouveau QR code
      const updatedOrder = await ordersApi.update(orderId, { qr_code: qrCode })

      return NextResponse.json({
        success: true,
        data: { qr_code: qrCode, order: updatedOrder }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in PATCH order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}