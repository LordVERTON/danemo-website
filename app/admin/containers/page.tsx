"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PackageSearch, Plus, MapPin, Clock, BadgeCheck } from "lucide-react"
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
  const [linkedInventory, setLinkedInventory] = useState<any[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)

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
      const res = await fetch('/api/inventory')
      const json = await res.json()
      if (json.success) {
        const items = (json.data as any[]).filter(
          (it) => it.container_id === container.id || it.container_code === container.code,
        )
        setLinkedInventory(items)
      }
    } catch {}
    finally {
      setInventoryLoading(false)
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

        <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Suivi du conteneur {selected?.code}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {eventsLoading ? (
                <div className="text-sm text-muted-foreground">Chargement des événements...</div>
              ) : events.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun événement</div>
              ) : (
                <div className="space-y-2">
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

              <div className="pt-2">
                <h3 className="text-base font-semibold mb-2">Articles liés</h3>
                {inventoryLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement des articles...</div>
                ) : linkedInventory.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucun article assigné à ce conteneur</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Localisation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedInventory.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="font-mono text-xs">{it.reference}</TableCell>
                            <TableCell className="capitalize">{it.type}</TableCell>
                            <TableCell>{it.client}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{it.status}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{it.location}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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


