import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth, testDatabaseOperations } from '@/lib/db-health-check'

export async function GET(request: NextRequest) {
  try {
    const [health, operations] = await Promise.all([
      checkDatabaseHealth(),
      testDatabaseOperations()
    ])

    const isHealthy = health.isConnected && 
                     Object.values(health.tables).every(Boolean) && 
                     health.auth &&
                     operations.read && 
                     operations.write && 
                     operations.delete

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      database: health,
      operations,
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
