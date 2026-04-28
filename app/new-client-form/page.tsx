'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/lib/i18n'
import type { Lang } from '@/lib/translations'
import { Loader2, Plus, Trash2 } from 'lucide-react'

type TariffItem = { index: number; label: string; price: string; unitPriceEur: number | null }

type ArticleRow = {
  key: string
  mode: 'catalog' | 'custom'
  /** `null` = aucun article grille sélectionné (placeholder) */
  catalogIndex: number | null
  customText: string
  quantity: number
}

/** Clés stables (`ncf-article-0`, …) pour éviter les erreurs d’hydratation (pas de UUID aléatoire au SSR). */
function createArticleRow(stableId: number, partial?: Partial<ArticleRow>): ArticleRow {
  return {
    key: `ncf-article-${stableId}`,
    mode: 'catalog',
    catalogIndex: null,
    customText: '',
    quantity: 1,
    ...partial,
  }
}

export default function NewClientFormPage() {
  const { lang, messages } = useI18n()
  const t = messages.newClientForm

  const nextArticleIdRef = useRef(1)
  const [tariffItems, setTariffItems] = useState<TariffItem[]>([])
  const [rows, setRows] = useState<ArticleRow[]>(() => [createArticleRow(0)])
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{ orderNumber: string } | null>(null)

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    tax_id: '',
    notes: '',
  })

  const [shipment, setShipment] = useState({
    service_type: 'colis' as 'fret_maritime' | 'fret_aerien' | 'demenagement' | 'colis',
    origin: '',
    destination: '',
    weight: '',
    value: '',
    parcels_count: '1',
    estimated_delivery: '',
  })

  const [recipient, setRecipient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
  })

  useEffect(() => {
    const l = (lang === 'en' ? 'en' : 'fr') as Lang
    fetch(`/api/public/tariff-items?lang=${l}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.items) setTariffItems(res.data.items)
      })
      .catch(() => setTariffItems([]))
  }, [lang])

  useEffect(() => {
    if (shipment.origin || shipment.destination) return
    setShipment((s) => ({
      ...s,
      origin: lang === 'en' ? 'Belgium / Brussels' : 'Belgique / Bruxelles',
      destination: lang === 'en' ? 'Cameroon / Douala' : 'Cameroun / Douala',
    }))
  }, [lang, shipment.origin, shipment.destination])

  const serviceLabels = useMemo(
    () => ({
      colis: t.serviceColis,
      fret_maritime: t.serviceFretMaritime,
      fret_aerien: t.serviceFretAerien,
      demenagement: t.serviceDemenagement,
    }),
    [t],
  )

  const updateRow = useCallback((key: string, patch: Partial<ArticleRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createArticleRow(nextArticleIdRef.current++)])
  }, [])

  const removeRow = useCallback((key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }, [])

  const formatEur = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    [lang],
  )

  const priceEstimate = useMemo(() => {
    let catalogTotal = 0
    let hasCustom = false
    const lines: Array<{
      key: string
      articleLabel: string
      qty: number
      unitEur: number | null
      lineEur: number | null
      isCustom: boolean
    }> = []

    for (const row of rows) {
      const qty = Math.max(1, Math.min(999, row.quantity || 1))
      if (row.mode === 'custom') {
        hasCustom = true
        const desc = row.customText.trim()
        lines.push({
          key: row.key,
          articleLabel: desc || t.customArticle,
          qty,
          unitEur: null,
          lineEur: null,
          isCustom: true,
        })
        continue
      }
      if (row.catalogIndex === null) {
        lines.push({
          key: row.key,
          articleLabel: t.catalogArticleSelectPlaceholder,
          qty,
          unitEur: null,
          lineEur: null,
          isCustom: false,
        })
        continue
      }
      const item = tariffItems.find((i) => i.index === row.catalogIndex)
      const unitRaw = item?.unitPriceEur
      const unitNum =
        typeof unitRaw === 'number' && Number.isFinite(unitRaw) ? unitRaw : null
      const lineEur = unitNum != null ? unitNum * qty : null
      if (lineEur != null) catalogTotal += lineEur
      lines.push({
        key: row.key,
        articleLabel: item?.label ?? '…',
        qty,
        unitEur: unitNum,
        lineEur,
        isCustom: false,
      })
    }

    return { lines, catalogTotal, hasCustom }
  }, [rows, tariffItems, t.customArticle, t.catalogArticleSelectPlaceholder])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitSuccess(null)

    const formEl = e.currentTarget
    const fd = new FormData(formEl)
    const honeypot = String(fd.get('company_website') || '').trim()

    if (!consent) {
      setError(t.consentLabel)
      return
    }

    const articles: Array<
      | { source: 'catalog'; index: number; quantity: number }
      | { source: 'custom'; description: string; quantity: number }
    > = []
    for (const r of rows) {
      const qty = Math.max(1, Math.min(999, r.quantity || 1))
      if (r.mode === 'catalog') {
        if (r.catalogIndex === null) {
          setError(t.errorCatalogArticleRequired)
          return
        }
        articles.push({ source: 'catalog', index: r.catalogIndex, quantity: qty })
      } else {
        const d = r.customText.trim()
        if (d.length < 2) {
          setError(
            lang === 'en'
              ? 'Please describe each custom item (at least 2 characters), or switch to an item from the rate list.'
              : 'Décrivez chaque article « hors liste » (au moins 2 caractères), ou choisissez un article dans la grille tarifaire.',
          )
          return
        }
        articles.push({ source: 'custom', description: d, quantity: qty })
      }
    }

    setSubmitting(true)
    try {
      const recipientPayload =
        recipient.name.trim() ||
        recipient.email.trim() ||
        recipient.phone.trim() ||
        recipient.address.trim()
          ? {
              name: recipient.name.trim() || null,
              email: recipient.email.trim() || null,
              phone: recipient.phone.trim() || null,
              address: recipient.address.trim() || null,
              city: recipient.city.trim() || null,
              postal_code: recipient.postal_code.trim() || null,
              country: recipient.country.trim() || null,
            }
          : null

      const res = await fetch('/api/public/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_website: honeypot,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim() || null,
            address: customer.address.trim() || null,
            city: customer.city.trim() || null,
            postal_code: customer.postal_code.trim() || null,
            country: customer.country.trim() || null,
            company: customer.company.trim() || null,
            tax_id: customer.tax_id.trim() || null,
            notes: customer.notes.trim() || null,
          },
          articles,
          shipment: {
            service_type: shipment.service_type,
            origin: shipment.origin.trim(),
            destination: shipment.destination.trim(),
            weight: (() => {
              const raw = shipment.weight.trim()
              if (!raw) return null
              const n = Number.parseFloat(raw.replace(',', '.'))
              return Number.isFinite(n) && n > 0 ? n : null
            })(),
            value: (() => {
              const raw = shipment.value.trim()
              if (!raw) return null
              const n = Number.parseFloat(raw.replace(',', '.'))
              return Number.isFinite(n) && n > 0 ? n : null
            })(),
            parcels_count: (() => {
              const n = Number.parseInt(shipment.parcels_count, 10)
              return Number.isFinite(n) && n >= 1 ? Math.min(n, 9999) : 1
            })(),
            estimated_delivery: shipment.estimated_delivery.trim() || null,
          },
          recipient: recipientPayload,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        if (res.status === 409) setError(t.errorConflict)
        else setError(json.error || t.errorGeneric)
        return
      }

      setSubmitSuccess({ orderNumber: String(json.data?.orderNumber || '') })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError(t.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitSuccess) {
    const msg = submitSuccess.orderNumber
      ? t.successWithOrder.replace('{{orderNumber}}', submitSuccess.orderNumber)
      : t.successNoOrder
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 px-3 py-10 sm:px-4 sm:py-16">
          <Card className="mx-auto max-w-lg border-green-200 bg-green-50/50 py-5 sm:py-6">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl text-green-800 sm:text-2xl">{t.successTitle}</CardTitle>
              <CardDescription className="text-base leading-relaxed text-gray-800">{msg}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:px-6">
              <Button asChild variant="outline" className="min-h-11 w-full touch-manipulation sm:w-auto">
                <Link href="/">{t.linkHome}</Link>
              </Button>
              <Button
                asChild
                className="min-h-11 w-full touch-manipulation bg-orange-500 hover:bg-orange-600 sm:w-auto"
              >
                <Link href="/tarifs">{t.linkTarifs}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 px-3 py-6 pb-10 sm:px-4 sm:py-12 sm:pb-12">
        <div className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
          <div className="space-y-2 px-0.5 text-center sm:px-0">
            <h1 className="font-serif text-2xl font-bold leading-tight text-[#B8860B] sm:text-3xl md:text-4xl">
              {t.title}
            </h1>
            <p className="mx-auto max-w-2xl text-xs leading-relaxed text-gray-500 sm:text-sm">{t.intro}</p>
          </div>

          {error ? (
            <Alert variant="destructive" className="text-sm sm:text-base">
              <AlertDescription className="leading-relaxed">{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="touch-manipulation space-y-6 sm:space-y-8">
            {/* honeypot */}
            <input
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
              className="absolute left-[-9999px] h-px w-px opacity-0"
              aria-hidden
            />

            <Card className="gap-0 py-0 sm:gap-6 sm:py-6">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl">{t.sections.customer}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 px-4 pb-4 pt-0 sm:grid-cols-2 sm:px-6 sm:pb-6">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-name">{t.name}</Label>
                  <Input
                    id="ncf-name"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-email">{t.email}</Label>
                  <Input
                    id="ncf-email"
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-phone">{t.phone}</Label>
                  <Input
                    id="ncf-phone"
                    inputMode="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-company">{t.company}</Label>
                  <Input
                    id="ncf-company"
                    value={customer.company}
                    onChange={(e) => setCustomer((c) => ({ ...c, company: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-address">{t.address}</Label>
                  <Input
                    id="ncf-address"
                    value={customer.address}
                    onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-city">{t.city}</Label>
                  <Input
                    id="ncf-city"
                    value={customer.city}
                    onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-postal">{t.postalCode}</Label>
                  <Input
                    id="ncf-postal"
                    value={customer.postal_code}
                    onChange={(e) => setCustomer((c) => ({ ...c, postal_code: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-country">{t.country}</Label>
                  <Input
                    id="ncf-country"
                    value={customer.country}
                    onChange={(e) => setCustomer((c) => ({ ...c, country: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-tax">{t.taxId}</Label>
                  <Input
                    id="ncf-tax"
                    value={customer.tax_id}
                    onChange={(e) => setCustomer((c) => ({ ...c, tax_id: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-notes">{t.notes}</Label>
                  <Textarea
                    id="ncf-notes"
                    rows={4}
                    value={customer.notes}
                    onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                    className="min-h-[5.5rem] text-base leading-relaxed sm:min-h-16 sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 sm:gap-6 sm:py-6">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl">{t.sections.articles}</CardTitle>
                <CardDescription>
                  <Link
                    href="/tarifs"
                    className="text-orange-600 underline-offset-2 hover:underline active:text-orange-700"
                  >
                    {t.linkTarifs}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-4 pb-4 pt-0 sm:space-y-6 sm:px-6 sm:pb-6">
                {rows.map((row, idx) => (
                  <div
                    key={row.key}
                    className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:space-y-4 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-base font-semibold sm:text-sm">
                        {t.articleLine} {idx + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 touch-manipulation text-red-600 sm:h-9 sm:w-9"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        aria-label={t.removeArticle}
                      >
                        <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <Select
                        value={row.mode}
                        onValueChange={(v) => {
                          const mode = v as 'catalog' | 'custom'
                          updateRow(row.key, {
                            mode,
                            ...(mode === 'catalog'
                              ? { catalogIndex: null, customText: '' }
                              : { customText: row.customText }),
                          })
                        }}
                      >
                        <SelectTrigger
                          aria-label={`${t.articleLine} ${idx + 1} — type`}
                          className="h-auto min-h-11 w-full text-base sm:min-h-9 sm:text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[70vh] sm:max-h-72">
                          <SelectItem value="catalog">{t.fromTariffs}</SelectItem>
                          <SelectItem value="custom">{t.customArticle}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {row.mode === 'catalog' ? (
                      <div className="min-w-0 flex-[2] space-y-2">
                        <Label className="text-xs text-muted-foreground">{t.fromTariffs}</Label>
                        <Select
                          value={row.catalogIndex === null ? undefined : String(row.catalogIndex)}
                          onValueChange={(v) =>
                            updateRow(row.key, { catalogIndex: Number.parseInt(v, 10) })
                          }
                        >
                          <SelectTrigger className="h-auto min-h-11 w-full whitespace-normal text-left text-base sm:min-h-9 sm:text-sm [&_[data-slot=select-value]]:line-clamp-3 [&_[data-slot=select-value]]:whitespace-normal">
                            <SelectValue placeholder={t.catalogArticleSelectPlaceholder} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[70vh] max-w-[calc(100vw-2rem)] sm:max-h-72 sm:max-w-none">
                            {tariffItems.map((it) => (
                              <SelectItem key={it.index} value={String(it.index)}>
                                {it.label} — {it.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-[2] space-y-2">
                        <Label className="text-xs text-muted-foreground">{t.customArticle}</Label>
                        <Input
                          placeholder={t.customArticlePlaceholder}
                          value={row.customText}
                          onChange={(e) => updateRow(row.key, { customText: e.target.value })}
                          className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                        />
                      </div>
                    )}

                    <div className="space-y-2 sm:max-w-[7rem]">
                      <Label htmlFor={`qty-${row.key}`}>{t.quantity}</Label>
                      <Input
                        id={`qty-${row.key}`}
                        type="number"
                        min={1}
                        max={999}
                        inputMode="numeric"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.key, {
                            quantity: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="min-h-11 w-full max-w-full text-base sm:min-h-9 sm:max-w-[6rem] sm:text-sm"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRow}
                  className="min-h-11 w-full touch-manipulation sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addArticle}
                </Button>

                <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/50 p-3 sm:p-4">
                  <h3 className="text-base font-semibold text-gray-900">{t.priceEstimateTitle}</h3>

                  <div className="space-y-2 sm:hidden">
                    {priceEstimate.lines.map((line) => (
                      <div
                        key={line.key}
                        className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
                      >
                        <p className="text-sm font-medium leading-snug text-gray-900">{line.articleLabel}</p>
                        <dl className="mt-2 space-y-1.5 text-sm">
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{t.priceEstimateColumnQty}</dt>
                            <dd className="tabular-nums">{line.qty}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{t.priceEstimateColumnUnit}</dt>
                            <dd className="text-right tabular-nums">
                              {line.isCustom || line.unitEur == null
                                ? t.priceEstimateOnQuote
                                : formatEur.format(line.unitEur)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2 border-t border-gray-100 pt-1.5 font-medium">
                            <dt className="text-muted-foreground">{t.priceEstimateColumnLine}</dt>
                            <dd className="tabular-nums text-orange-800">
                              {line.isCustom || line.lineEur == null
                                ? '—'
                                : formatEur.format(line.lineEur)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto rounded-md border bg-white sm:block">
                    <table className="w-full min-w-[320px] text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left text-xs font-medium text-muted-foreground">
                          <th className="px-3 py-2">{t.priceEstimateColumnArticle}</th>
                          <th className="px-3 py-2 w-14 text-right">{t.priceEstimateColumnQty}</th>
                          <th className="px-3 py-2 w-28 text-right whitespace-nowrap">
                            {t.priceEstimateColumnUnit}
                          </th>
                          <th className="px-3 py-2 w-28 text-right whitespace-nowrap">
                            {t.priceEstimateColumnLine}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceEstimate.lines.map((line) => (
                          <tr key={line.key} className="border-b border-gray-100 last:border-0">
                            <td className="max-w-[220px] px-3 py-2 align-top sm:max-w-[280px]" title={line.articleLabel}>
                              <span className="line-clamp-2 sm:line-clamp-none">{line.articleLabel}</span>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{line.qty}</td>
                            <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                              {line.isCustom || line.unitEur == null
                                ? t.priceEstimateOnQuote
                                : formatEur.format(line.unitEur)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap">
                              {line.isCustom || line.lineEur == null
                                ? '—'
                                : formatEur.format(line.lineEur)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-orange-200/80 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-1">
                    <span className="text-sm font-semibold text-gray-900 sm:text-base">
                      {t.priceEstimateTotal}
                    </span>
                    <span className="text-xl font-bold tabular-nums text-orange-700 sm:text-lg">
                      {formatEur.format(priceEstimate.catalogTotal)}
                    </span>
                  </div>
                  {priceEstimate.hasCustom ? (
                    <p className="text-xs leading-relaxed text-amber-900/90">{t.priceEstimateCustomHint}</p>
                  ) : null}
                  <p className="text-xs leading-relaxed text-muted-foreground">{t.priceEstimateDisclaimer}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 sm:gap-6 sm:py-6">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl">{t.sections.shipment}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 px-4 pb-4 pt-0 sm:grid-cols-2 sm:px-6 sm:pb-6">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t.serviceType}</Label>
                  <Select
                    value={shipment.service_type}
                    onValueChange={(v) =>
                      setShipment((s) => ({
                        ...s,
                        service_type: v as typeof shipment.service_type,
                      }))
                    }
                  >
                    <SelectTrigger className="h-auto min-h-11 w-full text-base sm:min-h-9 sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map((k) => (
                        <SelectItem key={k} value={k}>
                          {serviceLabels[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ncf-origin">{t.origin}</Label>
                  <Input
                    id="ncf-origin"
                    required
                    value={shipment.origin}
                    onChange={(e) => setShipment((s) => ({ ...s, origin: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ncf-dest">{t.destination}</Label>
                  <Input
                    id="ncf-dest"
                    required
                    value={shipment.destination}
                    onChange={(e) => setShipment((s) => ({ ...s, destination: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-weight">{t.weightKg}</Label>
                  <Input
                    id="ncf-weight"
                    inputMode="decimal"
                    value={shipment.weight}
                    onChange={(e) => setShipment((s) => ({ ...s, weight: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-value">{t.valueEur}</Label>
                  <Input
                    id="ncf-value"
                    inputMode="decimal"
                    value={shipment.value}
                    onChange={(e) => setShipment((s) => ({ ...s, value: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-parcels">{t.parcelsCount}</Label>
                  <Input
                    id="ncf-parcels"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={shipment.parcels_count}
                    onChange={(e) => setShipment((s) => ({ ...s, parcels_count: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-eta">{t.estimatedDelivery}</Label>
                  <Input
                    id="ncf-eta"
                    value={shipment.estimated_delivery}
                    onChange={(e) =>
                      setShipment((s) => ({ ...s, estimated_delivery: e.target.value }))
                    }
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0 sm:gap-6 sm:py-6">
              <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-lg sm:text-xl">{t.sections.recipient}</CardTitle>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  {t.recipientHint}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-4 pb-4 pt-0 sm:grid-cols-2 sm:px-6 sm:pb-6">
                <div className="space-y-2">
                  <Label htmlFor="ncf-r-name">{t.recipientName}</Label>
                  <Input
                    id="ncf-r-name"
                    value={recipient.name}
                    onChange={(e) => setRecipient((r) => ({ ...r, name: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-r-email">{t.recipientEmail}</Label>
                  <Input
                    id="ncf-r-email"
                    type="email"
                    value={recipient.email}
                    onChange={(e) => setRecipient((r) => ({ ...r, email: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-r-phone">{t.recipientPhone}</Label>
                  <Input
                    id="ncf-r-phone"
                    inputMode="tel"
                    value={recipient.phone}
                    onChange={(e) => setRecipient((r) => ({ ...r, phone: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="ncf-r-addr">{t.recipientAddress}</Label>
                  <Input
                    id="ncf-r-addr"
                    value={recipient.address}
                    onChange={(e) => setRecipient((r) => ({ ...r, address: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-r-city">{t.recipientCity}</Label>
                  <Input
                    id="ncf-r-city"
                    value={recipient.city}
                    onChange={(e) => setRecipient((r) => ({ ...r, city: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ncf-r-postal">{t.recipientPostalCode}</Label>
                  <Input
                    id="ncf-r-postal"
                    value={recipient.postal_code}
                    onChange={(e) => setRecipient((r) => ({ ...r, postal_code: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ncf-r-country">{t.recipientCountry}</Label>
                  <Input
                    id="ncf-r-country"
                    value={recipient.country}
                    onChange={(e) => setRecipient((r) => ({ ...r, country: e.target.value }))}
                    className="min-h-11 text-base sm:min-h-9 sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
              <div className="-m-1 flex shrink-0 items-center p-3 sm:m-0 sm:p-0">
                <input
                  id="ncf-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-orange-500 sm:h-4 sm:w-4"
                />
              </div>
              <Label
                htmlFor="ncf-consent"
                className="cursor-pointer py-2 text-sm font-normal leading-relaxed active:opacity-80 sm:py-1 sm:text-sm"
              >
                {t.consentLabel}
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-auto min-h-12 w-full touch-manipulation bg-orange-500 px-6 py-3 text-base font-semibold text-white hover:bg-orange-600 sm:w-auto sm:min-h-11 sm:py-2 sm:text-sm"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
