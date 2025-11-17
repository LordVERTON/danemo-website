"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import QRScanner from "@/components/qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, MapPin, QrCode, RefreshCw, Search, Timer, Truck, CheckCircle2, AlertTriangle, ExternalLink, Edit, Save, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TrackingEvent {
  id: string
  order_id: string
  status: string
  location?: string | null
  description?: string | null
  operator?: string | null
  event_date: string
}

interface PackagePayload {
  package: {
    id: string
    qr_code: string
    reference: string
    description?: string | null
    client_id?: string | null
    container_id?: string | null
    weight?: number | null
    value?: number | null
    status: string
    last_scan_at?: string | null
    created_at: string
    updated_at: string
  }
  client: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
  } | null
  container: {
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
  } | null
  events: TrackingEvent[]
}

interface OrderPayload {
  order: {
    id: string
    order_number: string
    qr_code: string | null
    client_name: string
    client_email: string
    client_phone: string | null
    recipient_name: string | null
    recipient_email: string | null
    recipient_phone: string | null
    recipient_address: string | null
    recipient_city: string | null
    recipient_postal_code: string | null
    recipient_country: string | null
    service_type: string
    origin: string
    destination: string
    weight: number | null
    value: number | null
    status: string
    estimated_delivery: string | null
    container_id: string | null
    container_code: string | null
    created_at: string
    updated_at: string
  }
  container: {
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
  } | null
  events: TrackingEvent[]
  customer: {
    id: string
    name: string
    email: string
    phone?: string | null
  } | null
}

type TrackingData = PackagePayload | OrderPayload | null

interface DecodedPayload {
  raw: string
  decoded: string
  qrCode: string | null
  metadata: Record<string, string>
}

const packageStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> =
  {
    preparation: { label: "En préparation", variant: "outline", icon: Timer },
    expedie: { label: "Expédié", variant: "secondary", icon: Truck },
    en_transit: { label: "En transit", variant: "default", icon: Truck },
    arrive_port: { label: "Arrivé au port", variant: "default", icon: MapPin },
    dedouane: { label: "En dédouanement", variant: "default", icon: RefreshCw },
    livre: { label: "Livré", variant: "secondary", icon: CheckCircle2 },
  }

const containerStatusMap: Record<string, string> = {
  planned: "Planifié",
  departed: "Départ confirmé",
  in_transit: "En transit",
  arrived: "Arrivé",
  delivered: "Livré",
  delayed: "Retard",
}

const orderStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "En attente", variant: "outline", icon: Timer },
  confirmed: { label: "Confirmée", variant: "secondary", icon: CheckCircle2 },
  in_progress: { label: "En cours", variant: "default", icon: Truck },
  completed: { label: "Terminée", variant: "secondary", icon: CheckCircle2 },
  cancelled: { label: "Annulée", variant: "destructive", icon: AlertTriangle },
}

function tryDecodeBase64(value: string): string | null {
  try {
    if (!/^[A-Za-z0-9+/=]+$/.test(value) || value.length % 4 !== 0) return null
    return atob(value)
  } catch {
    return null
  }
}

function decodePayload(raw: string): DecodedPayload {
  const metadata: Record<string, string> = {}
  let working = raw.trim()

  if (!working) {
    return { raw, decoded: "", qrCode: null, metadata }
  }

  try {
    working = decodeURIComponent(working)
  } catch {
    // ignore uri errors
  }

  const base64Decoded = tryDecodeBase64(working)
  if (base64Decoded) {
    metadata.encoding = "base64"
    working = base64Decoded
  }

  let qrCode: string | null = null
  if (working.startsWith("http")) {
    try {
      const url = new URL(working)
      qrCode =
        url.searchParams.get("qr") ||
        url.searchParams.get("code") ||
        url.searchParams.get("tracking") ||
        url.pathname.split("/").filter(Boolean).pop() ||
        null
      metadata.source = url.host
    } catch {
      // ignore URL parsing failure
    }
  }

  if (!qrCode) {
    try {
      const json = JSON.parse(working)
      metadata.format = "json"
      qrCode =
        json.qr_code ||
        json.qr ||
        json.code ||
        json.package_qr ||
        json.tracking ||
        json.order_number ||
        json.package_id ||
        null
    } catch {
      // not JSON
    }
  }

  if (!qrCode) {
    qrCode = working
  }

  return { raw, decoded: working, qrCode, metadata }
}

function formatDate(date?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "-"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString("fr-FR", options)
}

function formatDateTime(date?: string | null) {
  if (!date) return "-"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface QRTrackingViewProps {
  initialPayload?: string
}

export default function QRTrackingView({ initialPayload }: QRTrackingViewProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState(initialPayload || "")
  const [decoded, setDecoded] = useState<DecodedPayload>(() => decodePayload(initialPayload || ""))
  const [trackingData, setTrackingData] = useState<TrackingData>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tracking")
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editOperator, setEditOperator] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const qrDisplay = useMemo(() => decoded.qrCode || "", [decoded])
  const isOrder = useMemo(() => {
    if (!trackingData) return false
    return 'order' in trackingData
  }, [trackingData])
  const container = isOrder ? (trackingData as OrderPayload)?.container : (trackingData as PackagePayload)?.container ?? null

  useEffect(() => {
    if (initialPayload) {
      const decodedPayload = decodePayload(initialPayload)
      setDecoded(decodedPayload)
      setInputValue(initialPayload)
      
      // Charger automatiquement les données si un QR code est détecté
      if (decodedPayload.qrCode) {
        fetchTrackingData(decodedPayload.qrCode)
      }
    }
  }, [initialPayload])

  const fetchTrackingData = async (qrCode: string) => {
    if (!qrCode) return
    try {
      setIsLoading(true)
      setError(null)
      
      // Détecter si c'est un QR code de commande (commence par "ORD-")
      const isOrderQr = qrCode.startsWith("ORD-")
      const endpoint = isOrderQr 
        ? `/api/orders/${encodeURIComponent(qrCode)}`
        : `/api/packages/${encodeURIComponent(qrCode)}`
      
      const res = await fetch(endpoint)
      const json = await res.json()
      
      if (!json.success) {
        setTrackingData(null)
        setError(json.error || (isOrderQr ? "Aucune commande trouvée pour ce QR code" : "Aucun colis trouvé pour ce QR code"))
        return
      }
      
      setTrackingData(json.data)
      
      // Initialiser les valeurs d'édition pour les commandes
      if (isOrderQr && json.data.order) {
        setEditStatus(json.data.order.status)
      }
      
      setActiveTab(json.data?.container ? "container" : "tracking")
    } catch (err) {
      console.error("Failed to fetch QR tracking data:", err)
      setError("Impossible de récupérer les informations.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTracking = async () => {
    if (!qrDisplay || !isOrder) return
    
    try {
      setIsSaving(true)
      const res = await fetch(`/api/orders/${encodeURIComponent(qrDisplay)}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          location: editLocation || null,
          description: editDescription || null,
          operator: editOperator || null,
        }),
      })
      
      const json = await res.json()
      if (!json.success) {
        setError(json.error || "Erreur lors de la sauvegarde")
        return
      }
      
      // Rafraîchir les données
      await fetchTrackingData(qrDisplay)
      setIsEditing(false)
      setEditLocation("")
      setEditDescription("")
      setEditOperator("")
    } catch (err) {
      console.error("Failed to save tracking:", err)
      setError("Impossible de sauvegarder les modifications.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDecode = (value: string) => {
    const decodedPayload = decodePayload(value)
    setDecoded(decodedPayload)
    setInputValue(value)
    setTrackingData(null)

    if (decodedPayload.qrCode) {
      router.replace(`/qr?code=${encodeURIComponent(decodedPayload.qrCode)}`, { scroll: false })
      fetchTrackingData(decodedPayload.qrCode)
    } else {
      setError("Impossible de déterminer le code du QR. Vérifiez le contenu.")
    }
  }

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (inputValue.trim()) {
      handleDecode(inputValue.trim())
    }
  }

  const renderStatusBadge = (status: string, isOrderStatus = false) => {
    const statusMap = isOrderStatus ? orderStatusMap : packageStatusMap
    const config = statusMap[status] || {
      label: status,
      variant: "outline" as const,
      icon: AlertTriangle,
    }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const timeline = useMemo(() => {
    return (trackingData?.events || []).slice().sort((a, b) => {
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    })
  }, [trackingData])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Suivi via QR code</h1>
          <p className="text-lg text-gray-600">
            Scannez ou collez un QR Danemo pour obtenir le statut de votre commande ou colis et l&apos;historique détaillé.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-orange-500" />
              Décoder un QR
            </CardTitle>
            <CardDescription>
              Utilisez le scanner intégré ou collez la valeur brute/JSON/URL d&apos;un QR code Danemo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleManualSubmit} className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Coller la donnée du QR (JSON, URL ou jeton)"
                  className="text-base"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!inputValue.trim()} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Décoder
                </Button>
                <QRScanner
                  onScan={(data) => handleDecode(data)}
                  trigger={
                    <Button type="button" variant="outline" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Scanner
                    </Button>
                  }
                  title="Scanner un QR Danemo"
                  description="Pointez la caméra vers le QR code du colis pour obtenir les informations."
                />
              </div>
            </form>

            {decoded.qrCode ? (
              <Alert>
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    QR détecté:&nbsp;
                    <span className="font-semibold text-orange-600 break-all">{decoded.qrCode}</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => navigator.clipboard.writeText(decoded.qrCode || "")}
                    >
                      <Copy className="h-4 w-4" />
                      Copier
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fetchTrackingData(decoded.qrCode || "")}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Rafraîchir
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  Aucun identifiant spécifique n&apos;a pu être extrait de ce QR. Vérifiez le contenu ou contactez le
                  support.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {trackingData?.container && <TabsTrigger value="container">Conteneur</TabsTrigger>}
                <TabsTrigger value="tracking">Suivi</TabsTrigger>
              </TabsList>
              {container && (
                <TabsContent value="container" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                          {container.code}
                        </Badge>
                        <Badge variant="secondary">
                          {containerStatusMap[container.status] || container.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Détails du conteneur associé à ce colis.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(container.code)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copier le code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tracking?code=${container.code}`)}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Suivre ce conteneur
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">Trajet</h4>
                          <p>
                            <span className="font-semibold">Départ:</span>{" "}
                            {container.departure_port || "Non communiqué"}
                          </p>
                          <p>
                            <span className="font-semibold">Arrivée:</span>{" "}
                            {container.arrival_port || "Non communiqué"}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">Dates</h4>
                          <p>
                            <span className="font-semibold">ETD:</span>{" "}
                            {formatDate(container.etd)}
                          </p>
                          <p>
                            <span className="font-semibold">ETA:</span>{" "}
                            {formatDate(container.eta)}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wide text-gray-500">Navire</h4>
                          <p>{container.vessel || "Non communiqué"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              <TabsContent value="tracking" className="mt-4">
                {trackingData ? (
                  <div className="space-y-6">
                    {isOrder ? (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-orange-500" />
                                Commande {(trackingData as OrderPayload).order.order_number}
                              </CardTitle>
                              <CardDescription>Statut détaillé de la commande scannée</CardDescription>
                            </div>
                            {isOrder && (
                              <Button
                                variant={isEditing ? "outline" : "default"}
                                onClick={() => {
                                  if (isEditing) {
                                    setIsEditing(false)
                                    setEditLocation("")
                                    setEditDescription("")
                                    setEditOperator("")
                                  } else {
                                    setIsEditing(true)
                                    const order = (trackingData as OrderPayload).order
                                    setEditStatus(order.status)
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                {isEditing ? (
                                  <>
                                    <X className="h-4 w-4" />
                                    Annuler
                                  </>
                                ) : (
                                  <>
                                    <Edit className="h-4 w-4" />
                                    Modifier le suivi
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="status">Statut</Label>
                                  <Select value={editStatus} onValueChange={setEditStatus}>
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
                                <div className="space-y-2">
                                  <Label htmlFor="location">Localisation</Label>
                                  <Input
                                    id="location"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="Ex: Port de Douala"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                  id="description"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Détails de l'événement..."
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="operator">Opérateur</Label>
                                <Input
                                  id="operator"
                                  value={editOperator}
                                  onChange={(e) => setEditOperator(e.target.value)}
                                  placeholder="Nom de l'opérateur"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveTracking} disabled={isSaving} className="flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsEditing(false)
                                    setEditLocation("")
                                    setEditDescription("")
                                    setEditOperator("")
                                  }}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations commande</h3>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <span className="font-semibold">Numéro:</span> {(trackingData as OrderPayload).order.order_number}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Service:</span> {(trackingData as OrderPayload).order.service_type}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Origine:</span> {(trackingData as OrderPayload).order.origin}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Destination:</span> {(trackingData as OrderPayload).order.destination}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Statut</h3>
                                <div className="flex flex-col gap-2">
                                  {renderStatusBadge((trackingData as OrderPayload).order.status, true)}
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Mis à jour:</span>{" "}
                                    {formatDateTime((trackingData as OrderPayload).order.updated_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{(trackingData as OrderPayload).order.client_name}</p>
                                  <p>{(trackingData as OrderPayload).order.client_email}</p>
                                  {(trackingData as OrderPayload).order.client_phone && (
                                    <p>{(trackingData as OrderPayload).order.client_phone}</p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Destinataire</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>
                                    {(trackingData as OrderPayload).order.recipient_name ||
                                      (trackingData as OrderPayload).order.client_name}
                                  </p>
                                  <p>
                                    {(trackingData as OrderPayload).order.recipient_email ||
                                      (trackingData as OrderPayload).order.client_email}
                                  </p>
                                  {((trackingData as OrderPayload).order.recipient_phone ||
                                    (trackingData as OrderPayload).order.client_phone) && (
                                    <p>
                                      {(trackingData as OrderPayload).order.recipient_phone ||
                                        (trackingData as OrderPayload).order.client_phone}
                                    </p>
                                  )}
                                  {(trackingData as OrderPayload).order.recipient_address && (
                                    <p>{(trackingData as OrderPayload).order.recipient_address}</p>
                                  )}
                                  {(
                                    (trackingData as OrderPayload).order.recipient_postal_code ||
                                    (trackingData as OrderPayload).order.recipient_city
                                  ) && (
                                    <p>
                                      {[
                                        (trackingData as OrderPayload).order.recipient_postal_code,
                                        (trackingData as OrderPayload).order.recipient_city,
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    </p>
                                  )}
                                  {(trackingData as OrderPayload).order.recipient_country && (
                                    <p>{(trackingData as OrderPayload).order.recipient_country}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {container && (
                            <div className="rounded-lg border bg-gray-50 p-6">
                              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                                    {container.code}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {containerStatusMap[container.status] || container.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(container.code)}
                                    className="flex items-center gap-2"
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/tracking?code=${container.code}`)}
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Suivre ce conteneur
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Navire</h4>
                                  <p className="font-medium text-gray-800">
                                    {container.vessel || "Non communiqué"}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Départ</h4>
                                  <p>
                                    {container.departure_port || "Non communiqué"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ETD: {formatDate(container.etd)}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Arrivée</h4>
                                  <p>
                                    {container.arrival_port || "Non communiqué"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ETA: {formatDate(container.eta)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-orange-500" />
                            Colis {(trackingData as PackagePayload).package.reference}
                          </CardTitle>
                          <CardDescription>Statut détaillé du colis scanné</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations colis</h3>
                              <div className="text-sm text-gray-600">
                                <p>
                                  <span className="font-semibold">Identifiant:</span> {(trackingData as PackagePayload).package.id}
                                </p>
                                <p>
                                  <span className="font-semibold">QR:</span> {(trackingData as PackagePayload).package.qr_code}
                                </p>
                                <p>
                                  <span className="font-semibold">Dernier scan:</span>{" "}
                                  {formatDateTime((trackingData as PackagePayload).package.last_scan_at)}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Statut</h3>
                              <div className="flex flex-col gap-2">
                                {renderStatusBadge((trackingData as PackagePayload).package.status)}
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold">Mis à jour:</span>{" "}
                                  {formatDateTime((trackingData as PackagePayload).package.updated_at)}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client</h3>
                              {(trackingData as PackagePayload).client ? (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{(trackingData as PackagePayload).client!.name}</p>
                                  {(trackingData as PackagePayload).client!.email && <p>{(trackingData as PackagePayload).client!.email}</p>}
                                  {(trackingData as PackagePayload).client!.phone && <p>{(trackingData as PackagePayload).client!.phone}</p>}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Aucun client associé</p>
                              )}
                            </div>
                          </div>

                          {container && (
                            <div className="rounded-lg border bg-gray-50 p-6">
                              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                                    {container.code}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {containerStatusMap[container.status] || container.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(container.code)}
                                    className="flex items-center gap-2"
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/tracking?code=${container.code}`)}
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Suivre ce conteneur
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Navire</h4>
                                  <p className="font-medium text-gray-800">
                                    {container.vessel || "Non communiqué"}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Départ</h4>
                                  <p>
                                    {container.departure_port || "Non communiqué"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ETD: {formatDate(container.etd)}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-xs uppercase tracking-wide text-gray-500">Arrivée</h4>
                                  <p>
                                    {container.arrival_port || "Non communiqué"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ETA: {formatDate(container.eta)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {(trackingData as PackagePayload).package.description && (
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold">Description:</span> {(trackingData as PackagePayload).package.description}
                            </div>
                          )}
                          {((trackingData as PackagePayload).package.weight || (trackingData as PackagePayload).package.value) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                              {(trackingData as PackagePayload).package.weight && (
                                <div>
                                  <span className="font-semibold">Poids:</span> {(trackingData as PackagePayload).package.weight} kg
                                </div>
                              )}
                              {(trackingData as PackagePayload).package.value && (
                                <div>
                                  <span className="font-semibold">Valeur:</span>{" "}
                                  €{((trackingData as PackagePayload).package.value || 0).toLocaleString("fr-FR")}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          Historique des événements
                        </CardTitle>
                        <CardDescription>
                          {isOrder 
                            ? "Événements de suivi de la commande (le plus récent en premier)."
                            : "Événements remontés depuis le conteneur associé (le plus récent en premier)."
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {timeline.length > 0 ? (
                          <div className="space-y-4">
                            {timeline.map((event) => (
                              <div key={event.id} className="rounded-lg border p-4 bg-white shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  {renderStatusBadge(event.status, isOrder)}
                                  <span className="text-sm text-gray-500">{formatDateTime(event.event_date)}</span>
                                </div>
                                {event.location && (
                                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </div>
                                )}
                                {event.description && (
                                  <p className="mt-2 text-sm text-gray-700 leading-6">{event.description}</p>
                                )}
                                {event.operator && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Opérateur: <span className="font-medium">{event.operator}</span>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <AlertTriangle className="h-8 w-8 text-gray-400" />
                              <p className="text-sm font-medium text-gray-700">
                                {isOrder ? "Aucun événement de suivi" : "Aucun événement de suivi disponible"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isOrder 
                                  ? "Aucun événement de suivi n'a été enregistré pour cette commande pour le moment."
                                  : "Aucun événement de suivi disponible pour ce conteneur pour le moment."
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Le suivi affiche les informations du colis lié au QR et les événements associés au conteneur.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-sm text-gray-600">Chargement des informations du colis...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!trackingData && !isLoading && !error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-800">Scannez un QR Danemo</h3>
                <p className="text-sm text-gray-600">
                  Vous pouvez utiliser la caméra ou coller un jeton alphanumérique, une URL ou un payload JSON d&apos;un
                  QR code exporté depuis nos documents proforma/factures.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


