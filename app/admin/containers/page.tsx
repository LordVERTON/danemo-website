"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PackageSearch, Plus, MapPin, Clock, BadgeCheck, Loader2, Send } from "lucide-react"
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
  const [selected, setSelected] = useState<Container | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [linkedOrders, setLinkedOrders] = useState<ContainerOrder[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState("")
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyError, setNotifyError] = useState<string | null>(null)
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null)
const [containerNotificationHistory, setContainerNotificationHistory] = useState<
  Record<string, { status: string; timestamp: string }>
>({})

  const fetchContainers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/containers')
      const json = await res.json()
      if (json.success) setItems(json.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const session = localStorage.getItem("danemo_admin_session")
    if (session !== "authenticated") {
      window.location.href = "/admin/login"
      return
    }
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
    const res = await fetch('/api/containers', {
      method: 'POST',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-orange-600">Conteneurs</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Nouveau conteneur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Ajouter un conteneur</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
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
                    <Label>Port d'arrivée</Label>
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
                  <Button onClick={submit}>Enregistrer</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-orange-600" />
              Liste des conteneurs
            </CardTitle>
            <div className="w-64">
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                          <div className="flex items-center gap-2">
                            <span>{c.status}</span>
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

        <Dialog open={trackingOpen} onOpenChange={handleTrackingDialogChange}>
          <DialogContent className="max-w-4xl w-full sm:w-[92vw] lg:w-[80vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Suivi du conteneur {selected?.code}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Consulte l’avancement, notifie les clients et visualise les commandes liées.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6">
              {selected && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-white/80 p-4 space-y-2">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Informations conteneur</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Code</p>
                          <p className="font-semibold text-base">{selected.code}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Statut</p>
                          <p className="font-semibold capitalize">{selected.status.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Navire</p>
                          <p className="font-medium">{selected.vessel || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Client assigné</p>
                          <p className="font-medium">{selected.client_id ? "Client associé" : "Non défini"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-white/80 p-4 space-y-2">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Trajet & planning</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Départ</p>
                          <p className="font-medium">{selected.departure_port || "—"}</p>
                          <p className="text-xs text-muted-foreground">{selected.etd || "Date inconnue"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Arrivée</p>
                          <p className="font-medium">{selected.arrival_port || "—"}</p>
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
                      <p className="text-xs text-muted-foreground">
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
                <div className="space-y-2 rounded-lg border border-gray-100 bg-white/70 p-3 max-h-[320px] overflow-y-auto">
                  {events.map((ev, idx) => (
                    <div key={ev.id || idx} className="p-3 border rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <BadgeCheck className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{ev.status}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ev.event_date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      {ev.location && (
                        <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </div>
                      )}
                      {ev.description && <div className="mt-1 text-sm">{ev.description}</div>}
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
                        <div className="overflow-x-auto">
                          <Table className="w-full text-sm">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Trajet</TableHead>
                                <TableHead>Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                                  <TableCell className="capitalize">{order.service_type.replace("_", " ")}</TableCell>
                                  <TableCell className="text-xs">
                                    <div>{order.origin}</div>
                                    <div className="text-muted-foreground">→ {order.destination}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {order.status.replace("_", " ")}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


