import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizePhoneE164 } from '@/lib/messaging'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'
import { recordBusinessAudit } from '@/lib/business-audit'

// GET /api/customers - Récupérer tous les clients avec leurs commandes
export async function GET(request: NextRequest) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Récupérer tous les clients
    let customersQuery = (supabaseAdmin as any)
      .from('customers')
      .select('*, orders (*)')
      .order('created_at', { ascending: false })

    // Filtrer par statut si fourni
    if (status && status !== 'all') {
      customersQuery = customersQuery.eq('status', status)
    }

    const { data: customersData, error: customersError } = await customersQuery
    if (customersError) throw customersError

    let customers = (customersData || []) as Array<{
      name?: string | null
      email?: string | null
      company?: string | null
      phone?: string | null
      status?: string | null
      orders?: unknown[]
    }>

    // Filtrer par recherche si fourni
    if (search) {
      const searchLower = search.toLowerCase()
      customers = customers.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Récupérer les commandes pour chaque client
    return NextResponse.json({ success: true, data: customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const accessError = await requireStaffApiAccess(request)
    if (accessError) return accessError

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

    // Validation de l'email si fourni
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emailValue = body.email?.trim()
    if (emailValue && !emailRegex.test(emailValue)) {
      return NextResponse.json(
        { success: false, error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    const customer = await customersApi.create({
      name: body.name.trim(),
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
      status: body.status || 'active',
    })

    await recordBusinessAudit(request, {
      action: 'create',
      entityType: 'customer',
      entityId: customer.id,
    })
    
    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de créer le client pour le moment.' },
      { status: 500 }
    )
  }
}

