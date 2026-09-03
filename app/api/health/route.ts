import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db-health-check'
import { requireAdminApiAccess } from '@/lib/staff-api-auth'

export async function GET(request: NextRequest) {
  const authError = await requireAdminApiAccess(request)
  if (authError) return authError

  try {
    const health = await checkDatabaseHealth()

    const isHealthy = health.isConnected && 
                     Object.values(health.tables).every(Boolean) && 
                     health.auth

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      database: health,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
