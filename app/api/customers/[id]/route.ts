import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'
import { normalizePhoneE164 } from '@/lib/messaging'
import { supabaseAdmin } from '@/lib/supabase'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'
import { calculateCustomerPaymentProgress } from '@/lib/customer-payment-progress'
import { recordBusinessAudit } from '@/lib/business-audit'

// GET /api/customers/[id] - Récupérer un client avec ses commandes
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { id } = await context.params
    const { data: customer, error } = await (supabaseAdmin as any)
      .from('customers')
      .select('*, orders (*), invoices (*)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    const { data: payments, error: paymentsError } = await (supabaseAdmin as any)
      .from('customer_payments')
      .select('id, customer_id, amount, currency, paid_at, payment_method, reference, notes, created_at, updated_at')
      .eq('customer_id', id)
      .order('paid_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (paymentsError) throw paymentsError

    const paymentRows = payments ?? []
    
    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        payments: paymentRows,
        payment_summary: calculateCustomerPaymentProgress(customer.orders ?? [], paymentRows),
      },
    })
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
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { id } = await context.params
    const body = await request.json()

    const requiredFields = [
      ['name', 'Le nom complet est requis'],
      ['phone', 'Le téléphone est requis'],
      ['address', 'L’adresse est requise'],
      ['city', 'La ville est requise'],
      ['postal_code', 'Le code postal est requis'],
      ['country', 'Le pays est requis'],
    ] as const
    const missingField = requiredFields.find(([field]) => !body[field]?.trim())
    if (missingField) {
      return NextResponse.json(
        { success: false, error: missingField[1] },
        { status: 400 }
      )
    }
    
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

    await recordBusinessAudit(request, {
      action: 'update',
      entityType: 'customer',
      entityId: id,
      changedFields: Object.keys(body),
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
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { id } = await context.params
    await customersApi.delete(id)

    await recordBusinessAudit(request, {
      action: 'delete',
      entityType: 'customer',
      entityId: id,
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}

