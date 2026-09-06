"use client"

import { useState, useEffect, useRef } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, MapPin, Clock, Truck, Package, Ship, CheckCircle, AlertCircle, Plus, ExternalLink, PackageSearch, QrCode } from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"

interface Order {
  id: string
  order_number: string
  client_name: string
  client_email: string
  client_phone?: string
  service_type: string
  origin: string
  destination: string
  weight?: string | number
  value?: string | number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  estimated_delivery?: string
  qr_code?: string | null
  created_at: string
  updated_at: string
  container_id?: string | null
  container_code?: string | null
  container_status?: string | null
}

interface TrackingEvent {
  id: string
  order_id: string
  status: string
  location?: string
  description?: string
  operator?: string
  event_date: string
}

export default function TrackingPage() {
  const { user: currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterContainer, setFilterContainer] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingTrackingEvents, setIsLoadingTrackingEvents] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [containers, setContainers] = useState<Array<{ id: string; code: string; status?: string | null }>>([])
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  /** Ignore les réponses obsolètes si l’utilisateur change de ligne rapidement */
  const trackingLoadSeq = useRef(0)

  // Formulaire pour ajouter un événement
  const [newEvent, setNewEvent] = useState({
    status: "",
    location: "",
    description: "",
    operator: "",
    event_date: new Date().toISOString().split('T')[0]
  })


  useEffect(() => {
    fetchOrders()
    fetchContainers()
  }, [])
  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers')
      const result = await response.json()
      if (result.success) {
        setContainers(result.data.map((c: any) => ({ id: c.id, code: c.code, status: c.status })))
      }
    } catch (error) {
      console.error('Error fetching containers:', error)
    }
  }


  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/orders')
      const result = await response.json()

      if (result.success) {
        setOrders(result.data)
      } else {
        setErrorMessage('Erreur lors du chargement des commandes')
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrackingEvents = async (orderId: string) => {
    const id = String(orderId || "").trim()
    if (!id) {
      setTrackingEvents([])
      setErrorMessage("Identifiant de commande invalide")
      return
    }

    const seq = ++trackingLoadSeq.current

    try {
      setIsLoadingTrackingEvents(true)
      setErrorMessage("")

      const response = await fetch(
        `/api/orders/${encodeURIComponent(id)}/tracking`,
        { credentials: "same-origin" }
      )

      const text = await response.text()
      let result: { success?: boolean; data?: TrackingEvent[]; error?: string } =
        {}
      try {
        result = text ? JSON.parse(text) : {}
      } catch {
        if (seq !== trackingLoadSeq.current) return
        setTrackingEvents([])
        setErrorMessage("Réponse serveur invalide")
        return
      }

      if (seq !== trackingLoadSeq.current) return

      if (!response.ok) {
        setTrackingEvents([])
        setErrorMessage(
          result.error || `Erreur ${response.status} lors du chargement du suivi`
        )
        return
      }

      if (result.success && Array.isArray(result.data)) {
        setTrackingEvents(result.data)
      } else {
        setTrackingEvents([])
        setErrorMessage(
          result.error || "Impossible de charger les événements de suivi"
        )
      }
    } catch (error) {
      if (seq !== trackingLoadSeq.current) return
      console.error("Error fetching tracking events:", error)
      setTrackingEvents([])
      setErrorMessage(
        "Erreur réseau (vérifiez que le serveur Next.js est bien démarré)"
      )
    } finally {
      if (seq === trackingLoadSeq.current) {
        setIsLoadingTrackingEvents(false)
      }
    }
  }

  const handleRowClick = async (order: Order) => {
    setSelectedOrder(order)
    setIsTrackingDialogOpen(true)
    // Charger les événements en arrière-plan pour une ouverture plus fluide
    await fetchTrackingEvents(order.id)
  }


  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      setIsUpdating(true)
      setErrorMessage("")

      const response = await fetch(`/api/orders/${selectedOrder.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('Événement ajouté avec succès')
        setNewEvent({ status: "", location: "", description: "", operator: "", event_date: new Date().toISOString().split('T')[0] })
        fetchTrackingEvents(selectedOrder.id)
        fetchOrders() // Refresh orders to update status
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrorMessage(result.error || 'Erreur lors de l\'ajout de l\'événement')
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGenerateQRCode = async () => {
    if (!selectedOrder) return

    try {
      setIsGeneratingQR(true)
      setErrorMessage("")

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate-qr' }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccessMessage('QR code généré avec succès')

        // Utiliser directement la commande mise à jour retournée par l'API
        // L'API retourne { qr_code: string, order: Order }
        if (result.data?.order) {
          // La commande complète avec le QR code
          setSelectedOrder(result.data.order as Order)
        } else if (result.data?.qr_code && selectedOrder) {
          // Si seulement le QR code est retourné, mettre à jour la commande sélectionnée
          setSelectedOrder({
            ...selectedOrder,
            qr_code: result.data.qr_code
          } as Order)
        }

        // Rafraîchir la liste des commandes pour que le QR code apparaisse partout
        await fetchOrders()

        // S'assurer que la commande sélectionnée est bien mise à jour après le rafraîchissement
        if (result.data?.order) {
          setSelectedOrder(result.data.order as Order)
        }

        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrorMessage(result.error || 'Erreur lors de la génération du QR code')
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion')
    } finally {
      setIsGeneratingQR(false)
    }
  }


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: "Confirmée", variant: "secondary" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: "En cours", variant: "default" as const, icon: Truck, color: "text-orange-600" },
      completed: { label: "Terminée", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { label: "Annulée", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
    }

    // Configuration par défaut pour les statuts non reconnus
    const defaultConfig = { label: status, variant: "outline" as const, icon: Clock, color: "text-gray-600" }

    const config = statusConfig[status as keyof typeof statusConfig] || defaultConfig
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'fret_maritime':
        return <Ship className="h-4 w-4 text-blue-600" />
      case 'fret_aerien':
        return <Package className="h-4 w-4 text-sky-600" />
      case 'demenagement':
        return <Truck className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getServiceTypeLabel = (type: string) => {
    const types = {
      fret_maritime: "Fret maritime",
      fret_aerien: "Fret aérien",
      demenagement: "Déménagement",
      dedouanement: "Dédouanement",
      negoce: "Négoce"
    }
    return types[type as keyof typeof types] || type
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesContainer =
      filterContainer === "all" ||
      order.container_id === filterContainer ||
      order.container_code === filterContainer

    return matchesSearch && matchesStatus && matchesContainer
  })

  if (isLoading) {
    return (
      <AdminLayout title="Suivi des commandes">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement des commandes...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Suivi des commandes</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Consultez l’avancement et ajoutez un événement de suivi.</p>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Filtres */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro, nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full min-w-0"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0 sm:shrink-0">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48 min-w-0">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterContainer} onValueChange={setFilterContainer}>
                  <SelectTrigger className="w-full sm:w-56 min-w-0 [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
                    <SelectValue placeholder="Filtrer par conteneur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les conteneurs</SelectItem>
                    {containers.map((container) => (
                      <SelectItem key={container.id} value={container.id}>
                        {container.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table des commandes */}
        <Card className="border-0 bg-transparent py-0 shadow-none lg:border lg:bg-card lg:py-6 lg:shadow-sm">
          <CardHeader className="hidden lg:grid">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Commandes ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 lg:px-6">
            <div className="space-y-3 lg:hidden">
              {filteredOrders.map((order) => {
                const containerForOrder = containers.find(
                  (container) => container.id === order.container_id || container.code === order.container_code,
                )

                return (
                  <article key={order.id} className="rounded-xl border p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-slate-900">{order.order_number}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{order.client_name}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{order.origin} <span className="text-muted-foreground">→</span> {order.destination}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">{containerForOrder ? `Conteneur ${containerForOrder.code}` : "Sans conteneur"}</span>
                      <span className="shrink-0">{order.estimated_delivery ? `Prévu le ${new Date(order.estimated_delivery).toLocaleDateString('fr-FR')}` : "Date non définie"}</span>
                    </div>
                    <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => handleRowClick(order)}>
                      <MapPin className="mr-2 size-4" />
                      Ouvrir le suivi
                    </Button>
                  </article>
                )
              })}
            </div>
            <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Conteneur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Livraison estimée</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const containerForOrder = containers.find(
                    (container) =>
                      container.id === order.container_id ||
                      container.code === order.container_code,
                  )

                  return (
                    <TableRow
                      key={order.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <TableCell className="font-mono font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.client_name}</div>
                          <div className="text-sm text-muted-foreground">{order.client_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getServiceTypeIcon(order.service_type)}
                          <span>{getServiceTypeLabel(order.service_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.origin}</div>
                          <div className="text-muted-foreground">→ {order.destination}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {containerForOrder ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {containerForOrder.code}
                            </Badge>
                            {containerForOrder.status && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {containerForOrder.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.estimated_delivery
                          ? new Date(order.estimated_delivery).toLocaleDateString('fr-FR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(order.updated_at).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                fetchTrackingEvents(order.id)
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                              Suivi
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Suivi de la commande {order.order_number}</DialogTitle>
                              <DialogDescription>
                                Historique des événements et ajout de nouveaux événements
                              </DialogDescription>
                              {currentUser && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  Géré par : <span className="font-medium">{currentUser.name}</span>
                                </div>
                              )}
                            </DialogHeader>

                            <div className="space-y-6">
                              <div className="border rounded-lg p-4 bg-muted/30">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <PackageSearch className="h-4 w-4 text-orange-600" />
                                  Conteneur associé
                                </h4>
                                {containerForOrder ? (
                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                                      {containerForOrder.code}
                                    </Badge>
                                    <span className="text-muted-foreground capitalize">
                                      Statut: {containerForOrder.status?.replace(/_/g, " ") || "—"}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(`/admin/containers?code=${containerForOrder.code}`, '_blank')
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Voir les conteneurs
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Aucun conteneur associé à cette commande.
                                  </p>
                                )}
                              </div>

                              {/* Historique des événements */}
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Historique des événements</h3>
                                <div className="space-y-3">
                                  {trackingEvents.length > 0 ? (
                                    trackingEvents.map((event, index) => (
                                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline">{event.status}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {new Date(event.event_date).toLocaleString('fr-FR')}
                                            </span>
                                          </div>
                                          {event.location && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                              <MapPin className="h-3 w-3" />
                                              {event.location}
                                            </div>
                                          )}
                                          {event.description && (
                                            <p className="text-sm">{event.description}</p>
                                          )}
                                          {event.operator && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Opérateur: {event.operator}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      Aucun événement de suivi enregistré
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Formulaire pour ajouter un événement */}
                              <div>
                                <h3 className="text-lg font-semibold mb-4">Ajouter un événement</h3>
                                <form onSubmit={handleAddEvent} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="status">Statut</Label>
                                      <Select
                                        value={newEvent.status}
                                        onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionner un statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">En attente</SelectItem>
                                          <SelectItem value="confirmed">Confirmée</SelectItem>
                                          <SelectItem value="in_progress">En cours</SelectItem>
                                          <SelectItem value="completed">Terminée</SelectItem>
                                          <SelectItem value="cancelled">Annulée</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="location">Localisation</Label>
                                      <Input
                                        id="location"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="Ex: Port de Dakar"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                      id="description"
                                      value={newEvent.description}
                                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                      placeholder="Décrivez l'événement..."
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setNewEvent({
                                          status: '',
                                          location: '',
                                          description: '',
                                          operator: '',
                                          event_date: new Date().toISOString().split('T')[0],
                                        })
                                      }
                                    >
                                      Annuler
                                    </Button>
                                    <Button type="submit" disabled={isUpdating}>
                                      {isUpdating ? 'Ajout...' : 'Ajouter l\'événement'}
                                    </Button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de suivi avec historique des événements */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="break-words">Suivi de la commande {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                Mettez à jour le suivi, puis partagez le QR code si nécessaire.
              </DialogDescription>
              {currentUser && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Géré par : <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
            </DialogHeader>

            <div className="min-w-0 overflow-x-hidden px-1">
              <div className="min-w-0 space-y-6">
              {/* Action principale : visible en premier sur mobile */}
              <section className="min-w-0 rounded-xl border border-orange-200 bg-orange-50/60 p-4 sm:p-5">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Ajouter un événement</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={newEvent.status}
                        onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Localisation</Label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Ex. Port de Dakar"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Décrivez l’événement…"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setNewEvent({
                      status: '',
                      location: '',
                      description: '',
                      operator: '',
                      event_date: new Date().toISOString().split('T')[0]
                    })}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                      {isUpdating ? 'Ajout…' : 'Ajouter l’événement'}
                    </Button>
                  </div>
                </form>
              </section>

              {/* QR Code Section */}
              {selectedOrder?.qr_code ? (
                <section className="min-w-0 rounded-xl border bg-muted/30 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <QrCode className="h-4 w-4 text-orange-600" />
                    QR Code de la commande
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`/admin/qr?code=${encodeURIComponent(selectedOrder.qr_code || '')}`, '_blank')}
                    className="w-full justify-center gap-2 sm:w-auto"
                  >
                    <QrCode className="size-4" />
                    Voir le QR code de la commande
                  </Button>
                </section>
              ) : (
                <section className="min-w-0 rounded-xl border bg-muted/30 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <QrCode className="h-4 w-4 text-orange-600" />
                    QR Code de la commande
                  </h3>
                  <div className="flex min-w-0 flex-col items-stretch gap-3 sm:items-start">
                    <p className="text-sm text-muted-foreground">
                      Cette commande n&apos;a pas encore de QR code. Générez-en un pour permettre le suivi via scan.
                    </p>
                    <Button
                      variant="default"
                      onClick={handleGenerateQRCode}
                      disabled={isGeneratingQR}
                      className="w-full justify-center gap-2 sm:w-auto"
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Génération...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4" />
                          Générer un QR code
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              )}
              {/* Historique des événements */}
              <section className="min-w-0">
                <h3 className="text-lg font-semibold mb-4">Historique des événements</h3>
                <div className="space-y-3">
                  {isLoadingTrackingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span className="text-muted-foreground">Chargement des événements...</span>
                      </div>
                    </div>
                  ) : trackingEvents.length > 0 ? (
                    trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex min-w-0 items-start gap-3 rounded-lg border p-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            {getStatusBadge(event.status)}
                            <span className="break-words text-sm text-muted-foreground">
                              {new Date(event.event_date).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                          {event.description && (
                            <p className="break-words text-sm">{event.description}</p>
                          )}
                          {event.operator && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Opérateur: {event.operator}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Aucun événement de suivi enregistré
                    </div>
                  )}
                </div>
              </section>

              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
