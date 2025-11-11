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
      .select(`
        *,
        containers (
          id,
          code
        )
      `)
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

    // Transform data to include container_code
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      container_code: item.containers?.code || null,
      containers: undefined // Remove the nested containers object
    }))

    return NextResponse.json({ success: true, data: transformedData })
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
    
    // Convert empty string container_id to null
    const insertData = {
      ...body,
      container_id: body.container_id && body.container_id !== '' ? body.container_id : null
    }
    
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .insert(insertData)
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
