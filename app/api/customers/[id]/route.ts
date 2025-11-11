import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'

// GET /api/customers/[id] - Récupérer un client avec ses commandes
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const customer = await customersApi.getWithOrdersAndInvoices(id)
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Mettre à jour un client
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    const customer = await customersApi.update(id, {
      name: body.name?.trim(),
      email: body.email?.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      country: body.country?.trim() || null,
      company: body.company?.trim() || null,
      tax_id: body.tax_id?.trim() || null,
      notes: body.notes?.trim() || null,
      status: body.status,
    })
    
    return NextResponse.json({ success: true, data: customer })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Supprimer un client
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await customersApi.delete(id)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}

