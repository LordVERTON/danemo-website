import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/employees/[id]/activities - Récupérer les activités d'un employé
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const activityType = searchParams.get('type')

    let query = supabaseAdmin
      .from('employee_activities')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (activityType && activityType !== 'all') {
      query = query.eq('activity_type', activityType)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching employee activities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee activities' },
      { status: 500 }
    )
  }
}

// POST /api/employees/[id]/activities - Ajouter une activité
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('employee_activities')
      .insert({
        employee_id: id,
        ...body,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error adding employee activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add employee activity' },
      { status: 500 }
    )
  }
}
