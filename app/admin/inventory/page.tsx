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
import { Plus, Search, Edit, Trash2, Package, Car, Box, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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
    valeur: ""
  })

  useEffect(() => {
    fetchInventory()
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
          valeur: ""
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
      valeur: item.valeur
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
          valeur: ""
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
    return matchesSearch && matchesType && matchesStatus
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des stocks</h1>
            <p className="text-muted-foreground">
              Gérez l'inventaire des colis, véhicules et marchandises
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Modifier l'article" : "Ajouter un article"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? "Modifiez les informations de l'article" : "Ajoutez un nouvel article à l'inventaire"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
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
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client *</Label>
                    <Input
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({...formData, client: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut *</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
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
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="poids">Poids</Label>
                    <Input
                      id="poids"
                      value={formData.poids}
                      onChange={(e) => setFormData({...formData, poids: e.target.value})}
                      placeholder="Ex: 15 kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                      placeholder="Ex: 40x30x20 cm"
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
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
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
                      valeur: ""
                    })
                  }}>
                    Annuler
                  </Button>
                  <Button type="submit">
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par référence, description ou client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-40">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Description</TableHead>
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
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.reference}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
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
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
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