import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/inventory - Récupérer tous les articles d'inventaire
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`reference.ilike.%${search}%,description.ilike.%${search}%,client.ilike.%${search}%`)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST /api/inventory - Créer un nouvel article d'inventaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
