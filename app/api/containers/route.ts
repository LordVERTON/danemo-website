import { NextRequest, NextResponse } from 'next/server'
import { containersApi } from '@/lib/database'

// GET /api/containers - list
export async function GET() {
  try {
    const containers = await containersApi.getAll()
    console.log('API /api/containers: Returning', containers?.length || 0, 'containers')
    return NextResponse.json({ success: true, data: containers || [] })
  } catch (error) {
    console.error('Error fetching containers:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch containers' }, { status: 500 })
  }
}

// POST /api/containers - create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code || '').trim()
    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing required field: code' }, { status: 400 })
    }
    const payload = {
      code,
      vessel: body.vessel ? String(body.vessel).trim() : null,
      departure_port: body.departure_port ? String(body.departure_port).trim() : null,
      arrival_port: body.arrival_port ? String(body.arrival_port).trim() : null,
      etd: body.etd ? String(body.etd) : null,
      eta: body.eta ? String(body.eta) : null,
      status: body.status || 'planned',
      client_id: body.client_id || null,
    }
    const created = await containersApi.create(payload)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating container:', error)
    return NextResponse.json({ success: false, error: 'Failed to create container' }, { status: 500 })
  }
}


