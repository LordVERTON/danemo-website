import { NextRequest, NextResponse } from 'next/server'
import { utils } from '@/lib/database'

// GET /api/stats - Récupérer les statistiques des commandes
export async function GET(request: NextRequest) {
  try {
    const stats = await utils.getStats()
    
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
