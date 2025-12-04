import { NextRequest, NextResponse } from 'next/server'
import { ordersApi, utils } from '@/lib/database'

// GET /api/orders - Récupérer toutes les commandes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')

    // Validation des paramètres
    if (search && search.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Search query too long' },
        { status: 400 }
      )
    }

    if (status && !['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status filter' },
        { status: 400 }
      )
    }

    let orders
    if (search) {
      orders = await ordersApi.search(search)
    } else if (status) {
      orders = await ordersApi.getByStatus(status)
    } else {
      orders = await ordersApi.getAll()
    }

    // Appliquer le filtre de date si fourni
    if (startDate && orders) {
      const filterDate = new Date(startDate)
      if (isNaN(filterDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        )
      }
      orders = orders.filter(order => new Date(order.created_at) >= filterDate)
    }

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des champs requis
    const requiredFields = ['client_name', 'client_email', 'service_type', 'origin', 'destination']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.client_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Valider les emails facultatifs
    if (body.recipient_email && !emailRegex.test(body.recipient_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient email format' },
        { status: 400 }
      )
    }

    // Validation du type de service
    const validServiceTypes = ['fret_maritime', 'fret_aerien', 'demenagement', 'colis']
    if (!validServiceTypes.includes(body.service_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Sanitisation des données
    const sanitizedClientName = body.client_name?.trim().substring(0, 100) || ''
    const sanitizedClientEmail = body.client_email?.trim().toLowerCase()
    const sanitizedRecipientName = body.recipient_name
      ? body.recipient_name.trim().substring(0, 100)
      : sanitizedClientName
    const sanitizedRecipientEmail = body.recipient_email
      ? body.recipient_email.trim().toLowerCase()
      : sanitizedClientEmail

    const sanitizedClientAddress = body.client_address?.trim().substring(0, 200) || null
    const sanitizedClientCity = body.client_city?.trim().substring(0, 100) || null
    const sanitizedClientPostalCode = body.client_postal_code?.trim().substring(0, 20) || null
    const sanitizedClientCountry = body.client_country?.trim().substring(0, 100) || null

    const sanitizedData = {
      client_name: sanitizedClientName,
      client_email: sanitizedClientEmail,
      client_phone: body.client_phone?.trim().substring(0, 20),
      client_address: sanitizedClientAddress,
      client_city: sanitizedClientCity,
      client_postal_code: sanitizedClientPostalCode,
      client_country: sanitizedClientCountry,
      recipient_name: sanitizedRecipientName || null,
      recipient_email: sanitizedRecipientEmail || null,
      recipient_phone: body.recipient_phone
        ? body.recipient_phone.trim().substring(0, 20)
        : body.client_phone
        ? body.client_phone.trim().substring(0, 20)
        : null,
      recipient_address: body.recipient_address?.trim().substring(0, 200) || null,
      recipient_city: body.recipient_city?.trim().substring(0, 100) || null,
      recipient_postal_code: body.recipient_postal_code?.trim().substring(0, 20) || null,
      recipient_country: body.recipient_country?.trim().substring(0, 100) || null,
      service_type: body.service_type,
      origin: body.origin?.trim().substring(0, 100),
      destination: body.destination?.trim().substring(0, 100),
      weight: body.weight ? (typeof body.weight === 'string' ? body.weight.trim().substring(0, 20) : String(body.weight).substring(0, 20)) : null,
      value: body.value ? (typeof body.value === 'string' ? body.value.trim().substring(0, 20) : String(body.value).substring(0, 20)) : null,
      estimated_delivery: body.estimated_delivery,
      container_id: body.container_id && body.container_id !== '' ? body.container_id : null,
      container_code: body.container_code && body.container_code !== '' ? body.container_code.trim().substring(0, 50) : null,
      customer_id: body.customer_id && body.customer_id !== '' ? body.customer_id : null
    }
        
    // Générer un numéro de commande unique et gérer les collisions éventuelles
    // (très rare, mais possible en cas de requêtes concurrentes)
    let order
    const maxAttempts = 5

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const orderNumber = await utils.generateOrderNumber()

      const orderData = {
        ...sanitizedData,
        order_number: orderNumber,
        status: 'pending' as const
      }

      try {
        order = await ordersApi.create(orderData)
        break
      } catch (err: any) {
        // Collision sur la contrainte d'unicité de order_number → on retente
        if (err?.code === '23505' || err?.message?.includes('orders_order_number_key')) {
          if (attempt === maxAttempts) {
            console.error('Too many collisions when generating order_number', err)
            return NextResponse.json(
              { success: false, error: "Impossible de générer un numéro de commande unique. Merci de réessayer." },
              { status: 503 }
            )
          }
          // on boucle pour régénérer un nouveau numéro
          continue
        }

        // Autre erreur (non liée à l'unicité) → on la relance
        throw err
      }
    }

    if (!order) {
      // Garde-fou, ne devrait jamais arriver si la boucle est correcte
      return NextResponse.json(
        { success: false, error: "Impossible de créer la commande pour le moment. Merci de réessayer." },
        { status: 503 }
      )
    }
    
    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
