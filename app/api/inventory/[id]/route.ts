import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/inventory/[id] - Récupérer un article d'inventaire par ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select(`
        *,
        containers (
          id,
          code
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Transform data to include container_code
    const item = data as any
    const transformedData = {
      ...item,
      container_code: item.containers?.code || null,
    }
    delete transformedData.containers // Remove the nested containers object
    
    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/[id] - Mettre à jour un article d'inventaire
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid inventory ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validation des données
    const allowedFields = ['type', 'reference', 'description', 'client', 'status', 'location', 'poids', 'dimensions', 'valeur', 'container_id']
    const updateData: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // Convert empty string container_id to null
        if (key === 'container_id' && value === '') {
          updateData[key] = null
        } else {
          updateData[key] = value
        }
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }
    
    const { data, error } = await (supabaseAdmin as any)
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/[id] - Supprimer un article d'inventaire
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { error } = await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
