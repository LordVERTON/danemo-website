import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'
import { supabaseAdmin } from '@/lib/supabase'

async function syncOrdersWithoutCustomer() {
  const { data: danglingOrders, error } = await (supabaseAdmin as any)
    .from('orders')
    .select(
      'id, customer_id, client_name, client_email, client_phone, client_address, client_city, client_postal_code, client_country',
    )
    .is('customer_id', null)

  if (error) throw error
  if (!danglingOrders || danglingOrders.length === 0) return

  for (const order of danglingOrders) {
    const name = String(order.client_name || '').trim()
    const email = String(order.client_email || '')
      .trim()
      .toLowerCase()
    const phone = String(order.client_phone || '').trim()

    if (!name && !email) continue

    let customerId: string | null = null

    if (email) {
      const { data: byEmail } = await (supabaseAdmin as any)
        .from('customers')
        .select('id')
        .ilike('email', email)
        .limit(1)
      customerId = byEmail?.[0]?.id ?? null
    }

    if (!customerId && name) {
      const byNameQuery = (supabaseAdmin as any)
        .from('customers')
        .select('id')
        .eq('name', name)
        .limit(1)
      const { data: byName } = phone
        ? await byNameQuery.eq('phone', phone)
        : await byNameQuery
      customerId = byName?.[0]?.id ?? null
    }

    if (!customerId) {
      const { data: created, error: createError } = await (supabaseAdmin as any)
        .from('customers')
        .insert({
          name: name || email,
          email: email || null,
          phone: phone || null,
          address: String(order.client_address || '').trim() || null,
          city: String(order.client_city || '').trim() || null,
          postal_code: String(order.client_postal_code || '').trim() || null,
          country: String(order.client_country || '').trim() || null,
          status: 'active',
        })
        .select('id')
        .single()
      if (createError) {
        console.error('[customers-sync] Failed to create customer from order', order.id, createError)
        continue
      }
      customerId = created?.id ?? null
    }

    if (!customerId) continue

    const { error: linkError } = await (supabaseAdmin as any)
      .from('orders')
      .update({ customer_id: customerId })
      .eq('id', order.id)
      .is('customer_id', null)

    if (linkError) {
      console.error('[customers-sync] Failed to link order to customer', order.id, linkError)
    }
  }
}

// GET /api/customers - Récupérer tous les clients avec leurs commandes
export async function GET(request: NextRequest) {
  try {
    // Backfill défensif : garantit que les commandes (y compris en conteneur)
    // créent/pointent bien vers un client visible dans la page Clients.
    await syncOrdersWithoutCustomer()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Récupérer tous les clients
    let customers = await customersApi.getAll()

    // Filtrer par statut si fourni
    if (status && status !== 'all') {
      customers = customers.filter(c => c.status === status)
    }

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
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        const customerWithOrders = await customersApi.getWithOrders(customer.id)
        return customerWithOrders || { ...customer, orders: [] }
      })
    )

    return NextResponse.json({ success: true, data: customersWithOrders })
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
    const body = await request.json()
    
    // Validation des champs requis (nom uniquement, email optionnel)
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le nom est requis' },
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
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      postal_code: body.postal_code?.trim() || null,
      country: body.country?.trim() || null,
      company: body.company?.trim() || null,
      tax_id: body.tax_id?.trim() || null,
      notes: body.notes?.trim() || null,
      status: body.status || 'active',
    })
    
    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}

