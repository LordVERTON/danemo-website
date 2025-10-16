import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/employees - Récupérer tous les employés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const isActive = searchParams.get('is_active')

    // Récupérer les employés depuis la table employees
    let query = supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`)
    }

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: employees, error: employeesError } = await query

    if (employeesError) throw employeesError

    // Récupérer les informations des utilisateurs auth pour chaque employé
    const employeesWithAuthData = await Promise.all(
      (employees || []).map(async (employee: any) => {
        try {
          // Récupérer les données de l'utilisateur auth
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(employee.user_id)
          
          if (authError) {
            console.warn(`Could not fetch auth data for user ${employee.user_id}:`, authError.message)
            return {
              ...employee,
              auth_user: null,
              last_sign_in_at: null,
              email_confirmed_at: null,
              created_at_auth: null
            }
          }

          return {
            ...employee,
            auth_user: {
              id: authUser.user.id,
              email: authUser.user.email,
              email_confirmed_at: authUser.user.email_confirmed_at,
              last_sign_in_at: authUser.user.last_sign_in_at,
              created_at: authUser.user.created_at,
              user_metadata: authUser.user.user_metadata
            },
            last_sign_in_at: authUser.user.last_sign_in_at,
            email_confirmed_at: authUser.user.email_confirmed_at,
            created_at_auth: authUser.user.created_at
          }
        } catch (error) {
          console.warn(`Error fetching auth data for employee ${employee.id}:`, error)
          return {
            ...employee,
            auth_user: null,
            last_sign_in_at: null,
            email_confirmed_at: null,
            created_at_auth: null
          }
        }
      })
    )

    return NextResponse.json({ success: true, data: employeesWithAuthData })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Créer un nouvel employé
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Vérifier que tous les champs requis sont présents
    const requiredFields = ['name', 'email', 'role', 'salary', 'position', 'hire_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Le champ ${field} est requis` },
          { status: 400 }
        )
      }
    }

    // Créer l'utilisateur dans auth.users d'abord
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password || 'temp123',
      email_confirm: true,
      user_metadata: { role: body.role }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la création du compte: ${authError.message}` },
        { status: 400 }
      )
    }

    // Créer l'employé dans la table employees
    const employeeData = {
      user_id: authData.user.id,
      name: body.name,
      email: body.email,
      role: body.role,
      salary: parseFloat(body.salary),
      position: body.position,
      hire_date: body.hire_date,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert(employeeData as any)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      // Si l'insertion échoue, supprimer l'utilisateur auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw error
    }

    // Ajouter une activité de création
    await supabaseAdmin
      .from('employee_activities')
      .insert({
        employee_id: (data as any).id,
        activity_type: 'login',
        description: `Employé créé: ${(data as any).name}`,
        metadata: { action: 'employee_created' },
        created_at: new Date().toISOString()
      } as any)
    
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create employee' },
      { status: 500 }
    )
  }
}
