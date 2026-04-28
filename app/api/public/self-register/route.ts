import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { customersApi, ordersApi, utils } from '@/lib/database'
import { getCanonicalTariffLabel, getTariffItemCount } from '@/lib/tariff-items'
import { sendEmail } from '@/lib/notify'
import { buildSelfRegisterClientConfirmationEmail } from '@/lib/notification-templates'

const SERVICE_TYPES = ['fret_maritime', 'fret_aerien', 'demenagement', 'colis'] as const

const articleSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('catalog'),
    index: z.number().int().min(0),
    quantity: z.number().int().min(1).max(999).optional(),
  }),
  z.object({
    source: z.literal('custom'),
    description: z.string().trim().min(2).max(400),
    quantity: z.number().int().min(1).max(999).optional(),
  }),
])

const bodySchema = z.object({
  /** Anti-spam : doit rester vide */
  company_website: z.string().max(200).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(50).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    postal_code: z.string().trim().max(20).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    company: z.string().trim().max(200).optional().nullable(),
    tax_id: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  }),
  articles: z.array(articleSchema).min(1).max(25),
  shipment: z.object({
    service_type: z.enum(SERVICE_TYPES),
    origin: z.string().trim().min(2).max(100),
    destination: z.string().trim().min(2).max(100),
    weight: z.number().positive().max(1_000_000).optional().nullable(),
    value: z.number().positive().max(1_000_000_000).optional().nullable(),
    parcels_count: z.number().int().min(1).max(9999).optional().nullable(),
    estimated_delivery: z.string().trim().max(40).optional().nullable(),
  }),
  recipient: z
    .object({
      name: z.string().trim().max(200).optional().nullable(),
      email: z.string().trim().email().max(200).optional().nullable(),
      phone: z.string().trim().max(50).optional().nullable(),
      address: z.string().trim().max(200).optional().nullable(),
      city: z.string().trim().max(100).optional().nullable(),
      postal_code: z.string().trim().max(20).optional().nullable(),
      country: z.string().trim().max(100).optional().nullable(),
    })
    .optional()
    .nullable(),
})

function buildArticleNotes(
  articles: z.infer<typeof bodySchema>['articles'],
): string {
  const lines = ['[Formulaire web client]', 'Articles / prestations demandés :']
  const maxIdx = getTariffItemCount() - 1
  for (const a of articles) {
    const qty = a.quantity ?? 1
    if (a.source === 'catalog') {
      if (a.index > maxIdx) continue
      const label = getCanonicalTariffLabel(a.index)
      if (label) lines.push(`- [Grille tarifs] ${label} × ${qty}`)
    } else {
      lines.push(`- [Hors liste] ${a.description} × ${qty}`)
    }
  }
  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { company_website, customer, articles, shipment, recipient } = parsed.data

    if (company_website && company_website.trim().length > 0) {
      return NextResponse.json({ success: false, error: 'Requête refusée' }, { status: 400 })
    }

    const maxIdx = getTariffItemCount() - 1
    for (const a of articles) {
      if (a.source === 'catalog' && (a.index < 0 || a.index > maxIdx)) {
        return NextResponse.json(
          { success: false, error: 'Référence tarif invalide' },
          { status: 400 },
        )
      }
    }

    const articleBlock = buildArticleNotes(articles)
    const userNotes = customer.notes?.trim()
    const combinedNotes = userNotes ? `${articleBlock}\n\nMessage du client :\n${userNotes}` : articleBlock

    let createdCustomer
    try {
      createdCustomer = await customersApi.create({
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone?.trim() || null,
        address: customer.address?.trim() || null,
        city: customer.city?.trim() || null,
        postal_code: customer.postal_code?.trim() || null,
        country: customer.country?.trim() || null,
        company: customer.company?.trim() || null,
        tax_id: customer.tax_id?.trim() || null,
        notes: combinedNotes,
        status: 'active',
      })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Un client avec cette adresse e-mail existe déjà. Contactez-nous ou connectez-vous au suivi de commande.',
          },
          { status: 409 },
        )
      }
      throw e
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const clientEmail = customer.email.trim().toLowerCase()
    const recEmail = recipient?.email?.trim()
    if (recEmail && !emailRegex.test(recEmail)) {
      return NextResponse.json({ success: false, error: 'E-mail destinataire invalide' }, { status: 400 })
    }

    const sanitizedRecipientName = recipient?.name?.trim() || null
    const sanitizedRecipientEmail = recEmail ? recEmail.toLowerCase() : null

    const orderNumber = await utils.generateOrderNumber()

    const order = await ordersApi.create({
      order_number: orderNumber,
      client_name: customer.name.trim(),
      client_email: clientEmail,
      client_phone: customer.phone?.trim().substring(0, 50) || null,
      client_address: customer.address?.trim().substring(0, 200) || null,
      client_city: customer.city?.trim().substring(0, 100) || null,
      client_postal_code: customer.postal_code?.trim().substring(0, 20) || null,
      client_country: customer.country?.trim().substring(0, 100) || null,
      recipient_name: sanitizedRecipientName,
      recipient_email: sanitizedRecipientEmail,
      recipient_phone: recipient?.phone?.trim().substring(0, 50) || null,
      recipient_address: recipient?.address?.trim().substring(0, 200) || null,
      recipient_city: recipient?.city?.trim().substring(0, 100) || null,
      recipient_postal_code: recipient?.postal_code?.trim().substring(0, 20) || null,
      recipient_country: recipient?.country?.trim().substring(0, 100) || null,
      service_type: shipment.service_type,
      origin: shipment.origin.trim().substring(0, 100),
      destination: shipment.destination.trim().substring(0, 100),
      weight: shipment.weight ?? null,
      value: shipment.value ?? null,
      parcels_count: shipment.parcels_count ?? 1,
      estimated_delivery: shipment.estimated_delivery?.trim() || null,
      status: 'pending',
      customer_id: createdCustomer.id,
    })

    try {
      const { subject, html } = buildSelfRegisterClientConfirmationEmail({
        orderNumber: order.order_number,
        destination: shipment.destination.trim(),
      })
      await sendEmail(clientEmail, subject, html)
    } catch (mailErr) {
      console.error('[public/self-register] confirmation email failed:', mailErr)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          customerId: createdCustomer.id,
          orderId: order.id,
          orderNumber: order.order_number,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[public/self-register]', error)
    return NextResponse.json(
      { success: false, error: 'Enregistrement impossible pour le moment. Réessayez plus tard.' },
      { status: 500 },
    )
  }
}
