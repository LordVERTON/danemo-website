import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/test-connection - Tester la connexion à Supabase
export async function GET(request: NextRequest) {
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
          details: error.message 
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
