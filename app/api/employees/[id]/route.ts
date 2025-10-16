import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface Employee {
  user_id: string
}

// GET /api/employees/[id] - Récupérer un employé par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Mettre à jour un employé
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validation des données
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Nom et email sont requis' },
        { status: 400 }
      )
    }
    
    // Récupérer l'employé pour avoir le user_id
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError) throw fetchError
    if (!employee) throw new Error('Employee not found')

    // Mettre à jour l'utilisateur auth si email, role ou password changé
    if (body.email || body.role || body.password) {
      const updateData: any = {}
      if (body.email) updateData.email = body.email
      if (body.role) updateData.user_metadata = { role: body.role }
      if (body.password && body.password.trim() !== '') {
        updateData.password = body.password
      }
      
      await supabaseAdmin.auth.admin.updateUserById((employee as Employee).user_id, updateData)
    }

    // Mettre à jour l'employé
    const updateData: any = {
      name: body.name,
      email: body.email,
      role: body.role,
      salary: body.salary,
      position: body.position,
      hire_date: body.hire_date,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await (supabaseAdmin as any)
      .from('employees')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Supprimer un employé
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'employé pour avoir le user_id
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError) throw fetchError
    if (!employee) throw new Error('Employee not found')

    // Supprimer l'employé de la table employees
    const { error: deleteError } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', params.id)
    
    if (deleteError) throw deleteError

    // Supprimer l'utilisateur auth
    await supabaseAdmin.auth.admin.deleteUser((employee as Employee).user_id)
    
    return NextResponse.json({ success: true, message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
