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
import { Copy, MapPin, QrCode, RefreshCw, Search, Timer, Truck, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"

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
  const [trackingData, setTrackingData] = useState<PackagePayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tracking")

  const qrDisplay = useMemo(() => decoded.qrCode || "", [decoded])
  const container = trackingData?.container ?? null

  useEffect(() => {
    if (initialPayload) {
      handleDecode(initialPayload)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTrackingData = async (qrCode: string) => {
    if (!qrCode) return
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/packages/${encodeURIComponent(qrCode)}`)
      const json = await res.json()
      if (!json.success) {
        setTrackingData(null)
        setError(json.error || "Aucun colis trouvé pour ce QR code")
        return
      }
      setTrackingData(json.data)
      setActiveTab(json.data?.container ? "container" : "tracking")
    } catch (err) {
      console.error("Failed to fetch QR tracking data:", err)
      setError("Impossible de récupérer les informations du colis.")
    } finally {
      setIsLoading(false)
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

  const renderStatusBadge = (status: string) => {
    const config = packageStatusMap[status] || {
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
            Scannez ou collez un QR Danemo pour obtenir le statut du colis et l&apos;historique détaillé.
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
                <TabsTrigger value="raw">Contenu brut</TabsTrigger>
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
                <div className="text-sm text-gray-500">
                  Le suivi affiche les informations du colis lié au QR et les événements associés au conteneur.
                </div>
              </TabsContent>
              <TabsContent value="raw" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Payload décodé</CardTitle>
                    <CardDescription>
                      Valeur brute interprétée depuis le QR (JSON, URL ou jeton). Vous pouvez copier et partager avec le
                      support.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs overflow-auto max-h-72">
                      {decoded.decoded || "(vide)"}
                    </pre>
                  </CardContent>
                </Card>
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

        {trackingData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Colis {trackingData.package.reference}
                </CardTitle>
                <CardDescription>Statut détaillé du colis scanné</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Informations colis</h3>
                    <div className="text-sm text-gray-600">
                      <p>
                        <span className="font-semibold">Identifiant:</span> {trackingData.package.id}
                      </p>
                      <p>
                        <span className="font-semibold">QR:</span> {trackingData.package.qr_code}
                      </p>
                      <p>
                        <span className="font-semibold">Dernier scan:</span>{" "}
                        {formatDateTime(trackingData.package.last_scan_at)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Statut</h3>
                    <div className="flex flex-col gap-2">
                      {renderStatusBadge(trackingData.package.status)}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Mis à jour:</span>{" "}
                        {formatDateTime(trackingData.package.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client</h3>
                    {trackingData.client ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{trackingData.client.name}</p>
                        {trackingData.client.email && <p>{trackingData.client.email}</p>}
                        {trackingData.client.phone && <p>{trackingData.client.phone}</p>}
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

                {trackingData.package.description && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Description:</span> {trackingData.package.description}
                  </div>
                )}
                {(trackingData.package.weight || trackingData.package.value) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    {trackingData.package.weight && (
                      <div>
                        <span className="font-semibold">Poids:</span> {trackingData.package.weight} kg
                      </div>
                    )}
                    {trackingData.package.value && (
                      <div>
                        <span className="font-semibold">Valeur:</span>{" "}
                        €{trackingData.package.value.toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Historique des événements
                </CardTitle>
                <CardDescription>
                  Événements remontés depuis le conteneur associé (le plus récent en premier).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="rounded-lg border p-4 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <Badge variant="outline" className="w-fit">
                            {event.status}
                          </Badge>
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
                  <div className="py-12 text-center text-sm text-gray-500">
                    Aucun événement de suivi disponible pour ce conteneur pour le moment.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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


