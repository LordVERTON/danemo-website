import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdminApiAccess } from '@/lib/staff-api-auth'

// GET /api/test-connection - Tester la connexion à Supabase
export async function GET(request: NextRequest) {
  const authError = await requireAdminApiAccess(request)
  if (authError) return authError

  try {
    // Test simple de connexion
    const { data, error } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to Supabase',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      ordersCount: data || 0
    })
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Connection test failed',
      },
      { status: 500 }
    )
  }
}
