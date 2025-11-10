"use client"

import { useState, useEffect } from "react"
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
import { Search, MapPin, Clock, Truck, Package, Ship, CheckCircle, AlertCircle, Plus, Eye, ExternalLink, PackageSearch } from "lucide-react"
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
    try {
      setIsLoadingTrackingEvents(true)
      const response = await fetch(`/api/orders/${orderId}/tracking`)
      const result = await response.json()
      
      if (result.success) {
        setTrackingEvents(result.data)
      }
    } catch (error) {
      console.error('Error fetching tracking events:', error)
    } finally {
      setIsLoadingTrackingEvents(false)
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

  const selectedContainer = selectedOrder
    ? containers.find(
        (container) =>
          container.id === selectedOrder.container_id ||
          container.code === selectedOrder.container_code,
      )
    : undefined

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
    <AdminLayout title="Suivi des commandes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Suivez les expéditions et mettez à jour les statuts
            </p>
          </div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Cliquez sur une ligne pour voir le suivi de la commande</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par numéro, nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
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
                  <SelectTrigger className="w-56">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Commandes ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      className="cursor-pointer hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01] transition-all duration-200 ease-in-out group"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          {order.order_number}
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
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
          </CardContent>
        </Card>

        {/* Modal de suivi avec historique des événements */}
        <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] transition-all duration-300 ease-in-out flex flex-col">
            <DialogHeader>
              <DialogTitle>Suivi de la commande {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                Historique des événements et ajout de nouveaux événements
              </DialogDescription>
              {currentUser && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Géré par : <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <PackageSearch className="h-4 w-4 text-orange-600" />
                  Conteneur associé
                </h3>
                {selectedContainer ? (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                      {selectedContainer.code}
                    </Badge>
                    <span className="text-muted-foreground capitalize">
                      Statut: {selectedContainer.status?.replace(/_/g, " ") || "—"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`/admin/containers?code=${selectedContainer.code}`, '_blank')
                      }
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir les conteneurs
                    </Button>
                  </div>
                ) : selectedOrder?.container_code ? (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                      {selectedOrder.container_code}
                    </Badge>
                    <span className="text-muted-foreground">Ce conteneur n’est pas présent dans la liste.</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun conteneur associé à cette commande.</p>
                )}
              </div>
              {/* Historique des événements */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Historique des événements</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 relative">
                  {/* Gradient fade pour indiquer qu'il y a plus de contenu */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                  {isLoadingTrackingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span className="text-muted-foreground">Chargement des événements...</span>
                      </div>
                    </div>
                  ) : trackingEvents.length > 0 ? (
                    trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(event.status)}
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
                  {/* Padding en bas pour éviter que le contenu soit coupé par le gradient */}
                  <div className="h-8"></div>
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
                    <Button type="button" variant="outline" onClick={() => setNewEvent({
                      status: '',
                      location: '',
                      description: '',
                      operator: '',
                      event_date: new Date().toISOString().split('T')[0]
                    })}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? 'Ajout...' : 'Ajouter l\'événement'}
                    </Button>
                  </div>
                </form>
              </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}