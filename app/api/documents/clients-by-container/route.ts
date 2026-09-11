import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  generateClientsDocx,
  generateClientsExcel,
  type ContainerExportRow,
} from '@/lib/documents-utils'
import { requireStaffApiAccess } from '@/lib/staff-api-auth'

interface CustomerRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  company: string | null
}

interface ContainerOrderRow {
  customer_id: string | null
  order_number: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  client_address: string | null
  recipient_name: string | null
  recipient_email: string | null
  recipient_phone: string | null
  recipient_address: string | null
  service_type: string
  description: string | null
  origin: string
  destination: string
  weight: number | null
  value: number | null
  status: string | null
  parcels_count: number | null
}

// GET /api/documents/clients-by-container?container_id=...&format=docx|xlsx
export async function GET(request: NextRequest) {
  const authError = await requireStaffApiAccess(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const containerId = searchParams.get('container_id')
    const format = (searchParams.get('format') || 'docx').toLowerCase()
    if (!containerId) {
      return NextResponse.json({ success: false, error: 'Missing container_id' }, { status: 400 })
    }

    // Get container
    const { data: container, error: cErr } = await (supabaseAdmin as any)
      .from('containers')
      .select('*')
      .eq('id', containerId)
      .single()
    if (cErr) throw cErr
    if (!container) return NextResponse.json({ success: false, error: 'Container not found' }, { status: 404 })

    // Les clients d'un conteneur sont ceux des commandes qui lui sont affectées.
    const { data: ordersData, error: oErr } = await (supabaseAdmin as any)
      .from('orders')
      .select('customer_id, order_number, client_name, client_email, client_phone, client_address, recipient_name, recipient_email, recipient_phone, recipient_address, service_type, description, origin, destination, weight, value, status, parcels_count')
      .eq('container_id', containerId)
    if (oErr) throw oErr
    const orders = (ordersData || []) as ContainerOrderRow[]

    const clientIds = Array.from(
      new Set([
        container.client_id,
        ...orders.map((order) => order.customer_id),
      ].filter(Boolean)),
    ) as string[]

    const clientsById = new Map<string, CustomerRow>()
    if (clientIds.length > 0) {
      const { data: clients, error: clErr } = await (supabaseAdmin as any)
        .from('customers')
        .select('id, name, email, phone, address, company')
        .in('id', clientIds)
      if (clErr) throw clErr
      for (const client of (clients || []) as CustomerRow[]) {
        clientsById.set(client.id, client)
      }
    }

    // Une ligne représente une commande/un colis : les informations de contact et de fret
    // restent ainsi associées sans perdre les clients ayant plusieurs commandes.
    const rows: ContainerExportRow[] = orders.map((order) => {
      const client = order.customer_id ? clientsById.get(order.customer_id) : undefined
      return {
        name: order.client_name || client?.name || '',
        email: order.client_email || client?.email || null,
        phone: order.client_phone || client?.phone || null,
        address: order.client_address || client?.address || null,
        company: client?.company || null,
        recipientName: order.recipient_name,
        recipientEmail: order.recipient_email,
        recipientPhone: order.recipient_phone,
        recipientAddress: order.recipient_address,
        orderNumber: order.order_number,
        serviceType: order.service_type,
        description: order.description,
        origin: order.origin,
        destination: order.destination,
        parcelsCount: order.parcels_count,
        weight: order.weight,
        value: order.value,
        status: order.status,
        containerCode: container.code,
      }
    })

    // Un conteneur peut être créé avec un client direct avant qu'une commande y soit associée.
    if (rows.length === 0 && container.client_id) {
      const client = clientsById.get(container.client_id)
      if (client) {
        rows.push({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          company: client.company,
          containerCode: container.code,
        })
      }
    }

    const title = `Clients et colis par conteneur ${container.code}`
    if (format === 'xlsx' || format === 'excel') {
      const blob = await generateClientsExcel(title, rows)
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="clients-${container.code}.xlsx"`,
        },
      })
    }
    // default docx
    const blob = await generateClientsDocx(title, rows)
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="clients-${container.code}.docx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting clients by container:', error)
    return NextResponse.json({ success: false, error: 'Failed to export' }, { status: 500 })
  }
}


