import { NextRequest, NextResponse } from 'next/server'
import { clientsApi } from '@/lib/database'

// GET /api/clients - list clients
export async function GET() {
  try {
    const clients = await clientsApi.getAll()
    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/clients - create client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing required field: name' }, { status: 400 })
    }
    const payload = {
      name,
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      address: body.address ? String(body.address).trim() : null,
      company: body.company ? String(body.company).trim() : null,
    }
    const created = await clientsApi.create(payload)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 })
  }
}


