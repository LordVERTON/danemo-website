"use client"

import { useState, useEffect, useRef } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, MapPin, Clock, Truck, Package, Ship, CheckCircle, AlertCircle, Plus, Eye, ExternalLink, PackageSearch, QrCode } from "lucide-react"
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

interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
}

const emptyOrderForm = {
  service_type: "fret_maritime",
  container_id: "",
  description: "",
  origin: "",
  destination: "",
  weight: "",
  value: "",
  estimated_delivery: "",
  recipient_name: "",
  recipient_email: "",
  recipient_phone: "",
  recipient_address: "",
  recipient_city: "",
  recipient_postal_code: "",
  recipient_country: "",
}

const emptyCustomerForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postal_code: "",
  country: "",
}

export default function TrackingPage() {
  const { user: currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterContainer, setFilterContainer] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingTrackingEvents, setIsLoadingTrackingEvents] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [containers, setContainers] = useState<Array<{ id: string; code: string; status?: string | null }>>([])
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [isCustomerSuggestionsOpen, setIsCustomerSuggestionsOpen] = useState(false)
  const [createOrder, setCreateOrder] = useState(emptyOrderForm)
  const [createCustomer, setCreateCustomer] = useState(emptyCustomerForm)
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

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)
      const response = await fetch('/api/customers')
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setCustomers(result.data)
      } else {
        setErrorMessage('Impossible de charger la liste des clients')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setErrorMessage('Erreur de connexion lors du chargement des clients')
    } finally {
      setCustomersLoading(false)
    }
  }

  const openCreateOrder = () => {
    setErrorMessage("")
    setCustomerId("")
    setCustomerSearch("")
    setIsCustomerSuggestionsOpen(false)
    setCreateCustomer(emptyCustomerForm)
    setCreateOrder(emptyOrderForm)
    setIsCreateOrderOpen(true)
    void fetchCustomers()
  }

  const handleCreateOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerId) {
      setErrorMessage('Recherchez et sélectionnez un client, ou créez-en un nouveau.')
      return
    }
    setIsCreatingOrder(true)
    setErrorMessage("")

    try {
      let customer: Customer | undefined

      if (customerId === "new") {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createCustomer),
        })
        const customerResult = await customerResponse.json()

        if (!customerResponse.ok || !customerResult.success) {
          setErrorMessage(customerResult.error || 'Impossible de créer le client')
          return
        }

        customer = customerResult.data as Customer
      } else {
        customer = customers.find((item) => item.id === customerId)
        if (!customer) {
          setErrorMessage('Le client sélectionné est introuvable. Réessayez.')
          return
        }
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createOrder,
          container_id: createOrder.service_type === 'fret_maritime' && createOrder.container_id ? createOrder.container_id : null,
          customer_id: customer.id,
          client_name: customer.name,
          client_email: customer.email || '',
          client_phone: customer.phone || '',
          client_address: customer.address || '',
          client_city: customer.city || '',
          client_postal_code: customer.postal_code || '',
          client_country: customer.country || '',
          weight: createOrder.weight || null,
          value: createOrder.value || null,
          estimated_delivery: createOrder.estimated_delivery || null,
        }),
      })
      const orderResult = await orderResponse.json()

      if (!orderResponse.ok || !orderResult.success) {
        setErrorMessage(orderResult.error || 'Impossible de créer la commande')
        return
      }

      setOrders((current) => [orderResult.data as Order, ...current])
      setSuccessMessage('Commande créée avec succès')
      setIsCreateOrderOpen(false)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error('Error creating order:', error)
      setErrorMessage('Erreur de connexion lors de la création de la commande')
    } finally {
      setIsCreatingOrder(false)
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
      planned: { label: "Conteneur planifié", variant: "outline" as const, icon: Clock, color: "text-slate-600" },
      departed: { label: "Conteneur parti", variant: "secondary" as const, icon: Truck, color: "text-blue-600" },
      in_transit: { label: "Conteneur en transit", variant: "default" as const, icon: Truck, color: "text-orange-600" },
      arrived: { label: "Conteneur arrivé", variant: "secondary" as const, icon: CheckCircle, color: "text-green-600" },
      delivered: { label: "Conteneur livré", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      delayed: { label: "Conteneur retardé", variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
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

  const customerSuggestions = customers
    .filter((customer) => {
      const query = customerSearch.trim().toLowerCase()
      if (!query) return false
      return [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
    .slice(0, 8)

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
        <p className="text-muted-foreground">Suivez les expéditions et mettez à jour les statuts.</p>
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
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="size-4 shrink-0" />
              <span>Cliquez sur une ligne pour voir le suivi de la commande.</span>
            </div>
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
                <Button type="button" className="hidden sm:inline-flex" onClick={openCreateOrder}>
                  <Plus className="mr-2 size-4" />
                  Nouvelle commande
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Commandes ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Aucune commande ne correspond aux filtres.</div>
            ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {filteredOrders.map((order) => {
                return (
                  <article key={order.id} className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-muted/50 sm:p-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleRowClick(order)}
                      aria-label={`Ouvrir le suivi de la commande ${order.order_number}`}
                    >
                      <p className="truncate font-mono font-medium text-foreground">{order.order_number}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {order.client_name} · {order.origin} → {order.destination}
                      </p>
                    </button>
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => handleRowClick(order)}>
                      <MapPin className="mr-2 size-4" />
                      Suivi
                    </Button>
                  </article>
                )
              })}
            </div>
            )}
            <div className="hidden">
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
                      className="cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.01] hover:bg-gray-50 hover:shadow-sm group"
                      onClick={() => handleRowClick(order)}
                    >
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          {order.order_number}
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
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
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedOrder(order)
                                fetchTrackingEvents(order.id)
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                              Ouvrir le suivi
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

        <Button
          type="button"
          size="icon"
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 rounded-full shadow-lg sm:hidden"
          onClick={openCreateOrder}
          aria-label="Créer une commande"
        >
          <Plus className="size-6" />
        </Button>

        <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Nouvelle commande</DialogTitle>
              <DialogDescription>Choisissez un client existant ou créez sa fiche avant d&apos;enregistrer la commande.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="max-h-[calc(100vh-10rem)] space-y-5 overflow-y-auto px-1 pb-1">
              <section className="space-y-3 rounded-xl border p-4">
                {customerId === "new" ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">Nouveau client</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setCustomerId(""); setCustomerSearch("") }}>Rechercher un client</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label htmlFor="new-customer-name">Nom complet</Label><Input id="new-customer-name" required autoComplete="name" value={createCustomer.name} onChange={(e) => setCreateCustomer({ ...createCustomer, name: e.target.value })} /></div>
                      <div><Label htmlFor="new-customer-email">E-mail</Label><Input id="new-customer-email" type="email" autoComplete="email" value={createCustomer.email} onChange={(e) => setCreateCustomer({ ...createCustomer, email: e.target.value })} /></div>
                      <div><Label htmlFor="new-customer-phone">Téléphone</Label><Input id="new-customer-phone" required type="tel" autoComplete="tel" value={createCustomer.phone} onChange={(e) => setCreateCustomer({ ...createCustomer, phone: e.target.value })} /></div>
                      <div><Label htmlFor="new-customer-address">Adresse</Label><Input id="new-customer-address" required autoComplete="street-address" value={createCustomer.address} onChange={(e) => setCreateCustomer({ ...createCustomer, address: e.target.value })} /></div>
                      <div><Label htmlFor="new-customer-city">Ville</Label><Input id="new-customer-city" required autoComplete="address-level2" value={createCustomer.city} onChange={(e) => setCreateCustomer({ ...createCustomer, city: e.target.value })} /></div>
                      <div><Label htmlFor="new-customer-postal">Code postal</Label><Input id="new-customer-postal" required autoComplete="postal-code" value={createCustomer.postal_code} onChange={(e) => setCreateCustomer({ ...createCustomer, postal_code: e.target.value })} /></div>
                      <div className="sm:col-span-2"><Label htmlFor="new-customer-country">Pays</Label><Input id="new-customer-country" required autoComplete="country-name" value={createCustomer.country} onChange={(e) => setCreateCustomer({ ...createCustomer, country: e.target.value })} /></div>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <Label htmlFor="tracking-customer">Client</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="tracking-customer"
                        type="search"
                        autoComplete="off"
                        disabled={customersLoading || isCreatingOrder}
                        placeholder={customersLoading ? "Chargement des clients…" : "Rechercher un client par nom, e-mail ou téléphone"}
                        className="pl-9"
                        value={customerSearch}
                        onFocus={() => setIsCustomerSuggestionsOpen(true)}
                        onChange={(event) => {
                          setCustomerSearch(event.target.value)
                          setCustomerId("")
                          setIsCustomerSuggestionsOpen(true)
                        }}
                      />
                    </div>
                    {isCustomerSuggestionsOpen && customerSearch.trim() && (
                      <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                        {customerSuggestions.length ? customerSuggestions.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setCustomerId(customer.id)
                              setCustomerSearch(customer.name)
                              setIsCustomerSuggestionsOpen(false)
                            }}
                          >
                            <span className="block font-medium">{customer.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{customer.email || customer.phone || "Coordonnées non renseignées"}</span>
                          </button>
                        )) : (
                          <p className="px-3 py-2 text-sm text-muted-foreground">Aucun client trouvé.</p>
                        )}
                      </div>
                    )}
                    {customerId ? (
                      <p className="mt-2 text-sm text-muted-foreground">Les coordonnées du client sélectionné seront utilisées comme expéditeur.</p>
                    ) : (
                      <Button type="button" variant="link" className="mt-1 h-auto px-0" onClick={() => { setCustomerId("new"); setIsCustomerSuggestionsOpen(false) }}>
                        Créer un nouveau client
                      </Button>
                    )}
                  </div>
                )}
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="new-order-service">Service</Label><Select value={createOrder.service_type} onValueChange={(value) => setCreateOrder({ ...createOrder, service_type: value, container_id: value === "fret_maritime" ? createOrder.container_id : "" })}><SelectTrigger id="new-order-service" className="mt-1 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fret_maritime">Fret maritime</SelectItem><SelectItem value="fret_aerien">Fret aérien</SelectItem><SelectItem value="demenagement">Déménagement</SelectItem><SelectItem value="dedouanement">Dédouanement</SelectItem><SelectItem value="negoce">Négoce</SelectItem><SelectItem value="colis">Colis</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="new-order-delivery">Livraison estimée</Label><Input id="new-order-delivery" className="mt-1" type="date" value={createOrder.estimated_delivery} onChange={(e) => setCreateOrder({ ...createOrder, estimated_delivery: e.target.value })} /></div>
                {createOrder.service_type === "fret_maritime" && <div className="min-w-0 sm:col-span-2"><Label htmlFor="new-order-container">Conteneur associé</Label><Select value={createOrder.container_id || "unassigned"} onValueChange={(value) => setCreateOrder({ ...createOrder, container_id: value === "unassigned" ? "" : value })}><SelectTrigger id="new-order-container" className="mt-1 w-full min-w-0"><SelectValue placeholder="Aucun conteneur" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Aucun conteneur pour le moment</SelectItem>{containers.map((container) => <SelectItem key={container.id} value={container.id}>{container.code}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-muted-foreground">Seuls les conteneurs existants peuvent être associés.</p></div>}
                <div><Label htmlFor="new-order-origin">Origine</Label><Input id="new-order-origin" required autoComplete="address-level2" className="mt-1" value={createOrder.origin} onChange={(e) => setCreateOrder({ ...createOrder, origin: e.target.value })} /></div>
                <div><Label htmlFor="new-order-destination">Destination</Label><Input id="new-order-destination" required autoComplete="address-level2" className="mt-1" value={createOrder.destination} onChange={(e) => setCreateOrder({ ...createOrder, destination: e.target.value })} /></div>
                <div><Label htmlFor="new-order-weight">Poids (kg)</Label><Input id="new-order-weight" type="number" min="0" step="0.01" inputMode="decimal" className="mt-1" value={createOrder.weight} onChange={(e) => setCreateOrder({ ...createOrder, weight: e.target.value })} /></div>
                <div><Label htmlFor="new-order-value">Valeur (€)</Label><Input id="new-order-value" type="number" min="0" step="0.01" inputMode="decimal" className="mt-1" value={createOrder.value} onChange={(e) => setCreateOrder({ ...createOrder, value: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label htmlFor="new-order-description">Description</Label><Textarea id="new-order-description" className="mt-1" rows={2} value={createOrder.description} onChange={(e) => setCreateOrder({ ...createOrder, description: e.target.value })} /></div>
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <h3 className="font-medium">Destinataire</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label htmlFor="recipient-name">Nom complet</Label><Input id="recipient-name" required autoComplete="name" value={createOrder.recipient_name} onChange={(e) => setCreateOrder({ ...createOrder, recipient_name: e.target.value })} /></div>
                  <div><Label htmlFor="recipient-email">E-mail</Label><Input id="recipient-email" type="email" autoComplete="email" value={createOrder.recipient_email} onChange={(e) => setCreateOrder({ ...createOrder, recipient_email: e.target.value })} /></div>
                  <div><Label htmlFor="recipient-phone">Téléphone</Label><Input id="recipient-phone" required type="tel" autoComplete="tel" value={createOrder.recipient_phone} onChange={(e) => setCreateOrder({ ...createOrder, recipient_phone: e.target.value })} /></div>
                  <div><Label htmlFor="recipient-address">Adresse</Label><Input id="recipient-address" required autoComplete="street-address" value={createOrder.recipient_address} onChange={(e) => setCreateOrder({ ...createOrder, recipient_address: e.target.value })} /></div>
                  <div><Label htmlFor="recipient-city">Ville</Label><Input id="recipient-city" required autoComplete="address-level2" value={createOrder.recipient_city} onChange={(e) => setCreateOrder({ ...createOrder, recipient_city: e.target.value })} /></div>
                  <div><Label htmlFor="recipient-postal">Code postal</Label><Input id="recipient-postal" required autoComplete="postal-code" value={createOrder.recipient_postal_code} onChange={(e) => setCreateOrder({ ...createOrder, recipient_postal_code: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label htmlFor="recipient-country">Pays</Label><Input id="recipient-country" required autoComplete="country-name" value={createOrder.recipient_country} onChange={(e) => setCreateOrder({ ...createOrder, recipient_country: e.target.value })} /></div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" disabled={isCreatingOrder} onClick={() => setIsCreateOrderOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={isCreatingOrder}>{isCreatingOrder ? "Création…" : "Créer la commande"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
