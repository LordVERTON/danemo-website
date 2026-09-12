"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, Loader2, MapPin, QrCode, ScanLine } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getAllowedNextOrderStatuses,
  getOrderStatusActionLabel,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status"

type ScannedOrder = {
  id: string
  order_number: string
  qr_code?: string | null
  status: OrderStatus
  client_name?: string | null
  recipient_name?: string | null
  service_type?: string | null
  description?: string | null
  origin?: string | null
  destination?: string | null
  weight?: number | null
  parcels_count?: number | null
}

function QrAdminContent() {
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const [code, setCode] = useState(searchParams.get("code") || "")
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null)
  const [status, setStatus] = useState<OrderStatus | "">("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  async function suggestCityFromIp() {
    setError("")
    setIsLocating(true)
    try {
      const response = await fetch("/api/locations/city")
      const payload = await response.json()
      if (!response.ok || !payload.success || !payload.data?.city) {
        throw new Error(payload.error || "Aucune ville n’a été trouvée pour cette adresse IP.")
      }
      setLocation(payload.data.city)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de suggérer la ville. Saisissez-la manuellement.")
    } finally {
      setIsLocating(false)
    }
  }

  function closeCamera() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  async function openCamera() {
    setError("")
    if (!("mediaDevices" in navigator)) { setError("La caméra n’est pas disponible dans ce navigateur."); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraOpen(true)
      const Detector = (window as any).BarcodeDetector
      if (!Detector) { setError("La détection automatique n’est pas prise en charge ici. Saisissez le code manuellement."); return }
      const detector = new Detector({ formats: ["qr_code"] })
      const detect = async () => {
        if (!videoRef.current || !streamRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) { setCode(codes[0].rawValue); closeCamera(); return }
        } catch { /* la caméra peut ne pas être prête sur la première image */ }
        frameRef.current = requestAnimationFrame(detect)
      }
      frameRef.current = requestAnimationFrame(detect)
    } catch { setError("Impossible d’accéder à la caméra. Vérifiez l’autorisation du navigateur.") }
  }

  useEffect(() => () => closeCamera(), [])

  const nextStatuses = scannedOrder ? getAllowedNextOrderStatuses(scannedOrder.status) : []

  function resetScan() {
    setCode("")
    setScannedOrder(null)
    setStatus("")
    setLocation("")
    setDescription("")
    setResult(null)
    setError("")
  }

  async function findOrder() {
    const lookupCode = code.trim()
    if (!lookupCode) {
      setError("Saisissez ou scannez un code QR avant de rechercher la commande.")
      return
    }

    setLookingUp(true)
    setError("")
    setResult(null)
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(lookupCode)}`)
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || "Commande introuvable")
      const order = payload.data?.order || payload.data
      if (!order?.id) throw new Error("Commande introuvable")

      setScannedOrder(order)
      setStatus(getAllowedNextOrderStatuses(order.status)[0] || "")
    } catch (cause: any) {
      setScannedOrder(null)
      setStatus("")
      setError(cause?.message || "Impossible d’identifier la commande")
    } finally {
      setLookingUp(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!scannedOrder || !status) {
      setError("Identifiez une commande puis choisissez une action autorisée.")
      return
    }
    setSaving(true); setError(""); setResult(null)
    try {
      const response = await fetch("/api/qr/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr: scannedOrder.qr_code || scannedOrder.order_number, status, location, description }) })
      const payload = await response.json()
      if (!payload.success) throw new Error(payload.error || "Scan impossible")
      setResult(payload.data)
      setScannedOrder(payload.data.item)
      setStatus(getAllowedNextOrderStatuses(payload.data.item.status)[0] || "")
    } catch (cause: any) { setError(cause?.message || "Scan impossible") } finally { setSaving(false) }
  }

  return (
    <AdminLayout title="Scan QR">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="size-5 text-orange-600" />Scanner une commande</CardTitle>
            <CardDescription>1. Identifiez la commande. 2. Choisissez uniquement l’action autorisée pour son avancement.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>1. Code QR ou numéro de commande</Label>
                <div className="flex gap-2">
                  <Input required value={code} onChange={(event) => { setCode(event.target.value); setScannedOrder(null); setStatus(""); setResult(null) }} placeholder="ORD-…" />
                  <Button type="button" variant="outline" onClick={cameraOpen ? closeCamera : openCamera} aria-label={cameraOpen ? "Fermer la caméra" : "Ouvrir la caméra"}><Camera className="size-4" /></Button>
                </div>
              </div>
              <Button type="button" className="w-full" variant="outline" onClick={findOrder} disabled={lookingUp || !code.trim()}>
                {lookingUp ? <Loader2 className="mr-2 size-4 animate-spin" /> : <QrCode className="mr-2 size-4" />}
                Identifier la commande
              </Button>

              {scannedOrder && (
                <fieldset className="space-y-4 border-t pt-4">
                  <div>
                    <Label>2. Action suivante autorisée</Label>
                    {nextStatuses.length > 0 ? (
                      <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                        <SelectTrigger><SelectValue placeholder="Choisir une action" /></SelectTrigger>
                        <SelectContent>
                          {nextStatuses.map((nextStatus) => (
                            <SelectItem key={nextStatus} value={nextStatus}>
                              {getOrderStatusActionLabel(nextStatus)} — {ORDER_STATUS_LABELS[nextStatus]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Cette commande est clôturée : aucune nouvelle transition de statut n’est disponible.</p>
                    )}
                  </div>
                  {nextStatuses.length > 0 && <>
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <div className="flex gap-2">
                        <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Entrepôt, port, gare ou agence…" />
                        <Button type="button" variant="outline" onClick={suggestCityFromIp} disabled={isLocating} className="shrink-0" aria-label="Suggérer la ville depuis mon adresse IP">
                          {isLocating ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                          <span className="hidden sm:inline">Suggérer la ville</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">La ville est estimée depuis l’adresse IP de l’appareil. Cette estimation peut être imprécise ; vous pouvez la modifier et préciser l’entrepôt, le port ou la gare.</p>
                    </div>
                    <div><Label>Note (facultative)</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Information ajoutée au suivi" /></div>
                    <Button className="w-full" disabled={saving || !status}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ScanLine className="mr-2 size-4" />}{status ? getOrderStatusActionLabel(status) : "Choisir une action"}</Button>
                  </>}
                </fieldset>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Détails de la commande</CardTitle><CardDescription>La lecture caméra utilise les capacités natives du navigateur.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {cameraOpen && <video ref={videoRef} className="aspect-video w-full rounded-lg bg-slate-950 object-cover" muted playsInline />}
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {result && <div className="rounded-lg border border-green-200 bg-green-50 p-4"><Badge>Suivi mis à jour</Badge><p className="mt-3 font-medium">{result.item.order_number}</p><p className="text-sm text-muted-foreground">Nouveau statut : {ORDER_STATUS_LABELS[result.item.status as OrderStatus]}</p></div>}
            {scannedOrder && <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{scannedOrder.order_number}</p><p className="text-muted-foreground">Statut actuel : {ORDER_STATUS_LABELS[scannedOrder.status]}</p></div><Badge variant="secondary">{ORDER_STATUS_LABELS[scannedOrder.status]}</Badge></div>
              <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-muted-foreground">Client</p><p>{scannedOrder.client_name || "—"}</p></div><div><p className="text-muted-foreground">Destinataire</p><p>{scannedOrder.recipient_name || "—"}</p></div><div><p className="text-muted-foreground">Trajet</p><p>{[scannedOrder.origin, scannedOrder.destination].filter(Boolean).join(" → ") || "—"}</p></div><div><p className="text-muted-foreground">Colis</p><p>{scannedOrder.parcels_count || 1} colis{scannedOrder.weight ? ` · ${scannedOrder.weight} kg` : ""}</p></div></div>
              {scannedOrder.description && <div><p className="text-muted-foreground">Description</p><p>{scannedOrder.description}</p></div>}
              {nextStatuses.length > 0 && <p className="border-t pt-3 text-muted-foreground">Prochaine action : <span className="font-medium text-foreground">{getOrderStatusActionLabel(nextStatuses[0])}</span></p>}
            </div>}
            {result && <Button type="button" variant="outline" className="w-full" onClick={resetScan}>Scanner une autre commande</Button>}
            {!cameraOpen && !scannedOrder && !result && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground"><QrCode className="mb-3 size-8" /><p>Scannez un code, puis identifiez la commande avant de choisir l’action suivante.</p></div>}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default function QrAdminPage() {
  return <Suspense fallback={<AdminLayout title="Scan QR"><div className="flex h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div></AdminLayout>}><QrAdminContent /></Suspense>
}
