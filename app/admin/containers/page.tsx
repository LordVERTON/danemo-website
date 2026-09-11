"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PackageSearch, Plus, MapPin, Clock, BadgeCheck, Download, Loader2, Pencil, Send } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
interface Container {
  id: string
  code: string
  vessel?: string | null
  departure_port?: string | null
  arrival_port?: string | null
  etd?: string | null
  eta?: string | null
  status: 'planned' | 'departed' | 'in_transit' | 'arrived' | 'delivered' | 'delayed'
  client_id?: string | null
  created_at?: string
}

interface ContainerOrder {
  id: string
  order_number: string
  client_name: string
  client_email?: string | null
  service_type: string
  origin: string
  destination: string
  status: string
  value?: number | null
  weight?: number | null
  created_at: string
}

const containerStatusLabels: Record<Container['status'], string> = {
  planned: "Planifié",
  departed: "Départ confirmé",
  in_transit: "En transit",
  arrived: "Arrivé",
  delivered: "Livré",
  delayed: "Retard signalé",
}

const containerStatusOptions: Array<{ value: Container["status"]; label: string }> = [
  { value: "planned", label: "Planifié" },
  { value: "departed", label: "Départ confirmé" },
  { value: "in_transit", label: "En transit" },
  { value: "arrived", label: "Arrivé" },
  { value: "delivered", label: "Livré" },
  { value: "delayed", label: "Retard signalé" },
]

const formatContainerStatus = (status: string) =>
  containerStatusLabels[status as keyof typeof containerStatusLabels] || status

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default function ContainersPage() {
  const [items, setItems] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<Partial<Container>>({ status: 'planned' })
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState<Container | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [linkedOrders, setLinkedOrders] = useState<ContainerOrder[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState("")
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyError, setNotifyError] = useState<string | null>(null)
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null)
  const [autoNotifyStatusMessage, setAutoNotifyStatusMessage] = useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<Record<string, Container["status"]>>({})
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)
  const [statusUpdateFeedback, setStatusUpdateFeedback] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [containerNotificationHistory, setContainerNotificationHistory] = useState<
    Record<string, { status: string; timestamp: string }>
  >({})

  const fetchContainers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/containers')
      const json = await res.json()
      if (json.success) {
        const fetched = json.data as Container[]
        setItems(fetched)
        setStatusDrafts(
          fetched.reduce((acc, container) => {
            acc[container.id] = container.status
            return acc
          }, {} as Record<string, Container["status"]>),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainerEvents = async (containerId: string) => {
    try {
      setEventsLoading(true)
      // reuse tracking endpoint with container id
      const res = await fetch(`/api/orders/${containerId}/tracking`)
      const json = await res.json()
      if (json.success) setEvents(json.data)
    } catch {}
    finally {
      setEventsLoading(false)
    }
  }

  const fetchLinkedInventory = async (container: Container) => {
    try {
      setInventoryLoading(true)
      const response = await fetch(`/api/containers/${container.id}/inventory`)
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Impossible de charger les articles")
      }
      setLinkedOrders(result.data || [])
    } catch (error) {
      console.error('Error fetching linked inventory', error)
      setLinkedOrders([])
    } finally {
      setInventoryLoading(false)
    }
  }

  const handleNotifySelectedContainer = async () => {
    if (!selected) return
    setNotifyLoading(true)
    setNotifyError(null)
    setNotifySuccess(null)
    try {
      const res = await fetch('/api/notifications/container-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          container_id: selected.id,
          status: selected.status,
          message: manualMessage || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setNotifyError(json.error || 'Échec de l’envoi de la notification')
      } else {
        const recipients = json.data?.recipients ?? 0
        const timestamp = new Date().toISOString()
        setContainerNotificationHistory((prev) => ({
          ...prev,
          [selected.id]: {
            status: selected.status,
            timestamp,
          },
        }))
        const baseMessage = `Notification envoyée pour le statut "${formatContainerStatus(selected.status)}" le ${formatDateTime(timestamp)}.`
        setNotifySuccess(
          recipients > 0
            ? `${baseMessage} ${recipients} destinataire${recipients > 1 ? 's' : ''} informé${recipients > 1 ? 's' : ''}.`
            : baseMessage
        )
        setManualMessage('')
      }
    } catch (error) {
      console.error('Failed to notify container clients', error)
      setNotifyError('Impossible d’envoyer la notification, réessaie plus tard.')
    } finally {
      setNotifyLoading(false)
    }
  }

  const handleTrackingDialogChange = (open: boolean) => {
    setTrackingOpen(open)
    if (!open) {
      setSelected(null)
      setManualMessage('')
      setNotifyError(null)
      setNotifySuccess(null)
      setAutoNotifyStatusMessage(null)
    }
  }

  const openContainerDetails = (container: Container) => {
    setSelected(container)
    setDetailsOpen(true)
  }

  const openContainerTracking = (container: Container) => {
    setSelected(container)
    setManualMessage('')
    setNotifyError(null)
    setNotifySuccess(null)
    setDetailsOpen(false)
    setTrackingOpen(true)
    fetchContainerEvents(container.id)
    fetchLinkedInventory(container)
  }

  const openContainerEditor = (container: Container) => {
    setForm(container)
    setDetailsOpen(false)
    setTrackingOpen(false)
    setOpen(true)
  }

  const exportContainerClients = async (container: Container, format: "xlsx" | "docx") => {
    setExportLoading(`${container.id}:${format}`)
    try {
      const response = await fetch(`/api/documents/clients-by-container?container_id=${encodeURIComponent(container.id)}&format=${format}`)
      if (!response.ok) throw new Error("Export impossible")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `clients-${container.code}.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setStatusUpdateFeedback(error instanceof Error ? error.message : "Export impossible")
    } finally {
      setExportLoading(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(c =>
      c.code.toLowerCase().includes(q) ||
      (c.vessel || '').toLowerCase().includes(q) ||
      (c.departure_port || '').toLowerCase().includes(q) ||
      (c.arrival_port || '').toLowerCase().includes(q),
    )
  }, [items, search])

  const containerNotificationInfo = selected
    ? containerNotificationHistory[selected.id]
    : undefined
  const containerAlreadyNotified =
    !!containerNotificationInfo &&
    !!selected &&
    containerNotificationInfo.status === selected.status

  const ordersByClient = useMemo(() => {
    const groups = new Map<string, ContainerOrder[]>()
    linkedOrders.forEach((order) => {
      const key = order.client_name?.trim() || "Client non renseigné"
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(order)
    })
    return Array.from(groups.entries())
  }, [linkedOrders])

  const submit = async () => {
    const payload = {
      code: String(form.code || '').trim(),
      vessel: (form.vessel || null) as string | null,
      departure_port: (form.departure_port || null) as string | null,
      arrival_port: (form.arrival_port || null) as string | null,
      etd: (form.etd || null) as string | null,
      eta: (form.eta || null) as string | null,
      status: (form.status || 'planned') as Container['status'],
      client_id: (form.client_id || null) as string | null,
    }
    if (!payload.code) return
    const isEditing = Boolean(form.id)
    const res = await fetch(isEditing ? `/api/containers/${form.id}` : '/api/containers', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      setOpen(false)
      setForm({ status: 'planned' })
      fetchContainers()
    }
  }

  const updateContainerStatus = async (container: Container) => {
    const nextStatus = statusDrafts[container.id] || container.status
    if (nextStatus === container.status) return

    try {
      setStatusUpdateLoading(container.id)
      setStatusUpdateFeedback(null)

      const response = await fetch(`/api/containers/${container.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Impossible de mettre à jour le statut.")
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === container.id
            ? { ...item, status: nextStatus }
            : item,
        ),
      )

      if (selected?.id === container.id) {
        setSelected((prev) => (prev ? { ...prev, status: nextStatus } : prev))
        setAutoNotifyStatusMessage(
          `Changement de statut enregistré : "${formatContainerStatus(nextStatus)}". Les clients liés au conteneur ont été notifiés automatiquement par e-mail.`,
        )
      }

      setStatusUpdateFeedback(
        `Le statut du conteneur ${container.code} est passé à "${formatContainerStatus(nextStatus)}". Les clients liés sont notifiés automatiquement.`,
      )
    } catch (error) {
      console.error("Failed to update container status", error)
      setStatusUpdateFeedback(
        error instanceof Error
          ? error.message
          : "Échec de la mise à jour du statut du conteneur.",
      )
    } finally {
      setStatusUpdateLoading(null)
    }
  }

  return (
    <AdminLayout title="Conteneurs">
      <div className="space-y-6">
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg w-[95vw]">
              <DialogHeader>
                <DialogTitle>{form.id ? "Modifier le conteneur" : "Ajouter un conteneur"}</DialogTitle>
                <DialogDescription>Renseignez seulement les informations utiles au suivi du transport.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Code (ex: MSKU1234567)</Label>
                  <Input value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Navire</Label>
                  <Input value={form.vessel || ''} onChange={e => setForm({ ...form, vessel: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Port de départ</Label>
                  <Input value={form.departure_port || ''} onChange={e => setForm({ ...form, departure_port: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Port d&apos;arrivée</Label>
                  <Input value={form.arrival_port || ''} onChange={e => setForm({ ...form, arrival_port: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>ETD</Label>
                  <Input type="date" value={form.etd || ''} onChange={e => setForm({ ...form, etd: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>ETA</Label>
                  <Input type="date" value={form.eta || ''} onChange={e => setForm({ ...form, eta: e.target.value })} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Statut</Label>
                  <Select value={form.status || 'planned'} onValueChange={(value: Container['status']) => setForm({ ...form, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{containerStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="button" onClick={submit}>{form.id ? "Enregistrer" : "Créer le conteneur"}</Button>
                </DialogFooter>
              </div>
            </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-orange-600" />
              Liste des conteneurs
            </CardTitle>
            <div className="flex w-full gap-2 sm:w-auto">
              <Input className="flex-1 sm:w-64" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              <Button type="button" className="hidden sm:inline-flex" onClick={() => { setForm({ status: 'planned' }); setOpen(true) }}><Plus className="mr-2 size-4" />Nouveau conteneur</Button>
            </div>
          </CardHeader>
          <CardContent>
            {statusUpdateFeedback && (
              <Alert className="mb-4">
                <AlertDescription>{statusUpdateFeedback}</AlertDescription>
              </Alert>
            )}
            <div className="divide-y overflow-hidden rounded-lg border">
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Chargement...</p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun conteneur</p>
              ) : (
                filtered.map((c) => (
                  <article key={c.id} className="min-w-0 p-3 transition-colors hover:bg-muted/50 sm:p-4">
                    <button type="button" className="min-w-0 w-full text-left" onClick={() => openContainerDetails(c)} aria-label={`Ouvrir le conteneur ${c.code}`}>
                      <div className="flex min-w-0 items-center gap-2"><p className="truncate font-mono font-medium text-foreground">{c.code}</p><Badge variant="outline" className="shrink-0 text-xs">{formatContainerStatus(c.status)}</Badge></div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{c.departure_port || "Départ à confirmer"} → {c.arrival_port || "Arrivée à confirmer"}{c.vessel ? ` · ${c.vessel}` : ""}</p>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openContainerEditor(c)}><Pencil className="mr-2 size-4" />Modifier</Button>
                      <Button type="button" variant="outline" size="sm" disabled={exportLoading !== null} onClick={() => exportContainerClients(c, "xlsx")}>
                        {exportLoading === `${c.id}:xlsx` ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />} Excel
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={exportLoading !== null} onClick={() => exportContainerClients(c, "docx")}>
                        {exportLoading === `${c.id}:docx` ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />} Word
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
            <div className="hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Navire</th>
                    <th className="text-left p-2">Départ</th>
                    <th className="text-left p-2">Arrivée</th>
                    <th className="text-left p-2">ETD</th>
                    <th className="text-left p-2">ETA</th>
                    <th className="text-left p-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-3" colSpan={7}>Chargement...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td className="p-3" colSpan={7}>Aucun conteneur</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2 font-medium">{c.code}</td>
                        <td className="p-2">{c.vessel || '-'}</td>
                        <td className="p-2">{c.departure_port || '-'}</td>
                        <td className="p-2">{c.arrival_port || '-'}</td>
                        <td className="p-2">{c.etd || '-'}</td>
                        <td className="p-2">{c.eta || '-'}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Select
                              value={statusDrafts[c.id] || c.status}
                              onValueChange={(value: Container["status"]) =>
                                setStatusDrafts((prev) => ({ ...prev, [c.id]: value }))
                              }
                            >
                              <SelectTrigger className="w-[180px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {containerStatusOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={
                                statusUpdateLoading === c.id ||
                                (statusDrafts[c.id] || c.status) === c.status
                              }
                              onClick={() => updateContainerStatus(c)}
                            >
                              {statusUpdateLoading === c.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Enregistrer"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelected(c)
                                setManualMessage('')
                                setNotifyError(null)
                                setNotifySuccess(null)
                                setTrackingOpen(true)
                                fetchContainerEvents(c.id)
                                fetchLinkedInventory(c)
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                              Suivi
                            </Button>
                            <Button variant="outline" size="sm" disabled={exportLoading !== null} onClick={() => exportContainerClients(c, "xlsx")}>
                              {exportLoading === `${c.id}:xlsx` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} XLSX
                            </Button>
                            <Button variant="outline" size="sm" disabled={exportLoading !== null} onClick={() => exportContainerClients(c, "docx")}>
                              {exportLoading === `${c.id}:docx` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} DOCX
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          size="icon"
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 rounded-full shadow-lg sm:hidden"
          onClick={() => { setForm({ status: 'planned' }); setOpen(true) }}
          aria-label="Créer un conteneur"
        >
          <Plus className="size-6" />
        </Button>

        <Dialog open={detailsOpen} onOpenChange={(isOpen) => { setDetailsOpen(isOpen); if (!isOpen && !trackingOpen) setSelected(null) }}>
          <DialogContent className="w-[95vw] max-w-lg">
            <DialogHeader>
              <DialogTitle>Conteneur {selected?.code}</DialogTitle>
              <DialogDescription>Consultez les informations essentielles ou accédez au suivi détaillé.</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-5">
                <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <div><p className="text-xs text-muted-foreground">Trajet</p><p className="mt-1 font-medium">{selected.departure_port || "Départ à confirmer"} → {selected.arrival_port || "Arrivée à confirmer"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Navire</p><p className="mt-1 font-medium">{selected.vessel || "Non renseigné"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Départ estimé</p><p className="mt-1 font-medium">{selected.etd || "Non renseigné"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Arrivée estimée</p><p className="mt-1 font-medium">{selected.eta || "Non renseignée"}</p></div>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={statusDrafts[selected.id] || selected.status} onValueChange={(value: Container["status"]) => setStatusDrafts((prev) => ({ ...prev, [selected.id]: value }))}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{containerStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="secondary" disabled={statusUpdateLoading === selected.id || (statusDrafts[selected.id] || selected.status) === selected.status} onClick={() => updateContainerStatus(selected)}>{statusUpdateLoading === selected.id ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}</Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => openContainerEditor(selected)}><Pencil className="mr-2 size-4" />Modifier</Button>
                  <Button type="button" onClick={() => openContainerTracking(selected)}><MapPin className="mr-2 size-4" />Suivi complet</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={trackingOpen} onOpenChange={handleTrackingDialogChange}>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[90dvh] overflow-x-hidden overflow-y-auto p-4 sm:w-[92vw] sm:p-6">
            <DialogHeader className="min-w-0 pr-8">
              <DialogTitle className="text-lg sm:text-xl">Suivi du conteneur {selected?.code}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Consulte l’avancement, notifie les clients et visualise les commandes liées.
              </DialogDescription>
            </DialogHeader>
            <div className="min-w-0 space-y-4 sm:space-y-6">
              {autoNotifyStatusMessage && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{autoNotifyStatusMessage}</AlertDescription>
                </Alert>
              )}
              {selected && (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    <div className="hidden gap-2 lg:flex">
                      <Button variant="outline" disabled={exportLoading !== null} onClick={() => exportContainerClients(selected, "xlsx")}>{exportLoading === `${selected.id}:xlsx` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} XLSX</Button>
                      <Button variant="outline" disabled={exportLoading !== null} onClick={() => exportContainerClients(selected, "docx")}>{exportLoading === `${selected.id}:docx` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} DOCX</Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      onClick={() => openContainerEditor(selected)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sm:hidden">Modifier</span>
                      <span className="hidden sm:inline">Modifier les informations</span>
                    </Button>
                  </div>
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 space-y-2 rounded-lg border border-gray-100 bg-white/80 p-4">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Informations conteneur</p>
                      <div className="grid gap-3 text-sm min-[420px]:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Code</p>
                          <p className="truncate font-semibold text-base" title={selected.code}>{selected.code}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Statut</p>
                          <p className="truncate font-semibold capitalize" title={selected.status.replace("_", " ")}>{selected.status.replace("_", " ")}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Navire</p>
                          <p className="truncate font-medium" title={selected.vessel || "—"}>{selected.vessel || "—"}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Client assigné</p>
                          <p className="font-medium">{selected.client_id ? "Client associé" : "Non défini"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2 rounded-lg border border-gray-100 bg-white/80 p-4">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Trajet & planning</p>
                      <div className="grid gap-3 text-sm min-[420px]:grid-cols-2">
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Départ</p>
                          <p className="truncate font-medium" title={selected.departure_port || "—"}>{selected.departure_port || "—"}</p>
                          <p className="text-xs text-muted-foreground">{selected.etd || "Date inconnue"}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Arrivée</p>
                          <p className="truncate font-medium" title={selected.arrival_port || "—"}>{selected.arrival_port || "—"}</p>
                          <p className="text-xs text-muted-foreground">{selected.eta || "Date inconnue"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-orange-100 bg-orange-50/60 p-4">
                    <div>
                      <Label htmlFor="notification-message" className="text-sm font-medium">
                        Message de notification (optionnel)
                      </Label>
                      <Textarea
                        id="notification-message"
                        placeholder="Ajoute un mot pour les clients (facultatif)…"
                        value={manualMessage}
                        onChange={(e) => setManualMessage(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        <Button
                          onClick={handleNotifySelectedContainer}
                          disabled={notifyLoading}
                          className="flex items-center gap-2"
                        >
                          {notifyLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Notifier les clients
                        </Button>
                        {notifySuccess && (
                          <Alert className="flex-1 min-w-[200px] border-green-200 bg-green-50 text-green-800">
                            <AlertDescription>{notifySuccess}</AlertDescription>
                          </Alert>
                        )}
                        {notifyError && (
                          <Alert variant="destructive" className="flex-1 min-w-[200px]">
                            <AlertDescription>{notifyError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <p className="min-w-0 break-words text-xs text-muted-foreground">
                        {containerAlreadyNotified && containerNotificationInfo
                          ? `Clients notifiés du statut "${formatContainerStatus(selected.status)}" le ${formatDateTime(containerNotificationInfo.timestamp)}.`
                          : containerNotificationInfo
                          ? `Dernière notification : "${formatContainerStatus(containerNotificationInfo.status)}" le ${formatDateTime(containerNotificationInfo.timestamp)}.`
                          : "Aucune notification envoyée pour ce conteneur pour l’instant."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {eventsLoading ? (
                <div className="text-sm text-muted-foreground">Chargement des événements...</div>
              ) : events.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun événement</div>
              ) : (
                <div className="max-h-[320px] min-w-0 space-y-2 overflow-x-hidden overflow-y-auto rounded-lg border border-gray-100 bg-white/70 p-3">
                  {events.map((ev, idx) => (
                    <div key={ev.id || idx} className="min-w-0 rounded-md border p-3">
                      <div className="flex min-w-0 flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
                        <BadgeCheck className="h-4 w-4 text-orange-600" />
                        <span className="font-medium break-words">{ev.status}</span>
                        <span className="flex items-center gap-1 break-words text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ev.event_date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {ev.location && (
                        <div className="mt-1 flex min-w-0 items-start gap-1 break-words text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </div>
                      )}
                      {ev.description && <div className="mt-1 break-words text-sm">{ev.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <h3 className="text-base font-semibold">Commandes liées</h3>
                {inventoryLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement des commandes...</div>
                ) : ordersByClient.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune commande assignée à ce conteneur</div>
                ) : (
                  <div className="space-y-4">
                    {ordersByClient.map(([clientName, orders]) => (
                      <div key={clientName} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{clientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {orders.length} commande{orders.length > 1 ? "s" : ""} liée{orders.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {orders.map((order) => (
                            <article key={order.id} className="min-w-0 rounded-md border bg-white p-3 text-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0"><p className="truncate font-mono text-xs font-medium">{order.order_number}</p><p className="mt-1 capitalize text-muted-foreground">{order.service_type.replace("_", " ")}</p></div>
                                <Badge variant="outline" className="shrink-0 capitalize">{order.status.replace("_", " ")}</Badge>
                              </div>
                              <p className="mt-2 break-words text-xs text-muted-foreground">{order.origin} → {order.destination}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}


