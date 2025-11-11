"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
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
  FileText,
  FileDown,
  FileSpreadsheet,
  User,
  Mail,
  Phone,
  Building2,
  Plus,
  QrCode,
  Copy,
  ExternalLink
} from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"
import { generateInvoice, defaultCompanyData, InvoiceData } from "@/lib/invoice-utils"
import { generateProformaDocx, generateProformaPdf } from "@/lib/proforma-utils"
import { generateQRPrintPDF } from "@/lib/qr-print-utils"
import QRCode from "qrcode"

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
  container_id?: string | null
  container_code?: string | null
  container_status?: string | null
  qr_code?: string | null
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  company?: string | null
  tax_id?: string | null
  status: 'active' | 'inactive' | 'archived'
  orders: Order[]
  invoices?: any[]
  created_at: string
  qr_code?: string | null
}

// Composant pour afficher le QR code
function QRCodeDisplay({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      // Générer une URL complète pour le QR code
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const qrUrl = `${baseUrl}/qr?code=${encodeURIComponent(value)}`
      
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (err) => {
        if (err) {
          console.error('Error generating QR code:', err)
          setError('Erreur lors de la génération du QR code')
        }
      })
    }
  }, [value])

  if (error) {
    return (
      <div className="w-[200px] h-[200px] flex items-center justify-center border rounded bg-gray-100 text-xs text-gray-500">
        {error}
      </div>
    )
  }

  return <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
}

export default function ClientDetailPage() {
  const { user: currentUser } = useCurrentUser()
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
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
  
  // Formulaire de création de commande
  const [newOrder, setNewOrder] = useState({
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: "",
    container_id: "",
  })

  // Formulaire de modification
  const [editOrder, setEditOrder] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_type: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    estimated_delivery: "",
    status: "",
    container_id: "",
    container_code: ""
  })

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
      fetchContainers()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${customerId}`)
      const result = await response.json()
      
      if (result.success) {
        setCustomer(result.data)
        setOrders(result.data.orders || [])
      } else {
        setError(result.error || 'Erreur lors du chargement du client')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

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
        
        // Sélectionner automatiquement le nouveau conteneur dans le formulaire actif
        if (isCreateOrderDialogOpen) {
          setNewOrder({
            ...newOrder,
            container_id: createdContainer.id,
          })
        } else if (isEditDialogOpen) {
          setEditOrder({
            ...editOrder,
            container_id: createdContainer.id,
            container_code: createdContainer.code,
          })
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

  const handleEditOrder = async (order: Order) => {
    // Recharger les conteneurs pour s'assurer d'avoir les données à jour
    await fetchContainers()
    
    setSelectedOrder(order)
    setEditOrder({
      client_name: order.client_name,
      client_email: order.client_email,
      client_phone: order.client_phone || "",
      service_type: order.service_type,
      origin: order.origin,
      destination: order.destination,
      weight: order.weight ? String(order.weight) : "",
      value: order.value ? String(order.value) : "",
      estimated_delivery: order.estimated_delivery || "",
      status: order.status,
      container_id: order.container_id || "",
      container_code: order.container_code || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const selectedContainer = containers.find((container) => container.id === editOrder.container_id)
      const orderData = {
        ...editOrder,
        weight: editOrder.weight ? parseFloat(editOrder.weight) : null,
        value: editOrder.value ? parseFloat(editOrder.value) : null,
        estimated_delivery: editOrder.estimated_delivery || null,
        container_id: editOrder.container_id || null,
        container_code: editOrder.container_code || selectedContainer?.code || null,
      }

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        // Mettre à jour selectedOrder avec les nouvelles données (y compris le QR code)
        if (result.data) {
          setSelectedOrder(result.data as Order)
        }
        setIsEditDialogOpen(false)
        // Recharger les données du client pour avoir les conteneurs à jour
        await fetchCustomer()
        // Réinitialiser selectedOrder après un court délai pour permettre la fermeture de la modal
        setTimeout(() => {
          setSelectedOrder(null)
        }, 100)
      } else {
        setError(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setError('Erreur de connexion')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchCustomer()
      } else {
        setError(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('Erreur de connexion')
    }
  }

  const handleCreateOrder = async (e: React.FormEvent, printQR: boolean = false) => {
    e.preventDefault()
    if (!customer) return
    setError("")
    
    try {
      // Étape 1: Créer la commande dans la base de données
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: customer.name,
          client_email: customer.email,
          client_phone: customer.phone || null,
          service_type: newOrder.service_type,
          origin: newOrder.origin,
          destination: newOrder.destination,
          weight: newOrder.weight ? parseFloat(newOrder.weight) : null,
          value: newOrder.value ? parseFloat(newOrder.value) : null,
          estimated_delivery: newOrder.estimated_delivery || null,
          container_id: newOrder.container_id || null,
          container_code: containers.find(c => c.id === newOrder.container_id)?.code || null,
          customer_id: customer.id,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Erreur lors de la création de la commande')
        return
      }

      // La commande a été créée avec succès
      const createdOrder = result.data
      
      // Étape 2: Réinitialiser le formulaire et fermer la modal
      setNewOrder({
        service_type: "",
        origin: "",
        destination: "",
        weight: "",
        value: "",
        estimated_delivery: "",
        container_id: "",
      })
      setIsCreateOrderDialogOpen(false)
      
      // Étape 3: Rafraîchir les données du client pour afficher la nouvelle commande
      await fetchCustomer()
      
      // Étape 4: Générer et imprimer le QR code si demandé (après le rafraîchissement)
      if (printQR && createdOrder?.qr_code) {
        try {
          await generateQRPrintPDF({
            qrCode: createdOrder.qr_code,
            orderNumber: createdOrder.order_number,
            clientName: createdOrder.client_name,
            serviceType: createdOrder.service_type,
            origin: createdOrder.origin,
            destination: createdOrder.destination
          })
        } catch (error) {
          console.error('Erreur lors de la génération du QR code:', error)
          // Ne pas bloquer - la commande est déjà créée et affichée
          setError('Commande créée avec succès, mais erreur lors de l\'impression du QR code')
        }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setError('Erreur de connexion lors de la création de la commande')
    }
  }

  const handleGenerateInvoice = async (order: Order) => {
    try {
      const invoiceData: InvoiceData = {
        order: order,
        company: defaultCompanyData
      }
      await generateInvoice(invoiceData)
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error)
      setError('Erreur lors de la génération de la facture')
    }
  }

  const handleGenerateProformaPdf = async (order: Order) => {
    try {
      await generateProformaPdf({
        order,
        company: defaultCompanyData,
      })
    } catch (error) {
      console.error('Erreur lors de la génération de la proforma PDF:', error)
      setError('Erreur lors de la génération de la proforma PDF')
    }
  }

  const handleGenerateProformaDocx = async (order: Order) => {
    try {
      const blob = await generateProformaDocx({
        order,
        company: defaultCompanyData,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `proforma-${order.order_number}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de la génération de la proforma DOCX:', error)
      setError('Erreur lors de la génération de la proforma DOCX')
    }
  }

  const handleGenerateQRCode = async () => {
    if (!selectedOrder) return

    try {
      setIsGeneratingQR(true)
      setError("")

      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate-qr' }),
      })

      const result = await response.json()
      
      if (result.success) {
        // Mettre à jour la commande sélectionnée avec le nouveau QR code
        if (result.data?.order) {
          setSelectedOrder(result.data.order as Order)
        } else if (result.data?.qr_code && selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            qr_code: result.data.qr_code
          } as Order)
        }
        
        // Rafraîchir les données du client pour mettre à jour la liste
        await fetchCustomer()
      } else {
        setError(result.error || 'Erreur lors de la génération du QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Erreur de connexion')
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
      order.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <AdminLayout title="Détails du client">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout title="Détails du client">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Client introuvable</p>
          <Button onClick={() => router.push('/admin/clients')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const totalValue = orders.reduce((sum, order) => sum + (order.value || 0), 0)

  return (
    <AdminLayout title={`Détails du client - ${customer.name}`}>
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/clients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground mt-1">
              Détails du client et gestion des commandes
            </p>
          </div>
        </div>

        {/* Informations du client */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Nom</div>
                  <div className="font-medium">{customer.name}</div>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{customer.email}</div>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Téléphone</div>
                    <div className="font-medium">{customer.phone}</div>
                  </div>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Entreprise</div>
                    <div className="font-medium">{customer.company}</div>
                  </div>
                </div>
              )}
              {customer.address && (
                <div>
                  <div className="text-sm text-muted-foreground">Adresse</div>
                  <div className="font-medium">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.postal_code && ` ${customer.postal_code}`}
                    {customer.country && `, ${customer.country}`}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalValue.toLocaleString()}</div>
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
                    placeholder="Rechercher par numéro, origine, destination..."
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commandes ({filteredOrders.length})
              </CardTitle>
              <Button onClick={async () => {
                await fetchContainers()
                setIsCreateOrderDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une commande
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Conteneur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleEditOrder(order)}
                  >
                    <TableCell className="font-mono font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{getServiceTypeLabel(order.service_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.origin}</div>
                        <div className="text-muted-foreground">→ {order.destination}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.container_code ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {order.container_code}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateProformaPdf(order)
                              }}
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              Proforma PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGenerateProformaDocx(order)
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Proforma DOCX
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateInvoice(order)
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteOrder(order.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog d'édition de commande */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la commande</DialogTitle>
              <DialogDescription>
                Modifiez les informations de la commande {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Section QR Code */}
            {selectedOrder?.qr_code ? (
              <div className="border rounded-lg p-4 bg-muted/30 mb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-orange-600" />
                  QR Code de la commande
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                      <QRCodeDisplay value={selectedOrder.qr_code} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                      Scannez ce QR code pour accéder aux informations de la commande
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2 bg-white rounded border">
                      <code className="text-xs font-mono break-all">{selectedOrder.qr_code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedOrder?.qr_code) {
                            navigator.clipboard.writeText(selectedOrder.qr_code)
                            // Message de succès temporaire (on pourrait utiliser un toast)
                            const successMsg = 'QR code copié dans le presse-papier'
                            setError('')
                            // Simuler un message de succès en vidant l'erreur
                            setTimeout(() => {
                              // Le message sera géré par un système de notification si disponible
                            }, 100)
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/qr?code=${encodeURIComponent(selectedOrder.qr_code || '')}`, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir la page de suivi QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (selectedOrder?.qr_code) {
                          try {
                            await generateQRPrintPDF({
                              qrCode: selectedOrder.qr_code,
                              orderNumber: selectedOrder.order_number,
                              clientName: selectedOrder.client_name,
                              serviceType: selectedOrder.service_type,
                              origin: selectedOrder.origin,
                              destination: selectedOrder.destination
                            })
                          } catch (error) {
                            console.error('Erreur lors de l\'impression:', error)
                            setError('Erreur lors de l\'impression du QR code')
                          }
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Imprimer le QR code
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30 mb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-orange-600" />
                  QR Code de la commande
                </h3>
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted-foreground">
                    Cette commande n&apos;a pas encore de QR code. Générez-en un pour permettre le suivi via scan.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleGenerateQRCode}
                    disabled={isGeneratingQR}
                    className="flex items-center gap-2"
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
              </div>
            )}
            
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              {/* Formulaire similaire à la page orders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_service_type">Type de service</Label>
                  <Select
                    value={editOrder.service_type}
                    onValueChange={(value) => setEditOrder({ ...editOrder, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <Label htmlFor="edit_status">Statut</Label>
                  <Select
                    value={editOrder.status}
                    onValueChange={(value) => setEditOrder({ ...editOrder, status: value })}
                  >
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="edit_container_id">Conteneur</Label>
                  <Select
                    value={editOrder.container_id || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setEditOrder({
                          ...editOrder,
                          container_id: "",
                          container_code: "",
                        })
                      } else {
                        const selected = containers.find((container) => container.id === value)
                        setEditOrder({
                          ...editOrder,
                          container_id: value,
                          container_code: selected?.code || "",
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun conteneur assigné" />
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
                  {editOrder.container_id && (() => {
                    const selectedContainer = containers.find((container) => container.id === editOrder.container_id)
                    return (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {editOrder.container_code || selectedContainer?.code || "N/A"}
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_origin">Origine</Label>
                  <Input
                    id="edit_origin"
                    value={editOrder.origin}
                    onChange={(e) => setEditOrder({ ...editOrder, origin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_destination">Destination</Label>
                  <Input
                    id="edit_destination"
                    value={editOrder.destination}
                    onChange={(e) => setEditOrder({ ...editOrder, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_weight">Poids (kg)</Label>
                  <Input
                    id="edit_weight"
                    type="number"
                    step="0.01"
                    value={editOrder.weight}
                    onChange={(e) => setEditOrder({ ...editOrder, weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_value">Valeur (€)</Label>
                  <Input
                    id="edit_value"
                    type="number"
                    step="0.01"
                    value={editOrder.value}
                    onChange={(e) => setEditOrder({ ...editOrder, value: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_estimated_delivery">Livraison estimée</Label>
                  <Input
                    id="edit_estimated_delivery"
                    type="date"
                    value={editOrder.estimated_delivery}
                    onChange={(e) => setEditOrder({ ...editOrder, estimated_delivery: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de création de commande */}
        <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une commande</DialogTitle>
              <DialogDescription>
                Créez une nouvelle commande pour {customer?.name}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_service_type">Type de service *</Label>
                  <Select
                    value={newOrder.service_type}
                    onValueChange={(value) => setNewOrder({ ...newOrder, service_type: value })}
                    required
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
                  <Label htmlFor="new_container_id">Conteneur</Label>
                  <Select
                    value={newOrder.container_id || "none"}
                    onValueChange={(value) => setNewOrder({ ...newOrder, container_id: value === "none" ? "" : value })}
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
                  {newOrder.container_id && (() => {
                    const selectedContainer = containers.find((container) => container.id === newOrder.container_id)
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
                  <Label htmlFor="new_origin">Origine *</Label>
                  <Input
                    id="new_origin"
                    value={newOrder.origin}
                    onChange={(e) => setNewOrder({ ...newOrder, origin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new_destination">Destination *</Label>
                  <Input
                    id="new_destination"
                    value={newOrder.destination}
                    onChange={(e) => setNewOrder({ ...newOrder, destination: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new_weight">Poids (kg)</Label>
                  <Input
                    id="new_weight"
                    type="number"
                    step="0.01"
                    value={newOrder.weight}
                    onChange={(e) => setNewOrder({ ...newOrder, weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new_value">Valeur (€)</Label>
                  <Input
                    id="new_value"
                    type="number"
                    step="0.01"
                    value={newOrder.value}
                    onChange={(e) => setNewOrder({ ...newOrder, value: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new_estimated_delivery">Livraison estimée</Label>
                  <Input
                    id="new_estimated_delivery"
                    type="date"
                    value={newOrder.estimated_delivery}
                    onChange={(e) => setNewOrder({ ...newOrder, estimated_delivery: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateOrderDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => handleCreateOrder(e, true)} 
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Créer et imprimer QR
                </Button>
                <Button type="submit">Créer la commande</Button>
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

