import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Simple protection: require a header that matches an env key
    const seedKey = process.env.ADMIN_SEED_KEY
    const providedKey = request.headers.get('x-admin-seed-key')
    if (!seedKey || providedKey !== seedKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin not initialized' }, { status: 500 })
    }

    // Sample containers data
    const containersToCreate = [
      {
        code: 'MSKU1234567',
        vessel: 'MSC OSCAR',
        departure_port: 'Port d\'Anvers, Belgique',
        arrival_port: 'Port de Douala, Cameroun',
        etd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned' as const,
      },
      {
        code: 'TCLU9876543',
        vessel: 'CMA CGM MARCO POLO',
        departure_port: 'Port de Rotterdam, Pays-Bas',
        arrival_port: 'Port de Lagos, Nigeria',
        etd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned' as const,
      },
      {
        code: 'GESU4567890',
        vessel: 'EVERGREEN EVER ACE',
        departure_port: 'Port du Havre, France',
        arrival_port: 'Port d\'Abidjan, Côte d\'Ivoire',
        etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned' as const,
      },
      {
        code: 'APLU2345678',
        vessel: 'COSCO SHIPPING UNIVERSE',
        departure_port: 'Port d\'Hambourg, Allemagne',
        arrival_port: 'Port de Tema, Ghana',
        etd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit' as const,
      },
      {
        code: 'OOCU3456789',
        vessel: 'OOCL HONG KONG',
        departure_port: 'Port de Felixstowe, Royaume-Uni',
        arrival_port: 'Port de Dakar, Sénégal',
        etd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit' as const,
      },
      {
        code: 'HLCU5678901',
        vessel: 'HAPAG-LLOYD BERLIN',
        departure_port: 'Port de Bremerhaven, Allemagne',
        arrival_port: 'Port de Lomé, Togo',
        etd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'arrived' as const,
      },
      {
        code: 'ONEU6789012',
        vessel: 'ONE INNOVATION',
        departure_port: 'Port de Gênes, Italie',
        arrival_port: 'Port de Cotonou, Bénin',
        etd: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'arrived' as const,
      },
      {
        code: 'YMLU7890123',
        vessel: 'YANG MING UNANIMITY',
        departure_port: 'Port de Barcelone, Espagne',
        arrival_port: 'Port de Pointe-Noire, Congo',
        etd: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delivered' as const,
      },
      {
        code: 'PILU8901234',
        vessel: 'PACIFIC INTERNATIONAL LINES',
        departure_port: 'Port de Marseille, France',
        arrival_port: 'Port de Dar es Salaam, Tanzanie',
        etd: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delivered' as const,
      },
      {
        code: 'ZIMU9012345',
        vessel: 'ZIM CONSTANZA',
        departure_port: 'Port d\'Algésiras, Espagne',
        arrival_port: 'Port de Mombasa, Kenya',
        etd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delayed' as const,
      },
      {
        code: 'MSCU0123456',
        vessel: 'MSC GÜLSÜN',
        departure_port: 'Port de Valence, Espagne',
        arrival_port: 'Port de Luanda, Angola',
        etd: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'delayed' as const,
      },
      {
        code: 'CMAU1234567',
        vessel: 'CMA CGM ANTOINE DE SAINT EXUPERY',
        departure_port: 'Port de Zeebrugge, Belgique',
        arrival_port: 'Port de Durban, Afrique du Sud',
        etd: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'departed' as const,
      },
      {
        code: 'EVERU2345678',
        vessel: 'EVERGREEN EVER GIVEN',
        departure_port: 'Port de Southampton, Royaume-Uni',
        arrival_port: 'Port de Maputo, Mozambique',
        etd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'departed' as const,
      },
    ]

    const results: Array<{ code: string; ok: boolean; message?: string; id?: string }> = []

    for (const container of containersToCreate) {
      const { data, error } = await (supabaseAdmin as any)
        .from('containers')
        .insert(container)
        .select()
        .single()

      if (error) {
        // If container already exists, treat as success for idempotency
        const msg = error.message || 'Unknown error'
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('duplicate')) {
          results.push({ code: container.code, ok: true, message: 'Already exists' })
          continue
        }
        results.push({ code: container.code, ok: false, message: msg })
      } else {
        results.push({ code: container.code, ok: true, id: data?.id })
      }
    }

    const allOk = results.every(r => r.ok)
    return NextResponse.json(
      { 
        success: allOk, 
        results,
        message: `Seeded ${results.filter(r => r.ok).length} out of ${results.length} containers`
      }, 
      { status: allOk ? 200 : 207 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to seed containers' },
      { status: 500 }
    )
  }
}

