"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  User,
  Plus,
  Edit,
  Loader2,
  QrCode,
  Download,
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
import { getTariffItemsForLang } from "@/lib/tariff-items"
import QRCode from "qrcode"

const TARIFF_DESCRIPTION_OPTIONS = getTariffItemsForLang("fr").map((item) => ({
  value: item.descriptionLabel,
  label: item.descriptionLabel,
  unitPriceEur: item.unitPriceEur,
}))
const CUSTOM_DESCRIPTION_VALUE = "__custom_description__"

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
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  tax_id?: string | null
  notes?: string | null
  opted_in_sms?: boolean
  opted_in_whatsapp?: boolean
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
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [publicFormUrl, setPublicFormUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editCustomer, setEditCustomer] = useState<{
    name: string
    email: string
    phone: string
    company: string
    address: string
    city: string
    postal_code: string
    country: string
    tax_id: string
    notes: string
    opted_in_sms: boolean
    opted_in_whatsapp: boolean
    status: 'active' | 'inactive' | 'archived'
  }>({
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
    opted_in_sms: false,
    opted_in_whatsapp: false,
    status: "active"
  })
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
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
    opted_in_sms: false,
    opted_in_whatsapp: false,
    status: "active" as const
  })
  
  // Formulaire de création de commande(s)
  const [newOrders, setNewOrders] = useState<Array<{
    service_type: string
    description: string
    origin: string
    destination: string
    weight: string
    value: string
    estimated_delivery: string
    container_id: string
  }>>([])

  useEffect(() => {
    fetchCustomers()
    fetchContainers()
  // Les données de référence sont chargées une seule fois à l'ouverture de l'écran.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      window.location.origin
    setPublicFormUrl(`${String(base).replace(/\/$/, "")}/new-client-form`)
  }, [])

  useEffect(() => {
    if (!isQrDialogOpen || !publicFormUrl) return
    let cancelled = false
    setQrDataUrl(null)
    QRCode.toDataURL(publicFormUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [isQrDialogOpen, publicFormUrl])
  
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
  // Le délai de recherche est volontairement réinitialisé uniquement lors d'un changement de filtre.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterStatus])

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

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator'

  const handleCustomerClick = (customerId: string) => {
    router.push(`/admin/clients/${customerId}`)
  }

  const handleOpenEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation()
    setEditingCustomerId(customer.id)
    setEditCustomer({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      city: customer.city || "",
      postal_code: customer.postal_code || "",
      country: customer.country || "",
      tax_id: customer.tax_id || "",
      notes: customer.notes || "",
      opted_in_sms: Boolean(customer.opted_in_sms),
      opted_in_whatsapp: Boolean(customer.opted_in_whatsapp),
      status: customer.status || "active"
    })
    setError("")
    setIsEditDialogOpen(true)
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomerId) return
    setError("")
    setIsSavingEdit(true)
    try {
      const response = await fetch(`/api/customers/${editingCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCustomer),
        credentials: 'include'
      })
      const result = await response.json()
      if (result.success) {
        setIsEditDialogOpen(false)
        setEditingCustomerId(null)
        fetchCustomers()
      } else {
        setError(result.error || 'Erreur lors de la modification')
      }
    } catch (err) {
      console.error('Error updating customer:', err)
      setError('Erreur de connexion')
    } finally {
      setIsSavingEdit(false)
    }
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
        order.service_type && order.description?.trim() && order.origin && order.destination
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
              description: order.description?.trim() || null,
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
        opted_in_sms: false,
        opted_in_whatsapp: false,
        status: "active"
      })
      setNewOrders([])
      setIsCreateDialogOpen(false)
      router.push(`/admin/clients/${createdCustomer.id}`)
    } catch (error) {
      console.error('Error creating customer:', error)
      setError('Erreur de connexion')
    }
  }

  const addOrderForm = () => {
    setNewOrders([...newOrders, {
      service_type: "",
      description: "",
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

  const updateOrderDescriptionFromTariff = (index: number, value: string) => {
    const updated = [...newOrders]
    if (value === CUSTOM_DESCRIPTION_VALUE) {
      updated[index] = { ...updated[index], description: "" }
    } else {
      const option = TARIFF_DESCRIPTION_OPTIONS.find((item) => item.value === value)
      updated[index] = {
        ...updated[index],
        description: value,
        value: option?.unitPriceEur != null ? String(option.unitPriceEur) : updated[index].value,
      }
    }
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

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Gérez vos clients et leurs commandes.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="w-full flex-1">
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
              <div className="flex items-center gap-2">
                <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full min-w-0 sm:w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsQrDialogOpen(true)}
                  aria-label="Afficher le QR code du formulaire client"
                  title="Afficher le QR code du formulaire client"
                >
                  <QrCode className="size-4" />
                </Button>
                <Button
                  className="hidden sm:inline-flex"
                  onClick={async () => {
                    await fetchContainers()
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Nouveau client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des clients */}
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
              <div className="divide-y overflow-hidden rounded-lg border">
                {customers.map((customer) => (
                  <article key={customer.id} className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-muted/50 sm:p-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleCustomerClick(customer.id)}
                      aria-label={`Ouvrir la fiche de ${customer.name}`}
                    >
                      <p className="truncate font-medium text-foreground">{customer.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{customer.email || "Aucune adresse e-mail renseignée"}</p>
                    </button>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={(event) => handleOpenEdit(event, customer)}
                      >
                        <Edit className="mr-2 size-4" />
                        Modifier
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="button"
          size="icon"
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 rounded-full shadow-lg sm:hidden"
          onClick={async () => {
            await fetchContainers()
            setIsCreateDialogOpen(true)
          }}
          aria-label="Créer un client"
        >
          <Plus className="size-6" />
        </Button>

        {/* Dialog de création de client */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau client</DialogTitle>
              <DialogDescription>
                Créez d’abord le client. Vous pourrez ajouter une commande ensuite, depuis sa fiche.
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
                      autoComplete="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      autoComplete="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Téléphone *</Label>
                    <Input
                      id="customer_phone"
                      type="tel"
                      autoComplete="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_company">Entreprise</Label>
                    <Input
                      id="customer_company"
                      autoComplete="organization"
                      value={newCustomer.company}
                      onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newCustomer.opted_in_sms}
                      onChange={(e) => setNewCustomer({ ...newCustomer, opted_in_sms: e.target.checked })}
                      className="h-4 w-4"
                    />
                    SMS newsletter
                  </label>
                  <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newCustomer.opted_in_whatsapp}
                      onChange={(e) => setNewCustomer({ ...newCustomer, opted_in_whatsapp: e.target.checked })}
                      className="h-4 w-4"
                    />
                    WhatsApp newsletter
                  </label>
                  <div>
                    <Label htmlFor="customer_address">Adresse *</Label>
                    <Input
                      id="customer_address"
                      autoComplete="street-address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_city">Ville *</Label>
                    <Input
                      id="customer_city"
                      autoComplete="address-level2"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_postal_code">Code postal *</Label>
                    <Input
                      id="customer_postal_code"
                      autoComplete="postal-code"
                      value={newCustomer.postal_code}
                      onChange={(e) => setNewCustomer({ ...newCustomer, postal_code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_country">Pays *</Label>
                    <Input
                      id="customer_country"
                      autoComplete="country-name"
                      value={newCustomer.country}
                      onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                      required
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Prochaine étape</h3>
                </div>
                {newOrders.length === 0 && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Enregistrez d’abord la fiche client. La création de commande se fera ensuite depuis cette fiche, avec les coordonnées déjà préremplies.</p>}
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
                            <SelectItem value="dedouanement">Dédouanement</SelectItem>
                            <SelectItem value="negoce">Négoce</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 space-y-3">
                        <div>
                          <Label htmlFor={`order_description_choice_${index}`}>Description du colis</Label>
                          <Select
                            value={
                              TARIFF_DESCRIPTION_OPTIONS.some((option) => option.value === order.description)
                                ? order.description
                                : CUSTOM_DESCRIPTION_VALUE
                            }
                            onValueChange={(value) => updateOrderDescriptionFromTariff(index, value)}
                          >
                            <SelectTrigger id={`order_description_choice_${index}`} className="h-auto min-h-10 whitespace-normal text-left [&_[data-slot=select-value]]:line-clamp-2 [&_[data-slot=select-value]]:whitespace-normal">
                              <SelectValue placeholder="Choisir dans la grille tarifaire" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {TARIFF_DESCRIPTION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                              <SelectItem value={CUSTOM_DESCRIPTION_VALUE}>Autre article / texte libre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`order_description_${index}`}>Texte de description</Label>
                          <Textarea
                            id={`order_description_${index}`}
                            value={order.description}
                            onChange={(e) => updateOrderForm(index, 'description', e.target.value)}
                            placeholder="Ex: Canapé 2 places"
                          />
                        </div>
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

        {/* Dialog de modification de client */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setError("")
        }}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le client</DialogTitle>
              <DialogDescription>
                Modifiez les informations du client
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleEditCustomer} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Nom *</Label>
                  <Input
                    id="edit_name"
                    autoComplete="name"
                    value={editCustomer.name}
                    onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    autoComplete="email"
                    value={editCustomer.email}
                    onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Téléphone *</Label>
                  <Input
                    id="edit_phone"
                    type="tel"
                    autoComplete="tel"
                    value={editCustomer.phone}
                    onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_company">Entreprise</Label>
                  <Input
                    id="edit_company"
                    autoComplete="organization"
                    value={editCustomer.company}
                    onChange={(e) => setEditCustomer({ ...editCustomer, company: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editCustomer.opted_in_sms}
                    onChange={(e) => setEditCustomer({ ...editCustomer, opted_in_sms: e.target.checked })}
                    className="h-4 w-4"
                  />
                  SMS newsletter
                </label>
                <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editCustomer.opted_in_whatsapp}
                    onChange={(e) => setEditCustomer({ ...editCustomer, opted_in_whatsapp: e.target.checked })}
                    className="h-4 w-4"
                  />
                  WhatsApp newsletter
                </label>
                <div>
                  <Label htmlFor="edit_address">Adresse *</Label>
                  <Input
                    id="edit_address"
                    autoComplete="street-address"
                    value={editCustomer.address}
                    onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_city">Ville *</Label>
                  <Input
                    id="edit_city"
                    autoComplete="address-level2"
                    value={editCustomer.city}
                    onChange={(e) => setEditCustomer({ ...editCustomer, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_postal_code">Code postal *</Label>
                  <Input
                    id="edit_postal_code"
                    autoComplete="postal-code"
                    value={editCustomer.postal_code}
                    onChange={(e) => setEditCustomer({ ...editCustomer, postal_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_country">Pays *</Label>
                  <Input
                    id="edit_country"
                    autoComplete="country-name"
                    value={editCustomer.country}
                    onChange={(e) => setEditCustomer({ ...editCustomer, country: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tax_id">Numéro de TVA / SIRET</Label>
                  <Input
                    id="edit_tax_id"
                    value={editCustomer.tax_id}
                    onChange={(e) => setEditCustomer({ ...editCustomer, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Statut</Label>
                  <Select
                    value={editCustomer.status}
                    onValueChange={(value: any) => setEditCustomer({ ...editCustomer, status: value })}
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
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editCustomer.notes}
                  onChange={(e) => setEditCustomer({ ...editCustomer, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSavingEdit}>
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
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
                Créez un nouveau conteneur pour l’assigner à cette commande
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
                    placeholder="Ex: Port d’Anvers, Belgique"
                    className="text-base sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="container_arrival_port">Port d’arrivée</Label>
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
                  <Label htmlFor="container_eta">Date d’arrivée estimée (ETA)</Label>
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

        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR code — formulaire client</DialogTitle>
              <DialogDescription className="text-center leading-relaxed px-1">
                Afin de simplifier votre expérience chez Danemo, vous pouvez dès à présent remplir le formulaire en
                scannant le QR code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-2">
              {qrDataUrl ? (
                // Data URL: next/image not applicable
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR code vers le formulaire client Danemo"
                  width={280}
                  height={280}
                  className="rounded-lg border bg-white p-2"
                />
              ) : (
                <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed text-center px-1">
                Ou en vous connectant sur ce lien depuis internet :
                <br />
                <span className="font-medium text-foreground break-all">{publicFormUrl}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!qrDataUrl}
                  onClick={() => {
                    if (!qrDataUrl) return
                    const a = document.createElement("a")
                    a.href = qrDataUrl
                    a.download = "danemo-formulaire-client-qr.png"
                    a.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PNG
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!qrDataUrl}
                  onClick={() => {
                    if (!qrDataUrl) return
                    const w = window.open("", "_blank")
                    if (!w) return
                    const intro =
                      "Afin de simplifier votre expérience chez Danemo, vous pouvez dès à présent remplir le formulaire en scannant le QR code."
                    const linkLine = "Ou en vous connectant sur ce lien depuis internet :"
                    const urlSafe = publicFormUrl
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/"/g, "&quot;")
                    w.document.write(
                      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>QR Danemo — formulaire client</title>
<style>@media print{body{padding:16px}}</style></head>
<body style="margin:0;text-align:center;font-family:system-ui,-apple-system,sans-serif;padding:28px 20px;color:#111827">
<p style="font-size:15px;line-height:1.55;max-width:34rem;margin:0 auto 22px;font-weight:500">${intro}</p>
<img src="${qrDataUrl}" width="280" height="280" alt="QR code formulaire client Danemo" style="display:block;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px"/>
<p style="font-size:15px;line-height:1.55;max-width:34rem;margin:18px auto 0;font-weight:500">${linkLine}<br/><span style="word-break:break-all;font-weight:600;color:#111827">${urlSafe}</span></p>
</body></html>`,
                    )
                    w.document.close()
                    w.focus()
                    w.print()
                  }}
                >
                  Imprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
