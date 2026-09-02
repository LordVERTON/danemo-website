"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, Loader2, QrCode, ScanLine } from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

function QrAdminContent() {
  const searchParams = useSearchParams()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const [code, setCode] = useState(searchParams.get("code") || "")
  const [status, setStatus] = useState("in_progress")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [cameraOpen, setCameraOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

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

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setError(""); setResult(null)
    try {
      const response = await fetch("/api/qr/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qr: code, status, location, description }) })
      const payload = await response.json()
      if (!payload.success) throw new Error(payload.error || "Scan impossible")
      setResult(payload.data)
    } catch (cause: any) { setError(cause?.message || "Scan impossible") } finally { setSaving(false) }
  }

  return <AdminLayout title="Scan QR"><div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="size-5 text-orange-600" />Scanner un colis ou une commande</CardTitle><CardDescription>Le statut ne change qu’après votre confirmation.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div><Label>Code QR</Label><div className="flex gap-2"><Input required value={code} onChange={(event) => setCode(event.target.value)} placeholder="ORD-… ou code colis" /><Button type="button" variant="outline" onClick={cameraOpen ? closeCamera : openCamera}><Camera className="size-4" /></Button></div></div><div><Label>Nouveau statut</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">En attente</SelectItem><SelectItem value="confirmed">Confirmée</SelectItem><SelectItem value="in_progress">En cours</SelectItem><SelectItem value="completed">Terminée</SelectItem><SelectItem value="preparation">Préparation (colis)</SelectItem><SelectItem value="en_transit">En transit (colis)</SelectItem><SelectItem value="livre">Livré (colis)</SelectItem></SelectContent></Select></div><div><Label>Localisation</Label><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Bruxelles, port, agence…" /></div><div><Label>Note</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Information ajoutée au suivi" /></div><Button className="w-full" disabled={saving}>{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ScanLine className="mr-2 size-4" />}Valider le scan</Button></form></CardContent></Card><Card><CardHeader><CardTitle>Caméra et résultat</CardTitle><CardDescription>La lecture caméra utilise les capacités natives du navigateur.</CardDescription></CardHeader><CardContent className="space-y-4">{cameraOpen && <video ref={videoRef} className="aspect-video w-full rounded-lg bg-slate-950 object-cover" muted playsInline />}{error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{result && <div className="rounded-lg border border-green-200 bg-green-50 p-4"><Badge>Scan enregistré</Badge><p className="mt-3 font-medium">{result.type === "order" ? result.item.order_number : result.item.reference}</p><p className="text-sm text-muted-foreground">Statut : {result.item.status}</p></div>}{!cameraOpen && !result && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground"><QrCode className="mb-3 size-8" /><p>Saisissez un code ou ouvrez la caméra.</p></div>}</CardContent></Card></div></AdminLayout>
}

export default function QrAdminPage() {
  return <Suspense fallback={<AdminLayout title="Scan QR"><div className="flex h-64 items-center justify-center"><Loader2 className="size-7 animate-spin text-orange-600" /></div></AdminLayout>}><QrAdminContent /></Suspense>
}
