import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const PUBLIC_TRACKING_FIELDS = [
  'id',
  'order_number',
  'service_type',
  'origin',
  'destination',
  'status',
  'estimated_delivery',
  'updated_at',
  'container_id',
  'container_code',
].join(', ')

// GET /api/orders/search - Rechercher des commandes (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tracking = searchParams.get('tracking')?.trim()

    if (!tracking) {
      return NextResponse.json(
        { success: false, error: 'Numéro de suivi requis' },
        { status: 400 }
      )
    }

    // Cette route publique reste côté serveur : service_role contourne les
    // restrictions RLS sans exposer les données client au navigateur.
    const { data: orderByNumber, error: orderByNumberError } = await supabaseAdmin
      .from('orders')
      .select(PUBLIC_TRACKING_FIELDS)
      .eq('order_number', tracking)
      .maybeSingle()

    if (orderByNumberError) {
      throw orderByNumberError
    }

    let order = orderByNumber
    if (!order) {
      const { data: orderByContainerCode, error: orderByContainerCodeError } = await supabaseAdmin
        .from('orders')
        .select(PUBLIC_TRACKING_FIELDS)
        .eq('container_code', tracking)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (orderByContainerCodeError) {
        throw orderByContainerCodeError
      }

      order = orderByContainerCode
    }

    return NextResponse.json({ success: true, data: order ? [order] : [] })
  } catch (error) {
    console.error('Error searching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search orders' },
      { status: 500 }
    )
  }
}
