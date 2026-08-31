"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Send, Ship, Users } from "lucide-react"

type MessageMode = "all" | "container" | "city"
type MessageChannel = "sms" | "whatsapp"

interface ContainerOption {
  id: string
  code: string
  etd?: string | null
  eta?: string | null
  departure_port?: string | null
  arrival_port?: string | null
  status?: string | null
}

interface PreviewState {
  recipients: number
  sample: Array<{ name: string; phone: string }>
}

const defaultMessage =
  "Bonjour {{nom}}, un conteneur Danemo est bientot au depart. Si vous avez des colis a envoyer, merci de venir les deposer rapidement a notre depot. Danemo"

export default function AdminMessagesPage() {
  const [mode, setMode] = useState<MessageMode>("all")
  const [channel, setChannel] = useState<MessageChannel>("sms")
  const [containers, setContainers] = useState<ContainerOption[]>([])
  const [containerId, setContainerId] = useState("")
  const [city, setCity] = useState("")
  const [message, setMessage] = useState(defaultMessage)
  const [transactional, setTransactional] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedContainer = useMemo(
    () => containers.find((container) => container.id === containerId),
    [containers, containerId],
  )

  useEffect(() => {
    fetch("/api/containers", { credentials: "include" })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setContainers(result.data || [])
          if (result.data?.[0]?.id) setContainerId(result.data[0].id)
        }
      })
      .catch(() => setContainers([]))
  }, [])

  useEffect(() => {
    setPreview(null)
    setSuccess("")
  }, [mode, channel, containerId, city, transactional])

  const buildParams = () => {
    const params = new URLSearchParams()
    params.set("mode", mode)
    params.set("channel", channel)
    params.set("transactional", String(transactional))
    if (mode === "container") params.set("container_id", containerId)
    if (mode === "city") params.set("city", city)
    return params
  }

  const canPreview = mode !== "container" || Boolean(containerId)
  const canSend = canPreview && message.trim().length >= 10 && Boolean(preview?.recipients)

  const loadPreview = async () => {
    setError("")
    setSuccess("")
    if (!canPreview) {
      setError("Selectionnez un conteneur.")
      return
    }
    setIsPreviewLoading(true)
    try {
      const response = await fetch(`/api/admin/messages/send?${buildParams().toString()}`, {
        credentials: "include",
      })
      const result = await response.json()
      if (!result.success) {
        setError(result.error || "Impossible de calculer les destinataires")
        setPreview(null)
        return
      }
      setPreview(result.data)
    } catch {
      setError("Erreur de connexion")
      setPreview(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const sendMessage = async () => {
    setError("")
    setSuccess("")
    setIsSending(true)
    try {
      const response = await fetch("/api/admin/messages/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          channel,
          message,
          transactional,
          container_id: mode === "container" ? containerId : undefined,
          city: mode === "city" ? city : undefined,
        }),
      })
      const result = await response.json()
      if (!result.success && !result.data) {
        setError(result.error || "Envoi impossible")
        return
      }
      const data = result.data
      setSuccess(`${data.sent} message(s) envoye(s), ${data.failed} echec(s).`)
      await loadPreview()
      if (data.failed > 0 && data.errors?.[0]?.error) {
        setError(data.errors[0].error)
      }
    } catch {
      setError("Erreur de connexion")
    } finally {
      setIsSending(false)
    }
  }

  const applyContainerTemplate = () => {
    const code = selectedContainer?.code ? ` ${selectedContainer.code}` : ""
    const departure = selectedContainer?.etd
      ? ` Depart prevu le ${new Date(selectedContainer.etd).toLocaleDateString("fr-BE")}.`
      : ""
    setMessage(
      `Bonjour {{nom}}, le conteneur Danemo${code} sera bientot charge.${departure} Si vous avez des colis a envoyer, merci de venir les deposer rapidement a notre depot. Danemo`,
    )
  }

  return (
    <AdminLayout title="Messages clients">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destinataires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{preview?.recipients ?? "-"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canal</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold uppercase">{channel}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Segment</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode === "all" ? "Tous" : mode === "container" ? "Conteneur" : "Ville"}
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Campagne de notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={channel} onValueChange={(value) => setChannel(value as MessageChannel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Segment</Label>
                <Select value={mode} onValueChange={(value) => setMode(value as MessageMode)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients opt-in</SelectItem>
                    <SelectItem value="container">Clients d'un conteneur</SelectItem>
                    <SelectItem value="city">Clients par ville</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={transactional ? "transactional" : "marketing"} onValueChange={(value) => setTransactional(value === "transactional")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Newsletter opt-in</SelectItem>
                    <SelectItem value="transactional">Transactionnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "container" && (
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label>Conteneur</Label>
                  <Select value={containerId} onValueChange={setContainerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selectionner un conteneur" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((container) => (
                        <SelectItem key={container.id} value={container.id}>
                          {container.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" onClick={applyContainerTemplate}>
                  <Ship className="h-4 w-4 mr-2" />
                  Modele depart
                </Button>
              </div>
            )}

            {mode === "city" && (
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                className="text-base sm:text-sm"
              />
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Variable disponible: {"{{nom}}"}</span>
                <span>{message.length}/1000</span>
              </div>
            </div>

            {preview?.sample?.length ? (
              <div className="flex flex-wrap gap-2">
                {preview.sample.map((recipient) => (
                  <Badge key={recipient.phone} variant="secondary">
                    {recipient.name} - {recipient.phone}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={loadPreview} disabled={isPreviewLoading || !canPreview}>
                {isPreviewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                Apercu destinataires
              </Button>
              <Button type="button" onClick={sendMessage} disabled={isSending || !canSend}>
                {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Envoyer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
