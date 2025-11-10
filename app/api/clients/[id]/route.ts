import { NextRequest, NextResponse } from 'next/server'
import { clientsApi } from '@/lib/database'

// GET /api/clients/[id]
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const client = await clientsApi.getById(id)
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: client })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT /api/clients/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const updates: any = {}
    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase()
    if (typeof body.phone === 'string') updates.phone = body.phone.trim()
    if (typeof body.address === 'string') updates.address = body.address.trim()
    if (typeof body.company === 'string') updates.company = body.company.trim()
    const updated = await clientsApi.update(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ success: false, error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await clientsApi.delete(id)
    return NextResponse.json({ success: true, message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 })
  }
}


