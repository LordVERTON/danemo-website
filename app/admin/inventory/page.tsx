"use client"

import { useState } from "react"
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
import { Plus, Search, Edit, Trash2, Package, Car, Box } from "lucide-react"

interface InventoryItem {
  id: string
  type: "colis" | "vehicule" | "marchandise"
  reference: string
  description: string
  client: string
  status: "en_stock" | "en_transit" | "livre" | "en_attente"
  location: string
  dateAjout: string
  poids?: string
  dimensions?: string
  valeur: string
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Sample data - in production this would come from a database
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: "1",
      type: "colis",
      reference: "COL-2024-001",
      description: "Électronique - Smartphones et accessoires",
      client: "Jean Mballa",
      status: "en_stock",
      location: "Entrepôt Bruxelles - Zone A",
      dateAjout: "2024-01-15",
      poids: "15 kg",
      dimensions: "40x30x20 cm",
      valeur: "€1,200",
    },
    {
      id: "2",
      type: "vehicule",
      reference: "VEH-2024-001",
      description: "Toyota RAV4 Hybrid 2023",
      client: "Marie Nguema",
      status: "en_transit",
      location: "Port de Douala",
      dateAjout: "2024-01-10",
      valeur: "€28,000",
    },
    {
      id: "3",
      type: "marchandise",
      reference: "MAR-2024-001",
      description: "Produits cosmétiques - Lot de 50 unités",
      client: "Paul Essomba",
      status: "en_attente",
      location: "Entrepôt Bruxelles - Zone B",
      dateAjout: "2024-01-20",
      poids: "25 kg",
      valeur: "€800",
    },
    {
      id: "4",
      type: "colis",
      reference: "COL-2024-002",
      description: "Vêtements et chaussures",
      client: "Sophie Atangana",
      status: "livre",
      location: "Yaoundé - Livré",
      dateAjout: "2024-01-05",
      poids: "8 kg",
      dimensions: "50x40x30 cm",
      valeur: "€450",
    },
  ])

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    type: "colis",
    status: "en_stock",
    location: "Entrepôt Bruxelles",
  })

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      en_stock: { label: "En stock", variant: "default" as const },
      en_transit: { label: "En transit", variant: "secondary" as const },
      livre: { label: "Livré", variant: "default" as const },
      en_attente: { label: "En attente", variant: "outline" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "colis":
        return <Package className="h-4 w-4" />
      case "vehicule":
        return <Car className="h-4 w-4" />
      case "marchandise":
        return <Box className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleAddItem = () => {
    if (newItem.reference && newItem.description && newItem.client) {
      const item: InventoryItem = {
        id: Date.now().toString(),
        type: newItem.type as "colis" | "vehicule" | "marchandise",
        reference: newItem.reference,
        description: newItem.description,
        client: newItem.client,
        status: newItem.status as "en_stock" | "en_transit" | "livre" | "en_attente",
        location: newItem.location || "",
        dateAjout: new Date().toISOString().split("T")[0],
        poids: newItem.poids,
        dimensions: newItem.dimensions,
        valeur: newItem.valeur || "",
      }
      setInventory([...inventory, item])
      setNewItem({ type: "colis", status: "en_stock", location: "Entrepôt Bruxelles" })
      setIsAddDialogOpen(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.filter((item) => item.id !== id))
  }

  return (
    <AdminLayout title="Gestion des stocks">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En stock</CardTitle>
            <Box className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter((item) => item.status === "en_stock").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En transit</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inventory.filter((item) => item.status === "en_transit").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {inventory.filter((item) => item.status === "en_attente").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence, description ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type d'article" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="colis">Colis</SelectItem>
                <SelectItem value="vehicule">Véhicule</SelectItem>
                <SelectItem value="marchandise">Marchandise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouvel article</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouvel article à l'inventaire
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'article</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value) => setNewItem({ ...newItem, type: value as any })}
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      value={newItem.reference || ""}
                      onChange={(e) => setNewItem({ ...newItem, reference: e.target.value })}
                      placeholder="Ex: COL-2024-001"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newItem.description || ""}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Description détaillée de l'article"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Input
                      id="client"
                      value={newItem.client || ""}
                      onChange={(e) => setNewItem({ ...newItem, client: e.target.value })}
                      placeholder="Nom du client"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={newItem.status}
                      onValueChange={(value) => setNewItem({ ...newItem, status: value as any })}
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      value={newItem.location || ""}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      placeholder="Ex: Entrepôt Bruxelles - Zone A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valeur">Valeur</Label>
                    <Input
                      id="valeur"
                      value={newItem.valeur || ""}
                      onChange={(e) => setNewItem({ ...newItem, valeur: e.target.value })}
                      placeholder="Ex: €1,200"
                    />
                  </div>
                  {newItem.type === "colis" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="poids">Poids</Label>
                        <Input
                          id="poids"
                          value={newItem.poids || ""}
                          onChange={(e) => setNewItem({ ...newItem, poids: e.target.value })}
                          placeholder="Ex: 15 kg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dimensions">Dimensions</Label>
                        <Input
                          id="dimensions"
                          value={newItem.dimensions || ""}
                          onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
                          placeholder="Ex: 40x30x20 cm"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddItem} className="bg-orange-600 hover:bg-orange-700">
                    Ajouter l'article
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire ({filteredInventory.length} articles)</CardTitle>
          <CardDescription>Liste complète de tous les articles en stock, en transit et livrés</CardDescription>
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
                  <TableCell>{new Date(item.dateAjout).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
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
    </AdminLayout>
  )
}
