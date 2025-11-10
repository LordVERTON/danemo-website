import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateClientsDocx, generateClientsExcel } from '@/lib/documents-utils'

// GET /api/documents/clients-by-container?container_id=...&format=docx|xlsx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const containerId = searchParams.get('container_id')
    const format = (searchParams.get('format') || 'docx').toLowerCase()
    if (!containerId) {
      return NextResponse.json({ success: false, error: 'Missing container_id' }, { status: 400 })
    }

    // Get container
    const { data: container, error: cErr } = await supabase
      .from('containers')
      .select('*')
      .eq('id', containerId)
      .single()
    if (cErr) throw cErr
    if (!container) return NextResponse.json({ success: false, error: 'Container not found' }, { status: 404 })

    // Find packages in this container
    const { data: packages, error: pErr } = await supabase
      .from('packages')
      .select('client_id')
      .eq('container_id', containerId)
    if (pErr) throw pErr

    const clientIds = Array.from(new Set((packages || []).map((p) => p.client_id).filter(Boolean))) as string[]

    // Load clients
    let rows: any[] = []
    if (clientIds.length > 0) {
      const { data: clients, error: clErr } = await supabase.from('clients').select('*').in('id', clientIds)
      if (clErr) throw clErr
      rows = (clients || []).map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        company: c.company,
        containerCode: container.code,
      }))
    }

    const title = `Clients par conteneur ${container.code}`
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


