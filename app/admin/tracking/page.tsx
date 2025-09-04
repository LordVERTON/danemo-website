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
import { Search, MapPin, Clock, Truck, Package, Ship, CheckCircle, AlertCircle, Plus } from "lucide-react"

interface Order {
  id: string
  order_number: string
  client_name: string
  client_email: string
  service_type: string
  origin: string
  destination: string
  weight?: number
  value?: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  estimated_delivery?: string
  created_at: string
  updated_at: string
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
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Formulaire pour ajouter un événement
  const [newEvent, setNewEvent] = useState({
    status: "",
    location: "",
    description: "",
    operator: ""
  })

  useEffect(() => {
    fetchOrders()
  }, [])

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
      const response = await fetch(`/api/orders/${orderId}/tracking`)
      const result = await response.json()
      
      if (result.success) {
        setTrackingEvents(result.data)
      }
    } catch (error) {
      console.error('Error fetching tracking events:', error)
    }
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
        setNewEvent({ status: "", location: "", description: "", operator: "" })
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
    const config = statusConfig[status as keyof typeof statusConfig]
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
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <AdminLayout>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suivi des colis</h1>
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
                  <TableHead>Statut</TableHead>
                  <TableHead>Livraison estimée</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
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
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('fr-FR') : '-'}
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
                          </DialogHeader>
                          
                          <div className="space-y-6">
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
                                  <p className="text-muted-foreground text-center py-4">
                                    Aucun événement de suivi pour cette commande
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Formulaire d'ajout d'événement */}
                            <div className="border-t pt-6">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Ajouter un événement
                              </h3>
                              <form onSubmit={handleAddEvent} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="status">Statut *</Label>
                                    <Select value={newEvent.status} onValueChange={(value) => setNewEvent({...newEvent, status: value})}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un statut" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="preparation">Préparation</SelectItem>
                                        <SelectItem value="confirmed">Confirmée</SelectItem>
                                        <SelectItem value="in_progress">En cours</SelectItem>
                                        <SelectItem value="arrive_port">Arrivé au port</SelectItem>
                                        <SelectItem value="dedouane">Dédouanement</SelectItem>
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
                                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                      placeholder="Ex: Port d'Anvers, Belgique"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="description">Description *</Label>
                                  <Textarea
                                    id="description"
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                    placeholder="Décrivez l'événement..."
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="operator">Opérateur</Label>
                                  <Input
                                    id="operator"
                                    value={newEvent.operator}
                                    onChange={(e) => setNewEvent({...newEvent, operator: e.target.value})}
                                    placeholder="Nom de l'opérateur"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button type="submit" disabled={isUpdating || !newEvent.status || !newEvent.description}>
                                    {isUpdating ? 'Ajout en cours...' : 'Ajouter l\'événement'}
                                  </Button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}