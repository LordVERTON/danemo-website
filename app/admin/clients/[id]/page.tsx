"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CreditCard, ExternalLink, FileDown, FileText, Loader2, PackagePlus, Plus, QrCode, UserRound } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { calculateCustomerPaymentProgress, type CustomerPaymentRecord } from "@/lib/customer-payment-progress"
import { downloadInvoicePdf, downloadProformaDocx, downloadProformaPdf, downloadQrLabel } from "@/lib/client-documents"

type Order = { id: string; order_number: string; service_type: string; origin: string; destination: string; status: string; value?: number | null; qr_code?: string | null; created_at: string }
type Customer = { id: string; name: string; email?: string | null; phone?: string | null; company?: string | null; address?: string | null; city?: string | null; country?: string | null; status?: string; orders: Order[]; payments: CustomerPaymentRecord[]; invoices: Array<{ id: string; invoice_number?: string; status?: string; total_amount?: number }> }

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>()
  const customerId = String(params.id || "")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [payment, setPayment] = useState({ amount: "", paid_at: new Date().toISOString().slice(0, 10), payment_method: "bank_transfer", reference: "", notes: "" })
  const [order, setOrder] = useState({ service_type: "fret_maritime", origin: "Bruxelles", destination: "", value: "", estimated_delivery: "" })

  const summary = useMemo(() => calculateCustomerPaymentProgress(customer?.orders || [], customer?.payments || []), [customer])

  async function loadCustomer() {
    if (!customerId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/customers/${encodeURIComponent(customerId)}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Chargement impossible")
      setCustomer(result.data)
    } catch (cause: any) {
      setError(cause?.message || "Impossible de charger le client")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCustomer() }, [customerId])

  async function addPayment(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      const response = await fetch(`/api/customers/${customerId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Enregistrement impossible")
      setPaymentOpen(false)
      setPayment({ amount: "", paid_at: new Date().toISOString().slice(0, 10), payment_method: "bank_transfer", reference: "", notes: "" })
      await loadCustomer()
    } catch (cause: any) {
      setError(cause?.message || "Impossible d'enregistrer le règlement")
    } finally { setSaving(false) }
  }

  async function addOrder(event: React.FormEvent) {
    event.preventDefault()
    if (!customer) return
    setSaving(true)
    setError("")
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        ...order, value: Number(order.value || 0), customer_id: customer.id, client_name: customer.name, client_email: customer.email || "", client_phone: customer.phone || "",
      }) })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Création impossible")
      setOrderOpen(false)
      setOrder({ service_type: "fret_maritime", origin: "Bruxelles", destination: "", value: "", estimated_delivery: "" })
      await loadCustomer()
    } catch (cause: any) {
      setError(cause?.message || "Impossible de créer la commande")
    } finally { setSaving(false) }
  }

  async function createInvoice(order: Order) {
    if (!customer) return
    setSaving(true); setError("")
    try {
      const response = await fetch(`/api/customers/${customer.id}/invoices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id }) })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Création de facture impossible")
      downloadInvoicePdf({ invoiceNumber: result.data.invoice_number, order: { ...order, client_name: customer.name, client_email: customer.email, client_phone: customer.phone }, taxRate: result.data.tax_rate, dueDate: result.data.due_date, notes: result.data.notes })
      await loadCustomer()
    } catch (cause: any) { setError(cause?.message || "Impossible de créer la facture") } finally { setSaving(false) }
  }

  function documentOrder(order: Order) {
    if (!customer) throw new Error("Client absent")
    return { ...order, client_name: customer.name, client_email: customer.email, client_phone: customer.phone }
  }

  function exportSummary() {
    if (!customer) return
    const rows = [["Client", customer.name], ["Email", customer.email || ""], ["Total commandes", String(summary.totalAmount)], ["Règlements reçus", String(summary.paidAmount)], ["Solde", String(summary.remainingAmount)]]
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url; anchor.download = `client-${customer.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`; anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <AdminLayout title="Fiche client"><div className="flex h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div></AdminLayout>
  if (!customer) return <AdminLayout title="Fiche client"><Card><CardContent className="p-6"><p className="text-red-600">{error || "Client introuvable"}</p><Button asChild className="mt-4"><Link href="/admin/clients">Retour aux clients</Link></Button></CardContent></Card></AdminLayout>

  return (
    <AdminLayout title="Fiche client">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline"><Link href="/admin/clients"><ArrowLeft className="mr-2 size-4" />Clients</Link></Button>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportSummary}><FileDown className="mr-2 size-4" />Exporter CSV</Button><Button onClick={() => window.print()} variant="outline">Imprimer / PDF</Button></div>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-orange-600" />{customer.name}</CardTitle><CardDescription>{customer.company || "Client particulier"}</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email : </span>{customer.email || "—"}</p><p><span className="text-muted-foreground">Téléphone : </span>{customer.phone || "—"}</p><p><span className="text-muted-foreground">Adresse : </span>{[customer.address, customer.city, customer.country].filter(Boolean).join(", ") || "—"}</p><p><Badge variant={customer.status === "active" ? "default" : "secondary"}>{customer.status || "active"}</Badge></p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Règlements</CardTitle><CardDescription>{summary.paymentStatus === "paid" ? "Soldé" : summary.paymentStatus === "partial" ? "Partiellement réglé" : "À régler"}</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{euro.format(summary.remainingAmount)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-600" style={{ width: `${summary.progressPercent}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{euro.format(summary.paidAmount)} réglés sur {euro.format(summary.totalAmount)}</p><Button className="mt-4 w-full" onClick={() => setPaymentOpen(true)}><CreditCard className="mr-2 size-4" />Ajouter un règlement</Button></CardContent></Card>
        </div>

        <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Commandes</CardTitle><CardDescription>{customer.orders.length} commande(s) associée(s)</CardDescription></div><Button onClick={() => setOrderOpen(true)}><PackagePlus className="mr-2 size-4" />Nouvelle commande</Button></CardHeader><CardContent><div className="space-y-2">{customer.orders.length ? customer.orders.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{item.order_number}</p><p className="text-sm text-muted-foreground">{item.origin} → {item.destination} · {item.service_type}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.status}</Badge><span className="font-medium">{euro.format(Number(item.value || 0))}</span><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => createInvoice(item)}><FileText className="mr-1 size-3.5" />Facture</Button><Button type="button" variant="outline" size="sm" onClick={() => downloadProformaPdf(documentOrder(item))}>Proforma PDF</Button><Button type="button" variant="outline" size="sm" onClick={() => downloadProformaDocx(documentOrder(item))}>DOCX</Button><Button type="button" variant="outline" size="sm" onClick={() => downloadQrLabel(documentOrder(item))}><QrCode className="mr-1 size-3.5" />Étiquette</Button>{item.qr_code && <Button asChild variant="outline" size="sm"><Link href={`/admin/qr?code=${encodeURIComponent(item.qr_code)}`}><ExternalLink className="mr-1 size-3.5" />Scanner</Link></Button>}</div></div>) : <p className="py-6 text-center text-sm text-muted-foreground">Aucune commande pour ce client.</p>}</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Historique des règlements</CardTitle></CardHeader><CardContent><div className="space-y-2">{customer.payments.length ? customer.payments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{euro.format(Number(item.amount))}</p><p className="text-muted-foreground">{item.paid_at} · {item.payment_method || "—"}{item.reference ? ` · ${item.reference}` : ""}</p></div><Badge variant="secondary">Enregistré</Badge></div>) : <p className="py-4 text-sm text-muted-foreground">Aucun règlement enregistré.</p>}</div></CardContent></Card>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent><DialogHeader><DialogTitle>Ajouter un règlement</DialogTitle></DialogHeader><form onSubmit={addPayment} className="space-y-4"><div><Label>Montant (€)</Label><Input type="number" min="0.01" step="0.01" required value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></div><div><Label>Date</Label><Input type="date" required value={payment.paid_at} onChange={(event) => setPayment({ ...payment, paid_at: event.target.value })} /></div><div><Label>Méthode</Label><Select value={payment.payment_method} onValueChange={(value) => setPayment({ ...payment, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Virement</SelectItem><SelectItem value="cash">Espèces</SelectItem><SelectItem value="card">Carte</SelectItem><SelectItem value="mobile">Mobile</SelectItem><SelectItem value="other">Autre</SelectItem></SelectContent></Select></div><div><Label>Référence</Label><Input value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} /></div><div><Label>Note</Label><Textarea value={payment.notes} onChange={(event) => setPayment({ ...payment, notes: event.target.value })} /></div><Button className="w-full" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></form></DialogContent></Dialog>
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}><DialogContent><DialogHeader><DialogTitle>Nouvelle commande</DialogTitle></DialogHeader><form onSubmit={addOrder} className="space-y-4"><div><Label>Service</Label><Select value={order.service_type} onValueChange={(value) => setOrder({ ...order, service_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fret_maritime">Fret maritime</SelectItem><SelectItem value="fret_aerien">Fret aérien</SelectItem><SelectItem value="demenagement">Déménagement</SelectItem></SelectContent></Select></div><div><Label>Origine</Label><Input required value={order.origin} onChange={(event) => setOrder({ ...order, origin: event.target.value })} /></div><div><Label>Destination</Label><Input required value={order.destination} onChange={(event) => setOrder({ ...order, destination: event.target.value })} /></div><div><Label>Montant (€)</Label><Input type="number" min="0" step="0.01" value={order.value} onChange={(event) => setOrder({ ...order, value: event.target.value })} /></div><div><Label>Livraison estimée</Label><Input type="date" value={order.estimated_delivery} onChange={(event) => setOrder({ ...order, estimated_delivery: event.target.value })} /></div><Button className="w-full" disabled={saving}><Plus className="mr-2 size-4" />{saving ? "Création..." : "Créer la commande"}</Button></form></DialogContent></Dialog>
    </AdminLayout>
  )
}
