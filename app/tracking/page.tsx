"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  MapPin,
  Clock,
  Truck,
  Package,
  Ship,
  CheckCircle,
  AlertCircle,
  Plane,
  Car,
} from "lucide-react"

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
  const [trackingNumber, setTrackingNumber] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    try {
      setIsLoading(true)
      setError("")
      setHasSearched(true)

      const response = await fetch(`/api/orders/search?tracking=${trackingNumber}`)
      const result = await response.json()

      if (result.success && result.data.length > 0) {
        const foundOrder = result.data[0]
        setOrder(foundOrder)

        // Récupérer les événements de suivi
        const eventsResponse = await fetch(`/api/orders/${foundOrder.id}/tracking`)
        const eventsResult = await eventsResponse.json()

        if (eventsResult.success) {
          setTrackingEvents(eventsResult.data)
        }
      } else {
        setOrder(null)
        setTrackingEvents([])
        setError("Aucune commande trouvée avec ce numéro de suivi")
      }
    } catch (error) {
      setError("Erreur lors de la recherche")
      setOrder(null)
      setTrackingEvents([])
    } finally {
      setIsLoading(false)
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
        return <Ship className="h-5 w-5 text-blue-600" />
      case 'fret_aerien':
        return <Plane className="h-5 w-5 text-sky-600" />
      case 'demenagement':
        return <Truck className="h-5 w-5 text-orange-600" />
      case 'dedouanement':
        return <Car className="h-5 w-5 text-purple-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
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

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      preparation: "En préparation",
      confirmed: "Confirmée",
      in_progress: "En cours",
      arrive_port: "Arrivé au port",
      dedouane: "En dédouanement",
      completed: "Terminée",
      cancelled: "Annulée",
    }
    return statusLabels[status as keyof typeof statusLabels] || status
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Suivi de colis</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
              Où en est mon envoi ?
            </h1>
            <p className="mt-5 text-gray-400 text-lg leading-relaxed">
              Entrez votre numéro de suivi pour connaître l&apos;état de votre expédition en temps réel.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 lg:px-8 -mt-14 pb-20">
          {/* Formulaire de recherche */}
          <Card className="shadow-lg border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-600" />
                Rechercher votre commande
              </CardTitle>
              <CardDescription>
                Votre numéro de suivi se trouve sur votre facture ou dans l&apos;e-mail de confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="tracking" className="sr-only">Numéro de suivi</Label>
                  <Input
                    id="tracking"
                    type="text"
                    placeholder="Ex: DN2024001234"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="text-base h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !trackingNumber.trim()}
                  className="h-11 bg-orange-600 hover:bg-orange-700 rounded-full px-6"
                >
                  {isLoading ? "Recherche..." : "Rechercher"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Message d'erreur */}
          {error && hasSearched && (
            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Résultats */}
          {order && (
            <div className="mt-6 space-y-6">
              {/* Informations de la commande */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getServiceTypeIcon(order.service_type)}
                    Commande {order.order_number}
                  </CardTitle>
                  <CardDescription>
                    {getServiceTypeLabel(order.service_type)} • {order.origin} → {order.destination}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Informations client</h3>
                      <p className="text-sm text-gray-600">{order.client_name}</p>
                      <p className="text-sm text-gray-600">{order.client_email}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Détails de l&apos;expédition</h3>
                      <p className="text-sm text-gray-600">
                        <strong>Poids:</strong> {order.weight ? `${order.weight} kg` : 'Non spécifié'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Valeur:</strong> {order.value ? `€${order.value.toLocaleString()}` : 'Non spécifiée'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Livraison estimée:</strong> {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Statut actuel</h3>
                      <div className="mb-2">{getStatusBadge(order.status)}</div>
                      <p className="text-sm text-gray-600">
                        <strong>Dernière mise à jour:</strong> {new Date(order.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historique des événements */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Historique des événements
                  </CardTitle>
                  <CardDescription>
                    Suivi détaillé de votre expédition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trackingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {trackingEvents.map((event, index) => (
                        <div key={event.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
                          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{getStatusLabel(event.status)}</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(event.event_date).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                            {event.description && (
                              <p className="text-gray-700 mb-2">{event.description}</p>
                            )}
                            {event.operator && (
                              <p className="text-xs text-gray-500">
                                Opérateur: {event.operator}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun événement de suivi disponible pour cette commande</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Message d'aide */}
          {!hasSearched && (
            <Card className="mt-6 rounded-2xl">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Comment utiliser le suivi</h3>
                  <p className="text-gray-600 mb-4">
                    Entrez votre numéro de suivi dans le champ ci-dessus pour voir l&apos;état de votre expédition.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>Votre numéro de suivi se trouve sur votre facture ou dans l&apos;email de confirmation.</p>
                    <p>Exemple de format: DN2024001234</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
