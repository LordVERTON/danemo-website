import { NextRequest, NextResponse } from 'next/server'
import { ordersApi } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/orders/[id] - Récupérer une commande par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await ordersApi.getById(params.id)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { user_id, user_name, ...orderData } = body
    
    // Récupérer l'ancienne commande pour comparer les changements
    const oldOrder = await ordersApi.getById(params.id)
    if (!oldOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Mettre à jour la commande
    const order = await ordersApi.update(params.id, orderData)
    
    // TODO: Activer l'historique une fois la table order_history créée
    /*
    // Créer un historique manuel si l'utilisateur est fourni
    if (user_id || user_name) {
      try {
        await supabaseAdmin
          .from('order_history')
          .insert({
            order_id: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    await ordersApi.delete(params.id)
    
    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
