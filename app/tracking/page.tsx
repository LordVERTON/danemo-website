"use client"

import { useState } from "react"
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
  Copy,
  ExternalLink,
  PackageSearch,
} from "lucide-react"
import { useI18n } from "@/lib/i18n"

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

interface Container {
  id: string
  code: string
  vessel?: string | null
  departure_port?: string | null
  arrival_port?: string | null
  etd?: string | null
  eta?: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function TrackingPage() {
  const { messages } = useI18n()
  const tracking = messages.tracking
  const containerStatusLabels: Record<string, string> = {
    planned: tracking.containerStatus.planned,
    departed: tracking.containerStatus.departed,
    in_transit: tracking.containerStatus.in_transit,
    arrived: tracking.containerStatus.arrived,
    delivered: tracking.containerStatus.delivered,
    delayed: tracking.containerStatus.delayed,
  }

  const [trackingNumber, setTrackingNumber] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [container, setContainer] = useState<Container | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContainer, setIsLoadingContainer] = useState(false)
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

        await fetchContainerDetails(foundOrder)
      } else {
        setOrder(null)
        setTrackingEvents([])
        setContainer(null)
        setError(tracking.errors.notFound)
      }
    } catch (error) {
      setError(tracking.errors.generic)
      setOrder(null)
      setTrackingEvents([])
      setContainer(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContainerDetails = async (order: Order) => {
    if (!order.container_id && !order.container_code) {
      setContainer(null)
      return
    }

    try {
      setIsLoadingContainer(true)
      if (order.container_id) {
        const response = await fetch(`/api/containers/${order.container_id}`)
        const result = await response.json()
        if (result.success) {
          setContainer(result.data)
          return
        }
      }

      if (order.container_code) {
        const response = await fetch(`/api/containers`)
        const result = await response.json()
        if (result.success) {
          const match = (result.data as Container[]).find(
            (item) => item.code === order.container_code,
          )
          setContainer(match || null)
          return
        }
      }

      setContainer(null)
    } catch (err) {
      console.error("Failed to fetch container details:", err)
      setContainer(null)
    } finally {
      setIsLoadingContainer(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: tracking.status.pending, variant: "outline" as const, icon: Clock, color: "text-yellow-600" },
      confirmed: { label: tracking.status.confirmed, variant: "secondary" as const, icon: CheckCircle, color: "text-blue-600" },
      in_progress: { label: tracking.status.in_progress, variant: "default" as const, icon: Truck, color: "text-orange-600" },
      completed: { label: tracking.status.completed, variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { label: tracking.status.cancelled, variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{tracking.title}</h1>
          <p className="text-xl text-gray-600">{tracking.subtitle}</p>
        </div>

        {/* Formulaire de recherche */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {tracking.search.label}
            </CardTitle>
            <CardDescription>{tracking.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="tracking" className="sr-only">
                  {tracking.search.label}
                </Label>
                <Input
                  id="tracking"
                  type="text"
                  placeholder={tracking.search.placeholder}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button type="submit" disabled={isLoading || !trackingNumber.trim()}>
                {isLoading ? "..." : tracking.search.button}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && hasSearched && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Résultats */}
        {order && (
          <div className="space-y-6">
            {(isLoadingContainer || container || order.container_code) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageSearch className="h-5 w-5 text-orange-600" />
                    {tracking.container.title}
                  </CardTitle>
                  <CardDescription>{tracking.container.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingContainer ? (
                    <div className="text-sm text-gray-500">Chargement...</div>
                  ) : container ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                          {container.code}
                        </Badge>
                        <Badge variant="secondary">
                          {containerStatusLabels[container.status] || container.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(container.code)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {tracking.container.copy}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/tracking?code=${container.code}`, "_blank")}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {tracking.container.follow}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">{tracking.container.vessel}</h4>
                          <p className="font-medium text-gray-800">{container.vessel || "Non communiqué"}</p>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">{tracking.container.departure}</h4>
                          <p>{container.departure_port || "Non communiqué"}</p>
                          <p className="text-xs text-gray-500">
                            {tracking.container.etd} {formatDate(container.etd)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">{tracking.container.arrival}</h4>
                          <p>{container.arrival_port || "Non communiqué"}</p>
                          <p className="text-xs text-gray-500">
                            {tracking.container.eta} {formatDate(container.eta)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : order.container_code ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                        {order.container_code}
                      </Badge>
                      <span className="text-muted-foreground">En cours de synchronisation...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun conteneur associé.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Informations de la commande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getServiceTypeIcon(order.service_type)}
                  {tracking.order.title} {order.order_number}
                </CardTitle>
                <CardDescription>
                  {getServiceTypeLabel(order.service_type)} • {order.origin} → {order.destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{tracking.order.clientInfo}</h3>
                    <p className="text-sm text-gray-600">{order.client_name}</p>
                    <p className="text-sm text-gray-600">{order.client_email}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{tracking.order.shipmentDetails}</h3>
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
                    <h3 className="font-semibold text-gray-900 mb-2">{tracking.order.currentStatus}</h3>
                    <div className="mb-2">{getStatusBadge(order.status)}</div>
                    <p className="text-sm text-gray-600">
                      <strong>{tracking.order.lastUpdate}:</strong> {new Date(order.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historique des événements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {tracking.events.title}
                </CardTitle>
                <CardDescription>{tracking.events.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {trackingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
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
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{tracking.events.empty}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message d'aide */}
        {!hasSearched && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tracking.help.title}</h3>
                <p className="text-gray-600 mb-4">{tracking.help.description}</p>
                <div className="text-sm text-gray-500 whitespace-pre-line">{tracking.help.example}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

const formatDate = (value?: string | null) => {
  if (!value) return "Non communiqué"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("fr-FR")
}