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
import { Search, MapPin, Clock, Truck, Package, Ship, CheckCircle, AlertCircle } from "lucide-react"
import { useTrackingData, saveTrackingData, type PackageTracking, type TrackingEvent } from "@/lib/tracking-data"

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedPackage, setSelectedPackage] = useState<PackageTracking | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const packages = useTrackingData()

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || pkg.currentStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      preparation: { label: "Préparation", variant: "outline" as const, color: "text-gray-600" },
      expedie: { label: "Expédié", variant: "secondary" as const, color: "text-blue-600" },
      en_transit: { label: "En transit", variant: "default" as const, color: "text-orange-600" },
      arrive_port: { label: "Arrivé au port", variant: "secondary" as const, color: "text-purple-600" },
      dedouane: { label: "Dédouanement", variant: "outline" as const, color: "text-yellow-600" },
      livre: { label: "Livré", variant: "default" as const, color: "text-green-600" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparation":
        return <Package className="h-4 w-4 text-gray-600" />
      case "expedie":
        return <Truck className="h-4 w-4 text-blue-600" />
      case "en_transit":
        return <Ship className="h-4 w-4 text-orange-600" />
      case "arrive_port":
        return <MapPin className="h-4 w-4 text-purple-600" />
      case "dedouane":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "livre":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleUpdateStatus = async () => {
    setErrorMessage("")

    if (!selectedPackage) {
      setErrorMessage("Aucun colis sélectionné")
      return
    }

    if (!newStatus) {
      setErrorMessage("Veuillez sélectionner un statut")
      return
    }

    if (!newLocation.trim()) {
      setErrorMessage("Veuillez saisir une localisation")
      return
    }

    if (!newDescription.trim()) {
      setErrorMessage("Veuillez saisir une description")
      return
    }

    setIsUpdating(true)

    try {
      const newEvent: TrackingEvent = {
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        status: newStatus,
        location: newLocation.trim(),
        description: newDescription.trim(),
        operator: "Admin",
      }

      const updatedPackages = packages.map((pkg) =>
        pkg.id === selectedPackage.id
          ? {
              ...pkg,
              currentStatus: newStatus as any,
              events: [...pkg.events, newEvent],
              lastUpdate: new Date().toISOString(),
            }
          : pkg,
      )

      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      saveTrackingData(updatedPackages)

      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 3000)

      setNewStatus("")
      setNewLocation("")
      setNewDescription("")
      setIsUpdateDialogOpen(false)
      setSelectedPackage(null)

      console.log("Mise à jour effectuée avec succès pour le colis:", selectedPackage.trackingNumber)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      setErrorMessage("Erreur lors de la mise à jour. Veuillez réessayer.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <AdminLayout title="Suivi des colis">
      {updateSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Mise à jour effectuée avec succès !</span>
            <span className="text-sm">Les données ont été synchronisées en temps réel.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total expéditions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En transit</CardTitle>
            <Ship className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {packages.filter((pkg) => pkg.currentStatus === "en_transit").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Au port</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {packages.filter((pkg) => pkg.currentStatus === "arrive_port").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {packages.filter((pkg) => pkg.currentStatus === "livre").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de suivi, référence ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="preparation">Préparation</SelectItem>
                <SelectItem value="expedie">Expédié</SelectItem>
                <SelectItem value="en_transit">En transit</SelectItem>
                <SelectItem value="arrive_port">Arrivé au port</SelectItem>
                <SelectItem value="dedouane">Dédouanement</SelectItem>
                <SelectItem value="livre">Livré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suivi des expéditions ({filteredPackages.length} colis)</CardTitle>
          <CardDescription>Liste de toutes les expéditions avec leur statut actuel</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° de suivi</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Livraison estimée</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-mono font-medium">{pkg.trackingNumber}</TableCell>
                  <TableCell>{pkg.reference}</TableCell>
                  <TableCell>{pkg.client}</TableCell>
                  <TableCell>{pkg.destination}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(pkg.currentStatus)}
                      {getStatusBadge(pkg.currentStatus)}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(pkg.estimatedDelivery).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(pkg.lastUpdate).toLocaleDateString("fr-FR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Détails du suivi - {pkg.trackingNumber}</DialogTitle>
                            <DialogDescription>Historique complet des mouvements pour {pkg.client}</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-4">Informations générales</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Référence:</span> {pkg.reference}
                                </div>
                                <div>
                                  <span className="font-medium">Client:</span> {pkg.client}
                                </div>
                                <div>
                                  <span className="font-medium">Destination:</span> {pkg.destination}
                                </div>
                                <div>
                                  <span className="font-medium">Poids:</span> {pkg.weight}
                                </div>
                                <div>
                                  <span className="font-medium">Valeur:</span> {pkg.value}
                                </div>
                                <div>
                                  <span className="font-medium">Livraison estimée:</span>{" "}
                                  {new Date(pkg.estimatedDelivery).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-4">Historique des mouvements</h4>
                              <div className="space-y-4">
                                {pkg.events
                                  .slice()
                                  .reverse()
                                  .map((event, index) => (
                                    <div key={event.id} className="flex gap-3">
                                      <div className="flex flex-col items-center">
                                        <div
                                          className={`w-3 h-3 rounded-full ${
                                            index === 0 ? "bg-orange-500" : "bg-gray-300"
                                          }`}
                                        />
                                        {index < pkg.events.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2" />}
                                      </div>
                                      <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                          {getStatusIcon(event.status)}
                                          <span className="font-medium text-sm">
                                            {event.date} à {event.time}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1">{event.location}</div>
                                        <div className="text-sm">{event.description}</div>
                                        {event.operator && (
                                          <div className="text-xs text-gray-500 mt-1">Opérateur: {event.operator}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPackage(pkg)
                          setIsUpdateDialogOpen(true)
                        }}
                        className="bg-orange-50 text-orange-600 hover:bg-orange-100"
                      >
                        Mettre à jour
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le statut</DialogTitle>
            <DialogDescription>
              {selectedPackage && `Colis ${selectedPackage.trackingNumber} - ${selectedPackage.client}`}
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Nouveau statut</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparation">Préparation</SelectItem>
                  <SelectItem value="expedie">Expédié</SelectItem>
                  <SelectItem value="en_transit">En transit</SelectItem>
                  <SelectItem value="arrive_port">Arrivé au port</SelectItem>
                  <SelectItem value="dedouane">Dédouanement</SelectItem>
                  <SelectItem value="livre">Livré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Ex: Port de Douala, Cameroun"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description de l'événement..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStatus} className="bg-orange-600 hover:bg-orange-700" disabled={isUpdating}>
              {isUpdating ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
