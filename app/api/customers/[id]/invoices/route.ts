import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'

const invoiceSchema = z.object({
  order_id: z.string().uuid(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(0),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    })
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  notes: z.string().trim().max(1000).optional().nullable().transform((value) => value || null),
})

// POST /api/customers/[id]/invoices - Créer une facture brouillon pour une commande du client
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { id } = await context.params
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ success: false, error: 'Identifiant client invalide' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Données de facture invalides' }, { status: 400 })
    }

    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données de facture invalides' }, { status: 400 })
    }

    const { data: order, error: orderError } = await (supabaseAdmin as any)
      .from('orders')
      .select('id, customer_id, value')
      .eq('id', parsed.data.order_id)
      .maybeSingle()

    if (orderError) throw orderError
    if (!order || order.customer_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Commande introuvable pour ce client' },
        { status: 404 },
      )
    }

    const subtotal = Number(order.value ?? 0)
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'La valeur de la commande ne permet pas de créer une facture' },
        { status: 422 },
      )
    }

    const { data: existingInvoice, error: existingInvoiceError } = await (supabaseAdmin as any)
      .from('invoices')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle()

    if (existingInvoiceError) throw existingInvoiceError
    if (existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Une facture existe déjà pour cette commande' },
        { status: 409 },
      )
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('invoices')
      .insert({
        customer_id: id,
        order_id: order.id,
        subtotal,
        tax_rate: parsed.data.tax_rate,
        status: 'draft',
        due_date: parsed.data.due_date,
        notes: parsed.data.notes,
      })
      .select('id, invoice_number, customer_id, order_id, subtotal, tax_rate, total_amount, status, due_date, notes, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer invoice')
    return NextResponse.json(
      { success: false, error: 'Impossible de créer la facture' },
      { status: 500 },
    )
  }
}
