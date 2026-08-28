import { NextRequest, NextResponse } from 'next/server'
import type { Lang } from '@/lib/translations'
import { getTariffItemsForLang } from '@/lib/tariff-items'

const LANGS: Lang[] = ['fr', 'en']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('lang') || 'fr'
  const lang: Lang = LANGS.includes(raw as Lang) ? (raw as Lang) : 'fr'

  return NextResponse.json({
    success: true,
    data: { lang, items: getTariffItemsForLang(lang) },
  })
}
