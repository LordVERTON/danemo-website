'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Users } from "lucide-react"

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  created_at?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState<Partial<Client>>({})

  const fetchClients = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (json.success) setClients(json.data)
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
    fetchClients()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q),
    )
  }, [clients, search])

  const submit = async () => {
    const payload = {
      name: String(form.name || '').trim(),
      email: (form.email || null) as string | null,
      phone: (form.phone || null) as string | null,
      address: (form.address || null) as string | null,
      company: (form.company || null) as string | null,
    }
    if (!payload.name) return
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      setOpen(false)
      setForm({})
      fetchClients()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-orange-600">Clients</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Nouveau client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-[95vw]">
                <DialogHeader>
                  <DialogTitle>Ajouter un client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nom</Label>
                    <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Téléphone</Label>
                    <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Adresse</Label>
                    <Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Société</Label>
                    <Input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} />
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
              <Users className="h-5 w-5 text-orange-600" />
              Liste des clients
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
                    <th className="text-left p-2">Nom</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Téléphone</th>
                    <th className="text-left p-2">Société</th>
                    <th className="text-left p-2">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="p-3" colSpan={5}>Chargement...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td className="p-3" colSpan={5}>Aucun client</td></tr>
                  ) : (
                    filtered.map(c => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2 font-medium">{c.name}</td>
                        <td className="p-2">{c.email || '-'}</td>
                        <td className="p-2">{c.phone || '-'}</td>
                        <td className="p-2">{c.company || '-'}</td>
                        <td className="p-2">{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

