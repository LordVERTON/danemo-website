import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'

const PAYMENT_METHODS = ['bank_transfer', 'cash', 'card', 'mobile', 'other'] as const

const paymentSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000_000),
  currency: z.literal('EUR').optional().default('EUR'),
  paid_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    }),
  payment_method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(120).optional().transform((value) => value || null),
  notes: z.string().trim().max(1000).optional().transform((value) => value || null),
})

async function customerExists(id: string): Promise<boolean> {
  const { data, error } = await (supabaseAdmin as any)
    .from('customers')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

// GET /api/customers/[id]/payments - Historique des règlements d'un client
export async function GET(
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

    if (!(await customerExists(id))) {
      return NextResponse.json({ success: false, error: 'Client introuvable' }, { status: 404 })
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('customer_payments')
      .select('id, customer_id, amount, currency, paid_at, payment_method, reference, notes, created_at, updated_at')
      .eq('customer_id', id)
      .order('paid_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('Error fetching customer payments')
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les règlements du client' },
      { status: 500 },
    )
  }
}

// POST /api/customers/[id]/payments - Enregistrer un règlement client non affecté à une commande
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
      return NextResponse.json({ success: false, error: 'Données de règlement invalides' }, { status: 400 })
    }

    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données de règlement invalides' }, { status: 400 })
    }

    if (!(await customerExists(id))) {
      return NextResponse.json({ success: false, error: 'Client introuvable' }, { status: 404 })
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('customer_payments')
      .insert({
        customer_id: id,
        ...parsed.data,
      })
      .select('id, customer_id, amount, currency, paid_at, payment_method, reference, notes, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer payment')
    return NextResponse.json(
      { success: false, error: 'Impossible d’enregistrer le règlement' },
      { status: 500 },
    )
  }
}
