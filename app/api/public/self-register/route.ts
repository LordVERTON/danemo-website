import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { customersApi } from '@/lib/database'

const bodySchema = z.object({
  /** Anti-spam : doit rester vide */
  company_website: z.string().max(200).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().email().max(200).optional().or(z.literal('')),
    phone: z.string().trim().min(2).max(50),
    address: z.string().trim().min(2).max(500),
    city: z.string().trim().min(2).max(100),
    postal_code: z.string().trim().min(2).max(20),
    country: z.string().trim().min(2).max(100),
    company: z.string().trim().max(200).optional().nullable(),
    tax_id: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  }),
})

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

    const { company_website, customer } = parsed.data

    if (company_website && company_website.trim().length > 0) {
      return NextResponse.json({ success: false, error: 'Requête refusée' }, { status: 400 })
    }

    let createdCustomer
    try {
      createdCustomer = await customersApi.create({
        name: customer.name.trim(),
        email: customer.email?.trim() ? customer.email.trim().toLowerCase() : null,
        phone: customer.phone?.trim() || null,
        address: customer.address?.trim() || null,
        city: customer.city?.trim() || null,
        postal_code: customer.postal_code?.trim() || null,
        country: customer.country?.trim() || null,
        company: customer.company?.trim() || null,
        tax_id: customer.tax_id?.trim() || null,
        notes: customer.notes?.trim() || null,
        status: 'active',
      })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Une fiche client existe déjà avec cette adresse e-mail. Contactez-nous si vous souhaitez la modifier.',
          },
          { status: 409 },
        )
      }
      throw e
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          customerId: createdCustomer.id,
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
