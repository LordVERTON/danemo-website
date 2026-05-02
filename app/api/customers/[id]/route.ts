import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'
import { authenticateRequest } from '@/lib/auth-middleware'
import { normalizePhoneE164 } from '@/lib/messaging'

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

// PUT /api/customers/[id] - Mettre à jour un client (admin et operator uniquement)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      )
    }
    if (user.role !== 'admin' && user.role !== 'operator') {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    
    const emailValue = body.email?.trim()
    const customer = await customersApi.update(id, {
      name: body.name?.trim(),
      email: emailValue ? emailValue.toLowerCase() : null,
      phone: body.phone?.trim() || null,
      phone_e164: normalizePhoneE164(body.phone),
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      country: body.country?.trim() || null,
      company: body.company?.trim() || null,
      tax_id: body.tax_id?.trim() || null,
      notes: body.notes?.trim() || null,
      opted_in_sms: Boolean(body.opted_in_sms),
      opted_in_whatsapp: Boolean(body.opted_in_whatsapp),
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

