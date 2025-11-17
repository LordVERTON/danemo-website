"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter,
  User,
  Package,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Plus
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/use-current-user"

interface Order {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  value?: number
  container_code?: string | null
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  status: 'active' | 'inactive' | 'archived'
  orders: Order[]
  created_at: string
}

export default function ClientsPage() {
  const { user: currentUser } = useCurrentUser()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [error, setError] = useState("")
  const [containers, setContainers] = useState<Array<{ 
    id: string; 
    code: string; 
    status?: string | null;
    vessel?: string | null;
    departure_port?: string | null;
    arrival_port?: string | null;
    etd?: string | null;
    eta?: string | null;
  }>>([])
  const [isCreateContainerDialogOpen, setIsCreateContainerDialogOpen] = useState(false)
  const [newContainer, setNewContainer] = useState({
    code: "",
    vessel: "",
    departure_port: "",
    arrival_port: "",
    etd: "",
    eta: "",
    status: "planned" as const
  })
  
  // Formulaire de création de client
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
    tax_id: "",
    notes: "",
    status: "active" as const
  })
  
  // Formulaire de création de commande(s)
  const [newOrders, setNewOrders] = useState([{
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: "",
    container_id: "",
  }])

  useEffect(() => {
    fetchCustomers()
    fetchContainers()
  }, [])
  
  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers')
      const result = await response.json()
      if (result.success && result.data) {
        const containersList = result.data.map((container: any) => ({
          id: container.id,
          code: container.code,
          status: container.status ?? null,
          vessel: container.vessel ?? null,
          departure_port: container.departure_port ?? null,
          arrival_port: container.arrival_port ?? null,
          etd: container.etd ?? null,
          eta: container.eta ?? null,
        }))
        setContainers(containersList)
        console.log('Containers loaded:', containersList.length)
      } else {
        console.error('Failed to fetch containers:', result.error)
        setContainers([])
      }
    } catch (error) {
      console.error('Error fetching containers:', error)
      setContainers([])
    }
  }

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      const response = await fetch(`/api/customers?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setCustomers(result.data)
      } else {
        console.error('Error fetching customers:', result.error)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, filterStatus])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', variant: 'default' as const },
      inactive: { label: 'Inactif', variant: 'secondary' as const },
      archived: { label: 'Archivé', variant: 'outline' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'outline' as const },
      confirmed: { label: 'Confirmée', variant: 'default' as const },
      in_progress: { label: 'En cours', variant: 'default' as const },
      completed: { label: 'Terminée', variant: 'default' as const },
      cancelled: { label: 'Annulée', variant: 'secondary' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
  }

  const handleCustomerClick = (customerId: string) => {
    router.push(`/admin/clients/${customerId}`)
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      // Créer le client
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      })
      
      const customerResult = await customerResponse.json()
      
      if (!customerResult.success) {
        setError(customerResult.error || 'Erreur lors de la création du client')
        return
      }
      
      const createdCustomer = customerResult.data
      
      // Créer les commandes si elles sont renseignées
      const validOrders = newOrders.filter(order => 
        order.service_type && order.origin && order.destination
      )
      
      if (validOrders.length > 0) {
        for (const order of validOrders) {
          await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_name: newCustomer.name,
              client_email: newCustomer.email,
              client_phone: newCustomer.phone || null,
              service_type: order.service_type,
              origin: order.origin,
              destination: order.destination,
              weight: order.weight ? parseFloat(order.weight) : null,
              value: order.value ? parseFloat(order.value) : null,
              estimated_delivery: order.estimated_delivery || null,
              container_id: order.container_id || null,
              container_code: containers.find(c => c.id === order.container_id)?.code || null,
              customer_id: createdCustomer.id,
            }),
          })
        }
      }
      
      // Réinitialiser les formulaires
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        city: "",
        postal_code: "",
        country: "",
        tax_id: "",
        notes: "",
        status: "active"
      })
      setNewOrders([{
        service_type: "",
        origin: "",
        destination: "",
        weight: "",
        value: "",
        estimated_delivery: "",
        container_id: "",
      }])
      setIsCreateDialogOpen(false)
      fetchCustomers()
    } catch (error) {
      console.error('Error creating customer:', error)
      setError('Erreur de connexion')
    }
  }

  const addOrderForm = () => {
    setNewOrders([...newOrders, {
      service_type: "",
      origin: "",
      destination: "",
      weight: "",
      value: "",
      estimated_delivery: "",
      container_id: "",
    }])
  }

  const removeOrderForm = (index: number) => {
    setNewOrders(newOrders.filter((_, i) => i !== index))
  }

  const updateOrderForm = (index: number, field: string, value: string) => {
    const updated = [...newOrders]
    updated[index] = { ...updated[index], [field]: value }
    setNewOrders(updated)
  }

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!newContainer.code.trim()) {
        setError('Le code du conteneur est requis')
        return
      }

      const response = await fetch('/api/containers', {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newContainer.code.trim(),
          vessel: newContainer.vessel.trim() || null,
          departure_port: newContainer.departure_port.trim() || null,
          arrival_port: newContainer.arrival_port.trim() || null,
          etd: newContainer.etd || null,
          eta: newContainer.eta || null,
          status: newContainer.status,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchContainers()
        const createdContainer = result.data
        
        // Sélectionner automatiquement le nouveau conteneur dans le dernier formulaire de commande
        if (newOrders.length > 0) {
          const lastIndex = newOrders.length - 1
          updateOrderForm(lastIndex, 'container_id', createdContainer.id)
        }
        
        setNewContainer({
          code: "",
          vessel: "",
          departure_port: "",
          arrival_port: "",
          etd: "",
          eta: "",
          status: "planned"
        })
        setIsCreateContainerDialogOpen(false)
        setError("")
      } else {
        setError(result.error || 'Erreur lors de la création du conteneur')
      }
    } catch (error) {
      console.error('Error creating container:', error)
      setError('Erreur de connexion')
    }
  }

  const totalOrders = customers.reduce((sum, customer) => sum + (customer.orders?.length || 0), 0)
  const totalValue = customers.reduce((sum, customer) => {
    const customerValue = customer.orders?.reduce((orderSum, order) => orderSum + (order.value || 0), 0) || 0
    return sum + customerValue
  }, 0)

  return (
    <AdminLayout title="Gestion des clients">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos clients et leurs commandes
            </p>
          </div>
          <Button onClick={async () => {
            await fetchContainers()
            setIsCreateDialogOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un client
                </Button>
                  </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
                  </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, email, entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
          </div>
        </div>
          </CardContent>
        </Card>

        {/* Table des clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Clients ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun client trouvé</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const ordersCount = customer.orders?.length || 0
                    
                    return (
                      <TableRow 
                        key={customer.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleCustomerClick(customer.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              {customer.email && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.phone ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.company ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {customer.company}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {ordersCount}
                            </Badge>
                            {ordersCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {ordersCount === 1 ? 'commande' : 'commandes'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de création de client */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau client</DialogTitle>
              <DialogDescription>
                Créez un nouveau client et ajoutez une ou plusieurs commandes
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              {/* Informations du client */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations du client</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Nom *</Label>
                    <Input
                      id="customer_name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Téléphone</Label>
                    <Input
                      id="customer_phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_company">Entreprise</Label>
                    <Input
                      id="customer_company"
                      value={newCustomer.company}
                      onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_address">Adresse</Label>
                    <Input
                      id="customer_address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_city">Ville</Label>
                    <Input
                      id="customer_city"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_postal_code">Code postal</Label>
                    <Input
                      id="customer_postal_code"
                      value={newCustomer.postal_code}
                      onChange={(e) => setNewCustomer({ ...newCustomer, postal_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_country">Pays</Label>
                    <Input
                      id="customer_country"
                      value={newCustomer.country}
                      onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_tax_id">Numéro de TVA / SIRET</Label>
                    <Input
                      id="customer_tax_id"
                      value={newCustomer.tax_id}
                      onChange={(e) => setNewCustomer({ ...newCustomer, tax_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_status">Statut</Label>
                    <Select
                      value={newCustomer.status}
                      onValueChange={(value: any) => setNewCustomer({ ...newCustomer, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_notes">Notes</Label>
                  <Textarea
                    id="customer_notes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Commandes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Commandes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addOrderForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une commande
                  </Button>
                </div>
                {newOrders.map((order, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Commande {index + 1}</h4>
                      {newOrders.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderForm(index)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`order_service_${index}`}>Type de service</Label>
                        <Select
                          value={order.service_type}
                          onValueChange={(value) => updateOrderForm(index, 'service_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fret_maritime">Fret maritime</SelectItem>
                            <SelectItem value="fret_aerien">Fret aérien</SelectItem>
                            <SelectItem value="demenagement">Déménagement</SelectItem>
                            <SelectItem value="colis">Colis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`order_container_${index}`}>Conteneur</Label>
                        <Select
                          value={order.container_id || "none"}
                          onValueChange={(value) => updateOrderForm(index, 'container_id', value === "none" ? "" : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Aucun" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {containers.length === 0 ? (
                              <SelectItem value="no-containers" disabled>
                                Aucun conteneur disponible
                              </SelectItem>
                            ) : (
                              containers.map((container) => (
                                <SelectItem key={container.id} value={container.id}>
                                  {container.code} {container.status && `(${container.status.replace(/_/g, " ")})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => setIsCreateContainerDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un nouveau conteneur
                        </Button>
                        {order.container_id && (() => {
                          const selectedContainer = containers.find((container) => container.id === order.container_id)
                          return (
                            <div className="mt-2 p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {selectedContainer?.code || "N/A"}
                                </Badge>
                                {selectedContainer?.status && (
                                  <Badge variant="secondary" className="text-xs">
                                    {selectedContainer.status.replace(/_/g, " ")}
                                  </Badge>
                                )}
                              </div>
                              {selectedContainer && (
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  {selectedContainer.vessel && (
                                    <div>Navire: <span className="font-medium">{selectedContainer.vessel}</span></div>
                                  )}
                                  {selectedContainer.departure_port && (
                                    <div>Départ: <span className="font-medium">{selectedContainer.departure_port}</span></div>
                                  )}
                                  {selectedContainer.arrival_port && (
                                    <div>Arrivée: <span className="font-medium">{selectedContainer.arrival_port}</span></div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        {containers.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {containers.length} conteneur{containers.length > 1 ? 's' : ''} disponible{containers.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`order_origin_${index}`}>Origine</Label>
                        <Input
                          id={`order_origin_${index}`}
                          value={order.origin}
                          onChange={(e) => updateOrderForm(index, 'origin', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`order_destination_${index}`}>Destination</Label>
                        <Input
                          id={`order_destination_${index}`}
                          value={order.destination}
                          onChange={(e) => updateOrderForm(index, 'destination', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`order_weight_${index}`}>Poids (kg)</Label>
                        <Input
                          id={`order_weight_${index}`}
                          type="number"
                          step="0.01"
                          value={order.weight}
                          onChange={(e) => updateOrderForm(index, 'weight', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`order_value_${index}`}>Valeur (€)</Label>
                        <Input
                          id={`order_value_${index}`}
                          type="number"
                          step="0.01"
                          value={order.value}
                          onChange={(e) => updateOrderForm(index, 'value', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`order_delivery_${index}`}>Livraison estimée</Label>
                        <Input
                          id={`order_delivery_${index}`}
                          type="date"
                          value={order.estimated_delivery}
                          onChange={(e) => updateOrderForm(index, 'estimated_delivery', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Créer le client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de création de conteneur */}
        <Dialog open={isCreateContainerDialogOpen} onOpenChange={setIsCreateContainerDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau conteneur</DialogTitle>
              <DialogDescription>
                Créez un nouveau conteneur pour l'assigner à cette commande
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateContainer} className="space-y-4">
              <div>
                <Label htmlFor="container_code">Code du conteneur *</Label>
                <Input
                  id="container_code"
                  value={newContainer.code}
                  onChange={(e) => setNewContainer({ ...newContainer, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: MSKU1234567"
                  required
                  className="text-base sm:text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="container_vessel">Navire</Label>
                  <Input
                    id="container_vessel"
                    value={newContainer.vessel}
                    onChange={(e) => setNewContainer({ ...newContainer, vessel: e.target.value })}
                    placeholder="Ex: MSC OSCAR"
                    className="text-base sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="container_status">Statut</Label>
                  <Select
                    value={newContainer.status}
                    onValueChange={(value: any) => setNewContainer({ ...newContainer, status: value })}
                  >
                    <SelectTrigger className="text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planifié</SelectItem>
                      <SelectItem value="departed">Parti</SelectItem>
                      <SelectItem value="in_transit">En transit</SelectItem>
                      <SelectItem value="arrived">Arrivé</SelectItem>
                      <SelectItem value="delivered">Livré</SelectItem>
                      <SelectItem value="delayed">Retardé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="container_departure_port">Port de départ</Label>
                  <Input
                    id="container_departure_port"
                    value={newContainer.departure_port}
                    onChange={(e) => setNewContainer({ ...newContainer, departure_port: e.target.value })}
                    placeholder="Ex: Port d'Anvers, Belgique"
                    className="text-base sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="container_arrival_port">Port d'arrivée</Label>
                  <Input
                    id="container_arrival_port"
                    value={newContainer.arrival_port}
                    onChange={(e) => setNewContainer({ ...newContainer, arrival_port: e.target.value })}
                    placeholder="Ex: Port de Douala, Cameroun"
                    className="text-base sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="container_etd">Date de départ estimée (ETD)</Label>
                  <Input
                    id="container_etd"
                    type="datetime-local"
                    value={newContainer.etd}
                    onChange={(e) => setNewContainer({ ...newContainer, etd: e.target.value })}
                    className="text-base sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="container_eta">Date d'arrivée estimée (ETA)</Label>
                  <Input
                    id="container_eta"
                    type="datetime-local"
                    value={newContainer.eta}
                    onChange={(e) => setNewContainer({ ...newContainer, eta: e.target.value })}
                    className="text-base sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateContainerDialogOpen(false)
                    setError("")
                  }} 
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Créer le conteneur</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
    </AdminLayout>
  )
}
