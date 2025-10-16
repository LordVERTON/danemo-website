import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/orders/[id]/history - Récupérer l'historique des modifications d'une commande
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validation de l'ID
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Pour l'instant, retourner un historique vide jusqu'à ce que la table soit créée
    // TODO: Une fois la table order_history créée, décommenter le code ci-dessous
    
    /*
    // Récupérer l'historique depuis la table order_history
    const { data: history, error } = await supabaseAdmin
      .from('order_history')
      .select(`
        *,
        user:user_id (
          name,
          email
        )
      `)
      .eq('order_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching order history:', error)
      
      // Si la table n'existe pas encore, retourner un historique vide
      if (error.code === 'PGRST116' || error.message.includes('relation "order_history" does not exist')) {
        console.log('Order history table does not exist yet, returning empty history')
        return NextResponse.json({ success: true, data: [] })
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch order history' },
        { status: 500 }
      )
    }

    // Formater les données pour l'affichage
    const formattedHistory = history?.map(item => ({
      id: item.id,
      action: item.action,
      description: item.description,
      changes: item.changes,
      created_at: item.created_at,
      user_name: item.user?.name || 'Système',
      user_email: item.user?.email
    })) || []

    return NextResponse.json({ success: true, data: formattedHistory })
    */

    // Retourner un historique vide pour l'instant
    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error('Error fetching order history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order history' },
      { status: 500 }
    )
  }
}
