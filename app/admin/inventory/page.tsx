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
import { Plus, Search, Edit, Trash2, Package, Car, Box, AlertCircle, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrentUser } from "@/lib/use-current-user"

interface InventoryItem {
  id: string
  type: "colis" | "vehicule" | "marchandise"
  reference: string
  description: string
  client: string
  status: "en_stock" | "en_transit" | "livre" | "en_attente"
  location: string
  date_ajout: string
  poids?: string
  dimensions?: string
  valeur: string
  container_id?: string | null
  container_code?: string | null
}

export default function InventoryPage() {
  const { user: currentUser } = useCurrentUser()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterContainer, setFilterContainer] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [containers, setContainers] = useState<{ id: string; code: string }[]>([])

  // Formulaire pour ajouter/modifier un item
  const [formData, setFormData] = useState({
    type: "colis" as "colis" | "vehicule" | "marchandise",
    reference: "",
    description: "",
    client: "",
    status: "en_stock" as "en_stock" | "en_transit" | "livre" | "en_attente",
    location: "",
    poids: "",
    dimensions: "",
    valeur: "",
    container_id: "" as string | "",
    container_code: "" as string | ""
  })

  useEffect(() => {
    fetchInventory()
    fetchContainers()
  }, [])

  useEffect(() => {
    const handleQRScanResult = (event: CustomEvent) => {
      if (event.detail.type === 'inventory') {
        setFormData(event.detail.data)
        setIsAddDialogOpen(true)
      }
    }

    window.addEventListener('qrScanResult', handleQRScanResult as EventListener)
    return () => window.removeEventListener('qrScanResult', handleQRScanResult as EventListener)
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/inventory')
      const result = await response.json()
      
      if (result.success) {
        setInventory(result.data)
      } else {
        setError('Erreur lors du chargement de l\'inventaire')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/containers')
      const json = await res.json()
      if (json.success) {
        setContainers(json.data.map((c: any) => ({ id: c.id, code: c.code })))
      }
    } catch {}
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (result.success) {
        setFormData({
          type: "colis",
          reference: "",
          description: "",
          client: "",
          status: "en_stock",
          location: "",
          poids: "",
          dimensions: "",
          valeur: "",
          container_id: "",
          container_code: ""
        })
        setIsAddDialogOpen(false)
        fetchInventory() // Refresh the inventory
      } else {
        setError(result.error || 'Erreur lors de l\'ajout de l\'article')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleQRScan = (qrData: string) => {
    try {
      const data = JSON.parse(qrData)
      
      // Pré-remplir le formulaire avec les données du QR code
      setFormData({
        type: data.type || "colis",
        reference: data.reference || "",
        description: data.description || "",
        client: data.client || "",
        status: "en_stock",
        location: "",
        poids: data.weight || "",
        dimensions: data.dimensions || "",
        valeur: data.value || "",
        container_id: "",
        container_code: ""
      })
      
      // Ouvrir le dialog d'ajout
      setIsAddDialogOpen(true)
    } catch (error) {
      setError('Format de QR code invalide')
    }
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      reference: item.reference,
      description: item.description,
      client: item.client,
      status: item.status,
      location: item.location,
      poids: item.poids || "",
      dimensions: item.dimensions || "",
      valeur: item.valeur,
      container_id: item.container_id || "",
      container_code: item.container_code || ""
    })
    setIsAddDialogOpen(true)
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (result.success) {
        setEditingItem(null)
        setFormData({
          type: "colis",
          reference: "",
          description: "",
          client: "",
          status: "en_stock",
          location: "",
          poids: "",
          dimensions: "",
          valeur: "",
          container_id: "",
          container_code: ""
        })
        setIsAddDialogOpen(false)
        fetchInventory() // Refresh the inventory
      } else {
        setError(result.error || 'Erreur lors de la modification de l\'article')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (result.success) {
        fetchInventory() // Refresh the inventory
      } else {
        setError(result.error || 'Erreur lors de la suppression de l\'article')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "colis":
        return <Package className="h-4 w-4 text-blue-600" />
      case "vehicule":
        return <Car className="h-4 w-4 text-green-600" />
      case "marchandise":
        return <Box className="h-4 w-4 text-orange-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      en_stock: { label: "En stock", variant: "default" as const, color: "text-green-600" },
      en_transit: { label: "En transit", variant: "secondary" as const, color: "text-blue-600" },
      livre: { label: "Livré", variant: "outline" as const, color: "text-gray-600" },
      en_attente: { label: "En attente", variant: "destructive" as const, color: "text-yellow-600" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    const matchesContainer =
      filterContainer === "all" ||
      item.container_id === filterContainer ||
      item.container_code === filterContainer
    return matchesSearch && matchesType && matchesStatus && matchesContainer
  })

  if (isLoading) {
    return (
      <AdminLayout title="Gestion des stocks">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement de l'inventaire...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Gestion des stocks">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Ajouter un article</span>
                <span className="xs:hidden">Ajouter</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingItem ? "Modifier l'article" : "Ajouter un article"}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  {editingItem ? "Modifiez les informations de l'article" : "Ajoutez un nouvel article à l'inventaire"}
                </DialogDescription>
                {currentUser && (
                  <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    {editingItem ? "Modifié par" : "Créé par"} : <span className="font-medium">{currentUser.name}</span>
                  </div>
                )}
              </DialogHeader>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                      <SelectTrigger className="text-base sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colis">Colis</SelectItem>
                        <SelectItem value="vehicule">Véhicule</SelectItem>
                        <SelectItem value="marchandise">Marchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reference">Référence *</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({...formData, reference: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    className="text-base sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Input
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({...formData, client: e.target.value})}
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut *</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="text-base sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_stock">En stock</SelectItem>
                        <SelectItem value="en_transit">En transit</SelectItem>
                        <SelectItem value="livre">Livré</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="container">Conteneur</Label>
                  <Select
                    value={formData.container_id || "none"}
                    onValueChange={(value: string) => {
                      if (value === "none") {
                        setFormData({
                          ...formData,
                          container_id: "",
                          container_code: "",
                        })
                      } else {
                        const selected = containers.find((c) => c.id === value)
                        setFormData({
                          ...formData,
                          container_id: value,
                          container_code: selected?.code || "",
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="text-base sm:text-sm">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {containers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    className="text-base sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="poids">Poids</Label>
                    <Input
                      id="poids"
                      value={formData.poids}
                      onChange={(e) => setFormData({...formData, poids: e.target.value})}
                      placeholder="Ex: 15 kg"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                      placeholder="Ex: 40x30x20 cm"
                      className="text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valeur">Valeur *</Label>
                    <Input
                      id="valeur"
                      value={formData.valeur}
                      onChange={(e) => setFormData({...formData, valeur: e.target.value})}
                      placeholder="Ex: €1,200"
                      required
                      className="text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingItem(null)
                    setFormData({
                      type: "colis",
                      reference: "",
                      description: "",
                      client: "",
                      status: "en_stock",
                      location: "",
                      poids: "",
                      dimensions: "",
                      valeur: "",
                      container_id: "",
                      container_code: ""
                    })
                  }} className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base py-2 sm:py-1">
                    {editingItem ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par référence, description ou client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="colis">Colis</SelectItem>
                    <SelectItem value="vehicule">Véhicules</SelectItem>
                    <SelectItem value="marchandise">Marchandises</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_stock">En stock</SelectItem>
                    <SelectItem value="en_transit">En transit</SelectItem>
                    <SelectItem value="livre">Livré</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterContainer} onValueChange={setFilterContainer}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Conteneur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les conteneurs</SelectItem>
                    {containers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table de l'inventaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventaire ({filteredInventory.length} articles)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Version Desktop - Tableau */}
            <div className="hidden lg:block">
              <div className="mb-4 text-sm text-muted-foreground">
                💡 Cliquez sur une ligne pour modifier l'article
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Date ajout</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="hover:bg-gray-50 hover:shadow-sm hover:scale-[1.01] transition-all duration-200 ease-in-out group cursor-pointer"
                      onClick={() => handleEditItem(item)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.reference}
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.container_code || containers.find((c) => c.id === item.container_id)?.code || "-"}
                      </TableCell>
                      <TableCell>{item.client}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.location}</TableCell>
                      <TableCell>{item.valeur}</TableCell>
                      <TableCell>{new Date(item.date_ajout).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditItem(item)
                            }}
                            className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item.id)
                            }}
                            className="hover:bg-red-50 hover:border-red-200 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Version Mobile - Cartes */}
            <div className="lg:hidden space-y-4">
              <div className="mb-4 text-sm text-muted-foreground">
                💡 Cliquez sur une carte pour modifier l'article
              </div>
              {filteredInventory.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-in-out cursor-pointer"
                  onClick={() => handleEditItem(item)}
                >
                  <div className="space-y-3">
                    {/* Header avec type et statut */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(item.type)}
                          <span className="font-semibold text-lg capitalize">{item.type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{item.reference}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="font-medium">{item.description}</p>
                    </div>

                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client:</span>
                        <p className="font-medium">{item.client}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valeur:</span>
                        <p className="font-medium">{item.valeur}</p>
                      </div>
                    </div>

                    {/* Localisation et date */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Localisation:</span>
                        <p className="font-medium">{item.location}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date ajout:</span>
                        <p className="font-medium">{new Date(item.date_ajout).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditItem(item)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Modifier</span>
                        <span className="sm:hidden">Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteItem(item.id)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Supprimer</span>
                        <span className="sm:hidden">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  )
}