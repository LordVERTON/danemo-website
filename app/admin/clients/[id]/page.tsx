"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, FileText, Loader2, MoreHorizontal, PackagePlus, Pencil, Plus, QrCode, Trash2, UserRound } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { calculateCustomerPaymentProgress, type CustomerPaymentRecord } from "@/lib/customer-payment-progress"
import { defaultCompanyData, generateInvoice, type InvoiceData } from "@/lib/invoice-utils"
import { generateQRPrintPDF } from "@/lib/qr-print-utils"

type Order = { id: string; order_number: string; service_type: string; description?: string | null; origin: string; destination: string; status: string; value?: number | null; weight?: number | null; estimated_delivery?: string | null; recipient_name?: string | null; recipient_email?: string | null; recipient_phone?: string | null; recipient_address?: string | null; recipient_city?: string | null; recipient_postal_code?: string | null; recipient_country?: string | null; qr_code?: string | null; container_id?: string | null; container_code?: string | null; created_at: string }
type Customer = { id: string; name: string; email?: string | null; phone?: string | null; company?: string | null; address?: string | null; city?: string | null; postal_code?: string | null; country?: string | null; status?: string; orders: Order[]; payments: CustomerPaymentRecord[]; invoices: Array<{ id: string; order_id?: string | null; invoice_number?: string; tax_rate?: number | null; created_at?: string | null; status?: string; total_amount?: number }> }
type Container = { id: string; code: string; departure_port?: string | null; arrival_port?: string | null; status?: string | null }

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })

const serviceLabels: Record<string, string> = {
  fret_maritime: "Fret maritime",
  fret_aerien: "Fret aérien",
  demenagement: "Déménagement",
  dedouanement: "Dédouanement",
  negoce: "Négoce",
}

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const customerId = String(params.id || "")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingSummaryInvoice, setGeneratingSummaryInvoice] = useState(false)
  const [payment, setPayment] = useState({ amount: "", paid_at: new Date().toISOString().slice(0, 10), payment_method: "bank_transfer", reference: "", notes: "" })
  const [order, setOrder] = useState({ service_type: "fret_maritime", container_id: "", description: "", origin: "Bruxelles", destination: "", weight: "", value: "", recipient_name: "", recipient_email: "", recipient_phone: "", recipient_address: "", recipient_city: "", recipient_postal_code: "", recipient_country: "" })
  const [containers, setContainers] = useState<Container[]>([])
  const [containersLoading, setContainersLoading] = useState(false)
  const [containersError, setContainersError] = useState("")
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false)
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("")
  const [deleteCustomerError, setDeleteCustomerError] = useState("")
  const [deletingCustomer, setDeletingCustomer] = useState(false)
  const [orderPendingDeletion, setOrderPendingDeletion] = useState<Order | null>(null)
  const [deleteOrderError, setDeleteOrderError] = useState("")
  const [deletingOrder, setDeletingOrder] = useState(false)

  const summary = useMemo(() => calculateCustomerPaymentProgress(customer?.orders || [], customer?.payments || []), [customer])

  const loadCustomer = useCallback(async () => {
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
  }, [customerId])

  useEffect(() => { void loadCustomer() }, [loadCustomer])

  const loadContainers = useCallback(async () => {
    setContainersLoading(true)
    setContainersError("")
    try {
      const response = await fetch("/api/containers")
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Chargement des conteneurs impossible")
      setContainers(Array.isArray(result.data) ? result.data : [])
    } catch (cause: any) {
      setContainersError(cause?.message || "Chargement des conteneurs impossible")
    } finally {
      setContainersLoading(false)
    }
  }, [])

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

  function openOrder(orderToEdit?: Order) {
    if (!customer) return
    setEditingOrder(orderToEdit || null)
    setOrder({
      service_type: orderToEdit?.service_type || "fret_maritime", container_id: orderToEdit?.container_id || "", description: orderToEdit?.description || "", origin: orderToEdit?.origin || "Bruxelles", destination: orderToEdit?.destination || "", weight: orderToEdit?.weight ? String(orderToEdit.weight) : "", value: orderToEdit?.value ? String(orderToEdit.value) : "",
      recipient_name: orderToEdit?.recipient_name || customer.name, recipient_email: orderToEdit?.recipient_email || customer.email || "", recipient_phone: orderToEdit?.recipient_phone || customer.phone || "", recipient_address: orderToEdit?.recipient_address || customer.address || "", recipient_city: orderToEdit?.recipient_city || customer.city || "", recipient_postal_code: orderToEdit?.recipient_postal_code || customer.postal_code || "", recipient_country: orderToEdit?.recipient_country || customer.country || "",
    })
    void loadContainers()
    setOrderOpen(true)
  }

  async function addOrder(event: React.FormEvent) {
    event.preventDefault()
    if (!customer) return
    setSaving(true)
    setError("")
    try {
      const payload = {
        ...order, container_id: order.service_type === "fret_maritime" && order.container_id ? order.container_id : null, weight: order.weight || null, value: order.value || null,
        customer_id: customer.id, client_name: customer.name, client_email: customer.email || "", client_phone: customer.phone || "", client_address: customer.address || "", client_city: customer.city || "", client_postal_code: customer.postal_code || "", client_country: customer.country || "",
      }
      const response = await fetch(editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders", { method: editingOrder ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Création impossible")
      setOrderOpen(false)
      setEditingOrder(null)
      await loadCustomer()
    } catch (cause: any) {
      setError(cause?.message || "Impossible de créer la commande")
    } finally { setSaving(false) }
  }

  async function downloadInvoice(order: Order) {
    if (!customer) return
    setSaving(true); setError("")
    try {
      const existingInvoice = customer.invoices.find((invoice) => invoice.order_id === order.id)
      let invoice = existingInvoice
      let created = false
      if (!invoice) {
        const response = await fetch(`/api/customers/${customer.id}/invoices`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id }) })
        const result = await response.json()
        if (!result.success) throw new Error(result.error || "Création de facture impossible")
        invoice = result.data
        created = true
      }
      if (!invoice) throw new Error("Facture introuvable")

      const amount = Math.max(Number(order.value) || 0, 0)
      const payment = summary.orderProgress[order.id]
      const invoiceOrder: InvoiceData["order"] = {
        id: order.id,
        order_number: order.order_number,
        client_name: customer.name,
        client_email: customer.email || "",
        client_phone: customer.phone || undefined,
        client_address: customer.address || undefined,
        client_city: customer.city || undefined,
        client_postal_code: customer.postal_code || undefined,
        client_country: customer.country || undefined,
        recipient_name: order.recipient_name,
        recipient_email: order.recipient_email,
        recipient_phone: order.recipient_phone,
        recipient_address: order.recipient_address,
        recipient_city: order.recipient_city,
        recipient_postal_code: order.recipient_postal_code,
        recipient_country: order.recipient_country,
        service_type: order.service_type,
        description: order.description,
        origin: order.origin,
        destination: order.destination,
        weight: typeof order.weight === "number" && Number.isFinite(order.weight) ? order.weight : undefined,
        value: amount,
        status: order.status,
        created_at: order.created_at,
      }
      const invoiceData: InvoiceData = {
        invoiceNumber: invoice.invoice_number || order.order_number,
        issueDate: invoice.created_at || new Date().toISOString(),
        order: invoiceOrder,
        company: defaultCompanyData,
        taxRate: invoice.tax_rate ?? 0,
        billingAddress: {
          name: customer.name,
          address: customer.address || undefined,
          postal_code: customer.postal_code || undefined,
          city: customer.city || undefined,
          country: customer.country || undefined,
        },
        shippingAddress: {
          name: order.recipient_name || customer.name,
          address: order.recipient_address || order.destination || undefined,
          postal_code: order.recipient_postal_code || undefined,
          city: order.recipient_city || undefined,
          country: order.recipient_country || undefined,
        },
        items: [{
          description: order.description || serviceLabels[order.service_type] || order.service_type,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          paidAmount: payment?.paidAmount,
          remainingAmount: payment?.remainingAmount,
          paymentStatus: payment?.paymentStatus,
        }],
        paymentSummary: {
          paidAmount: payment?.paidAmount ?? 0,
          remainingAmount: payment?.remainingAmount ?? amount,
          paymentStatus: payment?.paymentStatus ?? "unpaid",
          payments: customer.payments.map((entry) => ({
            amount: Math.max(Number(entry.amount) || 0, 0),
            paidAt: entry.paid_at,
            paymentMethod: entry.payment_method,
            reference: entry.reference,
          })),
          allocationNote: "Les règlements sont enregistrés au niveau du client. La répartition par commande est indicative et suit l’ancienneté des commandes.",
        },
      }

      await generateInvoice(invoiceData)
      if (created) await loadCustomer()
    } catch (cause: any) { setError(cause?.message || "Impossible de générer la facture PDF") } finally { setSaving(false) }
  }

  async function generateSummaryInvoice() {
    if (!customer) return
    const ordersForInvoice = [...customer.orders].sort((left, right) => left.created_at.localeCompare(right.created_at))
    if (ordersForInvoice.length === 0) {
      setError("Ce client n’a pas encore de commande à facturer")
      return
    }

    setGeneratingSummaryInvoice(true)
    setError("")
    try {
      const referenceOrder = ordersForInvoice[0]
      const hasMultipleOrders = ordersForInvoice.length > 1
      const totalValue = ordersForInvoice.reduce((total, item) => total + Math.max(Number(item.value) || 0, 0), 0)
      const totalWeight = ordersForInvoice.reduce((total, item) => total + Math.max(Number(item.weight) || 0, 0), 0)
      const invoiceNumber = `INV-${customer.id}-${Date.now()}`
      const invoiceOrder: InvoiceData["order"] = {
        id: `summary-${customer.id}`,
        order_number: invoiceNumber,
        client_name: customer.name,
        client_email: customer.email || "",
        client_phone: customer.phone || undefined,
        client_address: customer.address || undefined,
        client_city: customer.city || undefined,
        client_postal_code: customer.postal_code || undefined,
        client_country: customer.country || undefined,
        recipient_name: hasMultipleOrders ? customer.name : referenceOrder.recipient_name || customer.name,
        recipient_email: hasMultipleOrders ? customer.email : referenceOrder.recipient_email,
        recipient_phone: hasMultipleOrders ? customer.phone : referenceOrder.recipient_phone,
        recipient_address: hasMultipleOrders ? customer.address : referenceOrder.recipient_address,
        recipient_city: hasMultipleOrders ? customer.city : referenceOrder.recipient_city,
        recipient_postal_code: hasMultipleOrders ? customer.postal_code : referenceOrder.recipient_postal_code,
        recipient_country: hasMultipleOrders ? customer.country : referenceOrder.recipient_country,
        service_type: hasMultipleOrders ? "Services multiples" : referenceOrder.service_type,
        description: hasMultipleOrders ? "Commandes multiples" : referenceOrder.description,
        origin: hasMultipleOrders ? "Multiples" : referenceOrder.origin,
        destination: hasMultipleOrders ? "Multiples" : referenceOrder.destination,
        weight: totalWeight || referenceOrder.weight || undefined,
        value: totalValue,
        status: referenceOrder.status,
        created_at: referenceOrder.created_at,
      }

      await generateInvoice({
        invoiceNumber,
        issueDate: new Date().toISOString(),
        order: invoiceOrder,
        company: defaultCompanyData,
        billingAddress: {
          name: customer.name,
          address: customer.address || undefined,
          postal_code: customer.postal_code || undefined,
          city: customer.city || undefined,
          country: customer.country || undefined,
        },
        shippingAddress: {
          name: invoiceOrder.recipient_name || customer.name,
          address: invoiceOrder.recipient_address || undefined,
          postal_code: invoiceOrder.recipient_postal_code || undefined,
          city: invoiceOrder.recipient_city || undefined,
          country: invoiceOrder.recipient_country || undefined,
        },
        paymentMethod: "Paiement groupé - voir référence facture",
        consolidatedInvoice: hasMultipleOrders,
        items: ordersForInvoice.map((item) => {
          const payment = summary.orderProgress[item.id]
          const amount = Math.max(Number(item.value) || 0, 0)
          return {
            description: item.description || serviceLabels[item.service_type] || item.service_type,
            quantity: 1,
            unitPrice: amount,
            total: amount,
            paidAmount: payment?.paidAmount,
            remainingAmount: payment?.remainingAmount,
            paymentStatus: payment?.paymentStatus,
          }
        }),
        paymentSummary: {
          paidAmount: summary.paidAmount,
          remainingAmount: summary.remainingAmount,
          creditAmount: summary.creditAmount,
          paymentStatus: summary.paymentStatus,
          payments: customer.payments.map((entry) => ({
            amount: Math.max(Number(entry.amount) || 0, 0),
            paidAt: entry.paid_at,
            paymentMethod: entry.payment_method,
            reference: entry.reference,
          })),
          allocationNote: "Les règlements sont enregistrés au niveau du client. La répartition par commande est indicative et suit l’ancienneté des commandes.",
        },
      })
    } catch (cause: any) {
      setError(cause?.message || "Impossible de générer la facture récapitulative")
    } finally {
      setGeneratingSummaryInvoice(false)
    }
  }

  async function printQrLabel(order: Order) {
    if (!customer) return
    setSaving(true)
    setError("")
    try {
      await generateQRPrintPDF({
        qrCode: order.qr_code || order.order_number,
        orderNumber: order.order_number,
        clientName: customer.name,
        senderName: customer.company || customer.name,
        recipientName: order.recipient_name,
        recipientPhone: order.recipient_phone,
        serviceType: order.service_type,
        origin: order.origin,
        destination: order.destination,
      })
    } catch (cause: any) {
      setError(cause?.message || "Impossible d’imprimer l’étiquette QR")
    } finally {
      setSaving(false)
    }
  }

  async function deleteCustomer(event: React.FormEvent) {
    event.preventDefault()
    if (!customer) return

    if (customer.orders.length > 0) {
      setDeleteCustomerError("Ce client possède des commandes et ne peut pas être supprimé.")
      return
    }
    if (deleteConfirmationName.trim() !== customer.name) {
      setDeleteCustomerError("Saisissez exactement le nom du client pour confirmer la suppression.")
      return
    }

    setDeletingCustomer(true)
    setDeleteCustomerError("")
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationName: deleteConfirmationName }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Impossible de supprimer le client.")
      router.push("/admin/clients")
    } catch (cause: any) {
      setDeleteCustomerError(cause?.message || "Erreur de connexion lors de la suppression du client.")
    } finally {
      setDeletingCustomer(false)
    }
  }

  async function deleteOrder() {
    if (!orderPendingDeletion) return

    setDeletingOrder(true)
    setDeleteOrderError("")
    try {
      const response = await fetch(`/api/orders/${orderPendingDeletion.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Impossible de supprimer la commande.")
      setOrderPendingDeletion(null)
      await loadCustomer()
    } catch (cause: any) {
      setDeleteOrderError(cause?.message || "Erreur de connexion lors de la suppression de la commande.")
    } finally {
      setDeletingOrder(false)
    }
  }

  if (loading) return <AdminLayout title="Fiche client"><div className="flex h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div></AdminLayout>
  if (!customer) return <AdminLayout title="Fiche client"><Card><CardContent className="p-6"><p className="text-red-600">{error || "Client introuvable"}</p><Button asChild className="mt-4"><Link href="/admin/clients">Retour aux clients</Link></Button></CardContent></Card></AdminLayout>

  return (
    <AdminLayout title="Fiche client">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline"><Link href="/admin/clients"><ArrowLeft className="mr-2 size-4" />Clients</Link></Button>
          <div className="flex flex-wrap gap-2"><Button type="button" onClick={generateSummaryInvoice} disabled={generatingSummaryInvoice || saving || customer.orders.length === 0}>{generatingSummaryInvoice ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />}Générer la facture</Button></div>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-orange-600" />{customer.name}</CardTitle><CardDescription>{customer.company || "Client particulier"}</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Email : </span>{customer.email || "—"}</p><p><span className="text-muted-foreground">Téléphone : </span>{customer.phone || "—"}</p><p><span className="text-muted-foreground">Adresse : </span>{[customer.address, customer.city, customer.country].filter(Boolean).join(", ") || "—"}</p><p><Badge variant={customer.status === "active" ? "default" : "secondary"}>{customer.status || "active"}</Badge></p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Règlements</CardTitle><CardDescription>{summary.paymentStatus === "paid" ? "Soldé" : summary.paymentStatus === "partial" ? "Partiellement réglé" : "À régler"}</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{euro.format(summary.remainingAmount)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-orange-600" style={{ width: `${summary.progressPercent}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{euro.format(summary.paidAmount)} réglés sur {euro.format(summary.totalAmount)}</p><Button className="mt-4 w-full" onClick={() => setPaymentOpen(true)}><CreditCard className="mr-2 size-4" />Ajouter un règlement</Button></CardContent></Card>
        </div>

        <Card><CardHeader className="flex-row items-center justify-between gap-3"><div><CardTitle>Commandes</CardTitle><CardDescription>{customer.orders.length} commande(s) associée(s)</CardDescription></div><Button className="hidden sm:inline-flex" onClick={() => openOrder()}><PackagePlus className="mr-2 size-4" />Nouvelle commande</Button></CardHeader><CardContent><div className="space-y-3">{customer.orders.length ? customer.orders.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{item.order_number}</p><p className="mt-1 text-sm text-muted-foreground">{item.origin} → {item.destination} · {item.service_type}</p>{item.container_code && <p className="mt-1 text-sm text-muted-foreground">Conteneur associé : {item.container_code}</p>}</div><Badge variant="outline" className="shrink-0">{item.status}</Badge></div><div className="mt-4 flex items-center gap-2"><span className="mr-auto font-medium">{euro.format(Number(item.value || 0))}</span><Button type="button" variant="outline" onClick={() => openOrder(item)}><Pencil className="mr-2 size-4" />Modifier</Button><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={`Plus d’actions pour ${item.order_number}`}><MoreHorizontal className="size-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-52"><DropdownMenuLabel>Documents</DropdownMenuLabel><DropdownMenuItem disabled={saving} onSelect={() => downloadInvoice(item)}><FileText className="mr-2 size-4" />Facture PDF</DropdownMenuItem><DropdownMenuItem disabled={saving} onSelect={() => printQrLabel(item)}><QrCode className="mr-2 size-4" />Étiquette QR</DropdownMenuItem>{item.qr_code && <><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href={`/admin/qr?code=${encodeURIComponent(item.qr_code)}`}><QrCode className="mr-2 size-4" />Ouvrir le scanner</Link></DropdownMenuItem></>}<DropdownMenuSeparator /><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem className="text-red-600 focus:text-red-600" disabled={deletingOrder} onSelect={() => { setDeleteOrderError(""); setOrderPendingDeletion(item) }}><Trash2 className="mr-2 size-4" />Supprimer la commande</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></article>) : <p className="py-6 text-center text-sm text-muted-foreground">Aucune commande pour ce client.</p>}</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Historique des règlements</CardTitle></CardHeader><CardContent><div className="space-y-2">{customer.payments.length ? customer.payments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{euro.format(Number(item.amount))}</p><p className="text-muted-foreground">{item.paid_at} · {item.payment_method || "—"}{item.reference ? ` · ${item.reference}` : ""}</p></div><Badge variant="secondary">Enregistré</Badge></div>) : <p className="py-4 text-sm text-muted-foreground">Aucun règlement enregistré.</p>}</div></CardContent></Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700"><Trash2 className="size-5" />Zone dangereuse</CardTitle>
            <CardDescription>{customer.orders.length > 0 ? `Ce client possède ${customer.orders.length} commande${customer.orders.length > 1 ? "s" : ""} et ne peut pas être supprimé.` : "La suppression est définitive et doit être confirmée avec le nom complet du client."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" disabled={customer.orders.length > 0} onClick={() => { setDeleteCustomerError(""); setDeleteConfirmationName(""); setDeleteCustomerOpen(true) }}><Trash2 className="mr-2 size-4" />Supprimer le client</Button>
          </CardContent>
        </Card>
      </div>

      <Button type="button" size="icon" className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 rounded-full shadow-lg sm:hidden" onClick={() => openOrder()} aria-label="Créer une commande"><PackagePlus className="size-6" /></Button>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent><DialogHeader><DialogTitle>Ajouter un règlement</DialogTitle><DialogDescription>Enregistrez le montant reçu et son moyen de paiement.</DialogDescription></DialogHeader><form onSubmit={addPayment} className="space-y-4"><div><Label>Montant (€)</Label><Input type="number" min="0.01" step="0.01" required value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /></div><div><Label>Date</Label><Input type="date" required value={payment.paid_at} onChange={(event) => setPayment({ ...payment, paid_at: event.target.value })} /></div><div><Label>Méthode</Label><Select value={payment.payment_method} onValueChange={(value) => setPayment({ ...payment, payment_method: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Virement</SelectItem><SelectItem value="cash">Espèces</SelectItem><SelectItem value="card">Carte</SelectItem><SelectItem value="mobile">Mobile</SelectItem><SelectItem value="other">Autre</SelectItem></SelectContent></Select></div><div><Label>Référence</Label><Input value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} /></div><div><Label>Note</Label><Textarea value={payment.notes} onChange={(event) => setPayment({ ...payment, notes: event.target.value })} /></div><Button className="w-full" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></form></DialogContent></Dialog>
      <Dialog open={deleteCustomerOpen} onOpenChange={(open) => { if (deletingCustomer) return; setDeleteCustomerOpen(open); if (!open) { setDeleteConfirmationName(""); setDeleteCustomerError("") } }}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader><DialogTitle>Supprimer définitivement ce client</DialogTitle><DialogDescription>Cette action est irréversible. Saisissez exactement le nom du client pour confirmer sa suppression.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={deleteCustomer}>
            {deleteCustomerError && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteCustomerError}</p>}
            <div className="space-y-2"><Label htmlFor="delete-customer-confirmation">Tapez « {customer.name} » pour confirmer</Label><Input id="delete-customer-confirmation" autoComplete="off" value={deleteConfirmationName} onChange={(event) => setDeleteConfirmationName(event.target.value)} disabled={deletingCustomer} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDeleteCustomerOpen(false)} disabled={deletingCustomer}>Annuler</Button><Button type="submit" variant="destructive" disabled={deletingCustomer || deleteConfirmationName.trim() !== customer.name}>{deletingCustomer ? "Suppression en cours..." : "Supprimer définitivement"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(orderPendingDeletion)} onOpenChange={(open) => { if (deletingOrder) return; if (!open) { setOrderPendingDeletion(null); setDeleteOrderError("") } }}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader><DialogTitle>Supprimer cette commande</DialogTitle><DialogDescription>Cette action est irréversible. La commande {orderPendingDeletion?.order_number || "sélectionnée"} sera supprimée.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {deleteOrderError && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteOrderError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOrderPendingDeletion(null)} disabled={deletingOrder}>Annuler</Button><Button type="button" variant="destructive" onClick={deleteOrder} disabled={deletingOrder}>{deletingOrder ? "Suppression en cours..." : "Supprimer définitivement"}</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={orderOpen} onOpenChange={(open) => { setOrderOpen(open); if (!open) setEditingOrder(null) }}>
        <DialogContent className="overflow-x-hidden sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingOrder ? "Modifier la commande" : "Nouvelle commande"}</DialogTitle><DialogDescription>Renseignez les informations d’expédition et du destinataire.</DialogDescription></DialogHeader>
          <form onSubmit={addOrder} className="min-w-0 space-y-5">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0"><Label>Service</Label><Select value={order.service_type} onValueChange={(value) => setOrder({ ...order, service_type: value, container_id: value === "fret_maritime" ? order.container_id : "" })}><SelectTrigger className="w-full min-w-0"><SelectValue className="min-w-0 truncate" /></SelectTrigger><SelectContent><SelectItem value="fret_maritime">Fret maritime</SelectItem><SelectItem value="fret_aerien">Fret aérien</SelectItem><SelectItem value="demenagement">Déménagement</SelectItem><SelectItem value="dedouanement">Dédouanement</SelectItem><SelectItem value="negoce">Négoce</SelectItem></SelectContent></Select></div>
              {order.service_type === "fret_maritime" && <div className="min-w-0 sm:col-span-2"><Label>Conteneur associé</Label><Select value={order.container_id || "unassigned"} onValueChange={(value) => setOrder({ ...order, container_id: value === "unassigned" ? "" : value })} disabled={containersLoading || containers.length === 0}><SelectTrigger className="w-full min-w-0"><SelectValue className="min-w-0 truncate" placeholder={containersLoading ? "Chargement des conteneurs..." : "Aucun conteneur sélectionné"} /></SelectTrigger><SelectContent className="max-w-[calc(100vw-2rem)]"><SelectItem value="unassigned">Aucun conteneur pour le moment</SelectItem>{containers.map((container) => <SelectItem key={container.id} value={container.id} className="min-w-0 whitespace-normal break-words">{container.code}{container.departure_port && container.arrival_port ? ` · ${container.departure_port} → ${container.arrival_port}` : ""}</SelectItem>)}</SelectContent></Select>{containersLoading ? <p className="mt-1 text-xs text-muted-foreground">Chargement des conteneurs...</p> : containers.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">{containersError || "Aucun conteneur disponible."} <Link href="/admin/containers" className="font-medium text-orange-600 hover:underline">Créez d’abord un conteneur</Link> pour l’associer à cette commande.</p> : <p className="mt-1 text-xs text-muted-foreground">Sélectionnez un conteneur existant ou laissez la commande non associée.</p>}</div>}
              <div><Label>Origine</Label><Input required autoComplete="address-level2" value={order.origin} onChange={(event) => setOrder({ ...order, origin: event.target.value })} /></div>
              <div><Label>Destination</Label><Input required autoComplete="address-level2" value={order.destination} onChange={(event) => setOrder({ ...order, destination: event.target.value })} /></div>
              <div><Label>Poids (kg)</Label><Input type="number" min="0" step="0.01" inputMode="decimal" value={order.weight} onChange={(event) => setOrder({ ...order, weight: event.target.value })} /></div>
              <div><Label>Montant (€)</Label><Input type="number" min="0" step="0.01" inputMode="decimal" value={order.value} onChange={(event) => setOrder({ ...order, value: event.target.value })} /></div>
            </div>
            <div><Label>Description du colis</Label><Textarea value={order.description} onChange={(event) => setOrder({ ...order, description: event.target.value })} placeholder="Contenu, nombre de colis ou consignes utiles" /></div>
            <fieldset className="space-y-4 rounded-lg border p-4"><legend className="px-1 text-sm font-semibold">Destinataire</legend><div className="grid gap-4 sm:grid-cols-2"><div><Label>Nom</Label><Input required autoComplete="name" value={order.recipient_name} onChange={(event) => setOrder({ ...order, recipient_name: event.target.value })} /></div><div><Label>Téléphone</Label><Input required type="tel" autoComplete="tel" value={order.recipient_phone} onChange={(event) => setOrder({ ...order, recipient_phone: event.target.value })} /></div><div className="sm:col-span-2"><Label>Email</Label><Input type="email" autoComplete="email" value={order.recipient_email} onChange={(event) => setOrder({ ...order, recipient_email: event.target.value })} /></div><div className="sm:col-span-2"><Label>Adresse</Label><Input required autoComplete="street-address" value={order.recipient_address} onChange={(event) => setOrder({ ...order, recipient_address: event.target.value })} /></div><div><Label>Ville</Label><Input required autoComplete="address-level2" value={order.recipient_city} onChange={(event) => setOrder({ ...order, recipient_city: event.target.value })} /></div><div><Label>Code postal</Label><Input required autoComplete="postal-code" value={order.recipient_postal_code} onChange={(event) => setOrder({ ...order, recipient_postal_code: event.target.value })} /></div><div className="sm:col-span-2"><Label>Pays</Label><Input required autoComplete="country-name" value={order.recipient_country} onChange={(event) => setOrder({ ...order, recipient_country: event.target.value })} /></div></div></fieldset>
            <div className="sticky bottom-0 -mx-4 flex gap-2 border-t bg-background px-4 pt-3 sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:px-0"><Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => setOrderOpen(false)}>Annuler</Button><Button className="flex-1 sm:flex-none" disabled={saving}>{saving ? "Enregistrement..." : editingOrder ? "Enregistrer" : "Créer la commande"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
