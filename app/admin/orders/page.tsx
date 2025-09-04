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
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

interface Order {
  id: string
  order_number: string
  client_name: string
  client_email: string
  client_phone?: string
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Formulaire de création
  const [newOrder, setNewOrder] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: ""
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
        console.error('Error fetching orders:', result.error)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const orderData = {
        ...newOrder,
        weight: newOrder.weight ? parseFloat(newOrder.weight) : null,
        value: newOrder.value ? parseFloat(newOrder.value) : null,
        estimated_delivery: newOrder.estimated_delivery || null
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      
      if (result.success) {
        setNewOrder({
          client_name: "",
          client_email: "",
          client_phone: "",
          service_type: "",
          origin: "",
          destination: "",
          weight: "",
          value: "",
          estimated_delivery: ""
        })
        setIsCreateDialogOpen(false)
        fetchOrders()
      } else {
        console.error('Error creating order:', result.error)
      }
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()
      
      if (result.success) {
        fetchOrders()
      } else {
        console.error('Error updating order:', result.error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: "Confirmée", variant: "secondary" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: "En cours", variant: "default" as const, icon: Truck, color: "text-orange-600" },
      completed: { label: "Terminée", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { label: "Annulée", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
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
            <h1 className="text-3xl font-bold">Gestion des commandes</h1>
            <p className="text-muted-foreground">
              Gérez toutes les commandes et suivez leur statut
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle commande
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle commande</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour créer une nouvelle commande
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Nom du client *</Label>
                    <Input
                      id="client_name"
                      value={newOrder.client_name}
                      onChange={(e) => setNewOrder({...newOrder, client_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Email *</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={newOrder.client_email}
                      onChange={(e) => setNewOrder({...newOrder, client_email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_phone">Téléphone</Label>
                    <Input
                      id="client_phone"
                      value={newOrder.client_phone}
                      onChange={(e) => setNewOrder({...newOrder, client_phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_type">Type de service *</Label>
                    <Select value={newOrder.service_type} onValueChange={(value) => setNewOrder({...newOrder, service_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fret_maritime">Fret maritime</SelectItem>
                        <SelectItem value="fret_aerien">Fret aérien</SelectItem>
                        <SelectItem value="demenagement">Déménagement</SelectItem>
                        <SelectItem value="dedouanement">Dédouanement</SelectItem>
                        <SelectItem value="negoce">Négoce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">Origine *</Label>
                    <Input
                      id="origin"
                      value={newOrder.origin}
                      onChange={(e) => setNewOrder({...newOrder, origin: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      value={newOrder.destination}
                      onChange={(e) => setNewOrder({...newOrder, destination: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={newOrder.weight}
                      onChange={(e) => setNewOrder({...newOrder, weight: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Valeur (€)</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={newOrder.value}
                      onChange={(e) => setNewOrder({...newOrder, value: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_delivery">Livraison estimée</Label>
                    <Input
                      id="estimated_delivery"
                      type="date"
                      value={newOrder.estimated_delivery}
                      onChange={(e) => setNewOrder({...newOrder, estimated_delivery: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer la commande</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
                <Filter className="h-4 w-4 text-muted-foreground" />
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
              <Package className="h-5 w-5" />
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
                  <TableHead>Valeur</TableHead>
                  <TableHead>Date</TableHead>
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
                    <TableCell>{getServiceTypeLabel(order.service_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.origin}</div>
                        <div className="text-muted-foreground">→ {order.destination}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.value ? `€${order.value.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de visualisation */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Numéro de commande</Label>
                    <p className="font-mono">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p>{selectedOrder.client_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.client_email}</p>
                    {selectedOrder.client_phone && (
                      <p className="text-sm text-muted-foreground">{selectedOrder.client_phone}</p>
                    )}
                  </div>
                  <div>
                    <Label>Service</Label>
                    <p>{getServiceTypeLabel(selectedOrder.service_type)}</p>
                  </div>
                </div>
                <div>
                  <Label>Trajet</Label>
                  <p>{selectedOrder.origin} → {selectedOrder.destination}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Poids</Label>
                    <p>{selectedOrder.weight ? `${selectedOrder.weight} kg` : '-'}</p>
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <p>{selectedOrder.value ? `€${selectedOrder.value.toLocaleString()}` : '-'}</p>
                  </div>
                  <div>
                    <Label>Livraison estimée</Label>
                    <p>{selectedOrder.estimated_delivery ? new Date(selectedOrder.estimated_delivery).toLocaleDateString('fr-FR') : '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de création</Label>
                    <p>{new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <Label>Dernière mise à jour</Label>
                    <p>{new Date(selectedOrder.updated_at).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
