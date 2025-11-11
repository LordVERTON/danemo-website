import { NextRequest, NextResponse } from 'next/server'
import { customersApi } from '@/lib/database'

// GET /api/customers - Récupérer tous les clients avec leurs commandes
export async function GET(request: NextRequest) {
  try {
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
    
    // Validation des champs requis
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const customer = await customersApi.create({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
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

