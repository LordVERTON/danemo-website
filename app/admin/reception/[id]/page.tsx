"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Loader2, PackageCheck, Printer, Send, ShieldAlert } from "lucide-react"

import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/use-current-user"

const steps = [
  ["Accueil", "Accueil, déchargement et assistance"],
  ["Client", "Formulaire et coordonnées"],
  ["Conditionnement", "Colis, mesures et protection"],
  ["Envoi", "Destinataire et trajet"],
  ["Tarif", "Prix négocié et règlement"],
  ["Création", "Commande et étiquette"],
  ["Suivi", "Explication au client"],
  ["Clôture", "Vérification finale"],
] as const

type Workflow = {
  id: string
  customer_id: string | null
  order_id: string | null
  status: "in_progress" | "blocked" | "completed"
  current_step: number
  draft: Record<string, unknown>
  created_by_email: string | null
  started_at: string
  completed_at: string | null
  updated_at: string
}

type Incident = {
  status: "reported" | "acknowledged" | "resolved"
  description: string
  resolution: string | null
  reported_at: string
}

type Customer = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
}

function draftValue(draft: Record<string, unknown>, key: string) {
  const value = draft[key]
  return typeof value === "string" ? value : ""
}

function draftChecked(draft: Record<string, unknown>, key: string) {
  return draft[key] === true
}

export default function ReceptionWorkflowPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useCurrentUser()
  const workflowId = params.id
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [incident, setIncident] = useState<Incident | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [problemText, setProblemText] = useState("")
  const [resolutionText, setResolutionText] = useState("")

  const currentStep = workflow?.current_step || 1
  const selectedCustomerId = draftValue(draft, "existing_customer_id") || "new"

  const loadWorkflow = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [workflowResponse, customersResponse] = await Promise.all([
        fetch(`/api/receptions/${encodeURIComponent(workflowId)}`, { cache: "no-store" }),
        fetch("/api/customers", { cache: "no-store" }),
      ])
      const workflowResult = await workflowResponse.json()
      const customersResult = await customersResponse.json()
      if (!workflowResponse.ok || !workflowResult.success) throw new Error(workflowResult.error || "Chargement impossible")
      const loadedWorkflow = workflowResult.data.workflow as Workflow
      setWorkflow(loadedWorkflow)
      setDraft(loadedWorkflow.draft || {})
      setIncident(workflowResult.data.incident as Incident | null)
      if (customersResponse.ok && customersResult.success && Array.isArray(customersResult.data)) setCustomers(customersResult.data as Customer[])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible")
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => { void loadWorkflow() }, [loadWorkflow])

  const selectedCustomer = useMemo(() => customers.find((customer) => customer.id === selectedCustomerId) || null, [customers, selectedCustomerId])

  function updateDraft(key: string, value: string | boolean) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function patchWorkflow(payload: Record<string, unknown>) {
    const response = await fetch(`/api/receptions/${encodeURIComponent(workflowId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok || !result.success) throw new Error(result.error || "Enregistrement impossible")
    if (result.data.workflow) setWorkflow(result.data.workflow as Workflow)
    if (result.data.incident) setIncident(result.data.incident as Incident)
    return result.data
  }

  function validateCurrentStep() {
    const requiredByStep: Record<number, string[]> = {
      2: selectedCustomerId === "new" ? ["customer_name", "customer_phone", "customer_address", "customer_city", "customer_postal_code", "customer_country"] : [],
      3: ["parcels_count", "observed_weight", "protection_type"],
      4: ["recipient_name", "recipient_address", "recipient_city", "recipient_country", "service_type", "origin", "destination", "description"],
      5: ["initial_price", "final_price", "payment_method"],
      7: ["notification_channel"],
    }
    const missing = (requiredByStep[currentStep] || []).some((key) => !draftValue(draft, key).trim())
    if (missing) {
      setError("Complétez les champs obligatoires de cette étape avant de continuer.")
      return false
    }
    if (currentStep === 8 && !draftChecked(draft, "closing_confirmed")) {
      setError("Confirmez la clôture de la réception avant de terminer.")
      return false
    }
    if (currentStep === 7 && !draftChecked(draft, "tracking_explained")) {
      setError("Expliquez au client comment suivre son colis avant de continuer.")
      return false
    }
    if (currentStep === 6 && !workflow?.order_id) {
      setError("Créez la commande avant de poursuivre.")
      return false
    }
    return true
  }

  async function goForward() {
    if (!workflow || !validateCurrentStep()) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const isComplete = currentStep === 8
      const nextStep = Math.min(8, currentStep + 1)
      await patchWorkflow({
        draft,
        current_step: nextStep,
        status: isComplete ? "completed" : "in_progress",
        step_event: { step: currentStep, state: "done" },
      })
      setSuccess(isComplete ? "Réception clôturée. Le brouillon et ses étapes sont conservés." : "Étape enregistrée.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible")
    } finally {
      setSaving(false)
    }
  }

  async function goBack() {
    if (!workflow || currentStep === 1) return
    setSaving(true)
    setError("")
    try {
      await patchWorkflow({ draft, current_step: currentStep - 1 })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible")
    } finally {
      setSaving(false)
    }
  }

  async function reportProblem() {
    if (!problemText.trim()) {
      setError("Décrivez le problème avant de le signaler.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await patchWorkflow({
        draft,
        status: "blocked",
        step_event: { step: currentStep, state: "blocked", note: problemText.trim() },
        incident: { action: "report", description: problemText.trim() },
      })
      setProblemText("")
      setSuccess("Problème signalé au responsable. La réception est marquée comme bloquée.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Signalement impossible")
    } finally {
      setSaving(false)
    }
  }

  async function handleIncident(action: "acknowledge" | "resolve") {
    if (action === "resolve" && !resolutionText.trim()) {
      setError("Ajoutez la résolution avant de clôturer l’incident.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await patchWorkflow({
        ...(action === "resolve" ? { status: "in_progress" } : {}),
        incident: { action, resolution: resolutionText.trim() || undefined },
      })
      setSuccess(action === "resolve" ? "Incident résolu." : "Incident pris en compte.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible")
    } finally {
      setSaving(false)
    }
  }

  async function createOrder() {
    if (!workflow) return
    const requiredBeforeCreation = selectedCustomerId === "new"
      ? ["customer_name", "customer_phone", "customer_address", "customer_city", "customer_postal_code", "customer_country", "parcels_count", "observed_weight", "protection_type", "recipient_name", "recipient_address", "recipient_city", "recipient_country", "service_type", "origin", "destination", "description", "initial_price", "final_price", "payment_method"]
      : ["parcels_count", "observed_weight", "protection_type", "recipient_name", "recipient_address", "recipient_city", "recipient_country", "service_type", "origin", "destination", "description", "initial_price", "final_price", "payment_method"]
    if (requiredBeforeCreation.some((key) => !draftValue(draft, key).trim())) {
      setError("Complétez les étapes Client, Conditionnement, Envoi et Tarif avant de créer la commande.")
      return
    }
    setCreatingOrder(true)
    setError("")
    try {
      let customer = selectedCustomer
      if (!customer) {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draftValue(draft, "customer_name"), email: draftValue(draft, "customer_email"), phone: draftValue(draft, "customer_phone"),
            address: draftValue(draft, "customer_address"), city: draftValue(draft, "customer_city"), postal_code: draftValue(draft, "customer_postal_code"), country: draftValue(draft, "customer_country"),
          }),
        })
        const customerResult = await customerResponse.json()
        if (!customerResponse.ok || !customerResult.success) throw new Error(customerResult.error || "Impossible de créer le client")
        customer = customerResult.data as Customer
      }

      await patchWorkflow({ draft, customer_id: customer.id })
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id, client_name: customer.name, client_email: customer.email || "", client_phone: customer.phone || "",
          client_address: customer.address || "", client_city: customer.city || "", client_postal_code: customer.postal_code || "", client_country: customer.country || "",
          recipient_name: draftValue(draft, "recipient_name"), recipient_email: draftValue(draft, "recipient_email"), recipient_phone: draftValue(draft, "recipient_phone"),
          recipient_address: draftValue(draft, "recipient_address"), recipient_city: draftValue(draft, "recipient_city"), recipient_postal_code: draftValue(draft, "recipient_postal_code"), recipient_country: draftValue(draft, "recipient_country"),
          service_type: draftValue(draft, "service_type"), origin: draftValue(draft, "origin"), destination: draftValue(draft, "destination"), description: draftValue(draft, "description"),
          weight: draftValue(draft, "observed_weight"), value: draftValue(draft, "final_price"), parcels_count: draftValue(draft, "parcels_count"),
        }),
      })
      const orderResult = await orderResponse.json()
      if (!orderResponse.ok || !orderResult.success) throw new Error(orderResult.error || "Impossible de créer la commande")
      const createdOrder = orderResult.data as { id: string; order_number: string }
      await patchWorkflow({ draft: { ...draft, order_number: createdOrder.order_number }, order_id: createdOrder.id, current_step: 7, step_event: { step: 6, state: "done", note: `Commande ${createdOrder.order_number} créée` } })
      setSuccess(`Commande ${createdOrder.order_number} créée. Imprimez l’étiquette depuis la fiche client avant de poursuivre.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible")
    } finally {
      setCreatingOrder(false)
    }
  }

  function field(label: string, key: string, props: ComponentProps<typeof Input> = {}) {
    return <div><Label htmlFor={key}>{label}</Label><Input id={key} className="mt-1" value={draftValue(draft, key)} onChange={(event) => updateDraft(key, event.target.value)} {...props} /></div>
  }

  if (loading) return <AdminLayout title="Réception Bruxelles"><div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement de la réception…</div></AdminLayout>
  if (!workflow) return <AdminLayout title="Réception Bruxelles"><Card><CardContent className="p-6"><p className="text-red-700">{error || "Réception introuvable."}</p><Button asChild className="mt-4"><Link href="/admin/reception">Retour aux réceptions</Link></Button></CardContent></Card></AdminLayout>

  return (
    <AdminLayout title="Réception Bruxelles">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="outline"><Link href="/admin/reception"><ArrowLeft className="size-4" />Réceptions</Link></Button><Badge variant={workflow.status === "blocked" ? "destructive" : workflow.status === "completed" ? "secondary" : "outline"}>{workflow.status === "blocked" ? "Bloquée" : workflow.status === "completed" ? "Clôturée" : "Brouillon en cours"}</Badge></div>

        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-8" aria-label="Progression de la réception">
          {steps.map(([label], index) => { const step = index + 1; const active = step === currentStep; const done = step < currentStep || workflow.status === "completed"; return <li key={label} className={`min-h-12 rounded-lg border px-1 py-2 text-center text-xs ${active ? "border-orange-500 bg-orange-50 font-semibold text-orange-800" : done ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 text-slate-500"}`}><span className="block text-[10px]">{step}</span><span className="block truncate">{label}</span></li> })}
        </ol>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {success && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</div>}

        {incident && <Card className="border-amber-300 bg-amber-50/50"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="size-5 text-amber-700" />Incident {incident.status === "reported" ? "signalé" : incident.status === "acknowledged" ? "pris en compte" : "résolu"}</CardTitle><CardDescription>{incident.description}</CardDescription></CardHeader>{user?.role === "admin" && incident.status !== "resolved" && <CardContent className="space-y-3">{incident.status === "reported" && <Button type="button" variant="outline" disabled={saving} onClick={() => void handleIncident("acknowledge")}>Prendre en compte</Button>}<div><Label htmlFor="incident-resolution">Résolution</Label><Textarea id="incident-resolution" className="mt-1" value={resolutionText} onChange={(event) => setResolutionText(event.target.value)} placeholder="Décision ou action du responsable" /></div><Button type="button" disabled={saving} onClick={() => void handleIncident("resolve")}>Clôturer l’incident</Button></CardContent>}</Card>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-orange-600" />Étape {currentStep} · {steps[currentStep - 1][0]}</CardTitle><CardDescription>{steps[currentStep - 1][1]}. Les informations sont enregistrées lorsque vous passez à l’étape suivante.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {currentStep === 1 && <div className="grid gap-4 sm:grid-cols-2">{field("Heure d’arrivée", "arrival_time", { type: "datetime-local" })}<div><Label htmlFor="assistance">Assistance au déchargement</Label><Select value={draftValue(draft, "assistance") || "none"} onValueChange={(value) => updateDraft("assistance", value)}><SelectTrigger id="assistance" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucune</SelectItem><SelectItem value="unloading">Déchargement aidé</SelectItem><SelectItem value="special">Besoin particulier</SelectItem></SelectContent></Select></div><div className="sm:col-span-2"><Label htmlFor="welcome_note">Note d’accueil</Label><Textarea id="welcome_note" className="mt-1" value={draftValue(draft, "welcome_note")} onChange={(event) => updateDraft("welcome_note", event.target.value)} placeholder="Demande du client, aide fournie, information utile" /></div></div>}
            {currentStep === 2 && <div className="space-y-4"><div><Label htmlFor="existing_customer_id">Client</Label><Select value={selectedCustomerId} onValueChange={(value) => updateDraft("existing_customer_id", value)}><SelectTrigger id="existing_customer_id" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">Nouveau client</SelectItem>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name} · {customer.email || customer.phone || "sans contact"}</SelectItem>)}</SelectContent></Select></div>{selectedCustomer ? <p className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">Les coordonnées de {selectedCustomer.name} seront reprises pour l’expéditeur.</p> : <div className="grid gap-4 sm:grid-cols-2">{field("Nom complet *", "customer_name", { autoComplete: "name" })}{field("E-mail", "customer_email", { type: "email", autoComplete: "email" })}{field("Téléphone *", "customer_phone", { type: "tel", autoComplete: "tel" })}{field("Adresse *", "customer_address", { autoComplete: "street-address" })}{field("Ville *", "customer_city", { autoComplete: "address-level2" })}{field("Code postal *", "customer_postal_code", { autoComplete: "postal-code" })}<div className="sm:col-span-2">{field("Pays *", "customer_country", { autoComplete: "country-name" })}</div></div>}</div>}
            {currentStep === 3 && <div className="grid gap-4 sm:grid-cols-2">{field("Nombre de colis *", "parcels_count", { type: "number", min: 1, inputMode: "numeric" })}{field("Poids constaté (kg) *", "observed_weight", { type: "number", min: 0, step: "0.01", inputMode: "decimal" })}{field("Dimensions", "dimensions", { placeholder: "L × l × h" })}<div><Label htmlFor="protection_type">Protection *</Label><Select value={draftValue(draft, "protection_type")} onValueChange={(value) => updateDraft("protection_type", value)}><SelectTrigger id="protection_type" className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent><SelectItem value="film">Filmage</SelectItem><SelectItem value="carton">Carton renforcé</SelectItem><SelectItem value="palette">Palette</SelectItem><SelectItem value="other">Autre protection</SelectItem></SelectContent></Select></div><div className="sm:col-span-2"><Label htmlFor="packing_anomaly">Anomalies ou accord client</Label><Textarea id="packing_anomaly" className="mt-1" value={draftValue(draft, "packing_anomaly")} onChange={(event) => updateDraft("packing_anomaly", event.target.value)} placeholder="État constaté, réserve, accord donné…" /></div></div>}
            {currentStep === 4 && <div className="grid gap-4 sm:grid-cols-2">{field("Nom du destinataire *", "recipient_name", { autoComplete: "name" })}{field("E-mail du destinataire", "recipient_email", { type: "email", autoComplete: "email" })}{field("Téléphone du destinataire", "recipient_phone", { type: "tel", autoComplete: "tel" })}{field("Adresse *", "recipient_address", { autoComplete: "street-address" })}{field("Ville *", "recipient_city", { autoComplete: "address-level2" })}{field("Code postal", "recipient_postal_code", { autoComplete: "postal-code" })}{field("Pays *", "recipient_country", { autoComplete: "country-name" })}<div><Label htmlFor="service_type">Service *</Label><Select value={draftValue(draft, "service_type")} onValueChange={(value) => updateDraft("service_type", value)}><SelectTrigger id="service_type" className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent><SelectItem value="fret_maritime">Fret maritime</SelectItem><SelectItem value="fret_aerien">Fret aérien</SelectItem><SelectItem value="demenagement">Déménagement</SelectItem><SelectItem value="dedouanement">Dédouanement</SelectItem><SelectItem value="negoce">Négoce</SelectItem><SelectItem value="colis">Colis</SelectItem></SelectContent></Select></div>{field("Origine *", "origin")}{field("Destination *", "destination")}<div className="sm:col-span-2"><Label htmlFor="description">Contenu * </Label><Textarea id="description" className="mt-1" value={draftValue(draft, "description")} onChange={(event) => updateDraft("description", event.target.value)} /></div></div>}
            {currentStep === 5 && <div className="grid gap-4 sm:grid-cols-2">{field("Tarif initial (€) *", "initial_price", { type: "number", min: 0, step: "0.01", inputMode: "decimal" })}{field("Prix final (€) *", "final_price", { type: "number", min: 0, step: "0.01", inputMode: "decimal" })}<div><Label htmlFor="payment_method">Mode de règlement *</Label><Select value={draftValue(draft, "payment_method")} onValueChange={(value) => updateDraft("payment_method", value)}><SelectTrigger id="payment_method" className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Virement</SelectItem><SelectItem value="cash">Espèces</SelectItem><SelectItem value="card">Carte</SelectItem><SelectItem value="mobile">Mobile</SelectItem><SelectItem value="other">Autre</SelectItem></SelectContent></Select></div><div><Label htmlFor="payment_state">État du règlement</Label><Select value={draftValue(draft, "payment_state") || "unpaid"} onValueChange={(value) => updateDraft("payment_state", value)}><SelectTrigger id="payment_state" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unpaid">À régler</SelectItem><SelectItem value="partial">Partiel</SelectItem><SelectItem value="paid">Réglé</SelectItem></SelectContent></Select></div><div className="sm:col-span-2"><Label htmlFor="discount_reason">Remise ou motif de négociation</Label><Textarea id="discount_reason" className="mt-1" value={draftValue(draft, "discount_reason")} onChange={(event) => updateDraft("discount_reason", event.target.value)} /></div></div>}
            {currentStep === 6 && <div className="space-y-4"><p className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">La création utilise les informations validées aux étapes précédentes. La référence et le QR seront générés par le serveur.</p>{workflow.order_id ? <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"><p className="font-medium">Commande {draftValue(draft, "order_number")} créée.</p><Button asChild variant="outline" className="mt-3"><Link href={`/admin/clients/${workflow.customer_id || ""}`}><Printer className="size-4" />Ouvrir la fiche pour imprimer l’étiquette</Link></Button></div> : <Button type="button" disabled={creatingOrder} onClick={() => void createOrder()}>{creatingOrder ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}Créer la commande</Button>}</div>}
            {currentStep === 7 && <div className="space-y-4"><div><Label htmlFor="notification_channel">Canal expliqué au client *</Label><Select value={draftValue(draft, "notification_channel")} onValueChange={(value) => updateDraft("notification_channel", value)}><SelectTrigger id="notification_channel" className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent><SelectItem value="email">E-mail</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="verbal">Explication verbale</SelectItem></SelectContent></Select></div><label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={draftChecked(draft, "tracking_explained")} onChange={(event) => updateDraft("tracking_explained", event.target.checked)} className="mt-0.5 size-4" />J’ai communiqué la référence et expliqué au client comment suivre son colis.</label></div>}
            {currentStep === 8 && <div className="space-y-4"><p className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">Vérifiez que le client repart avec les informations de suivi et qu’aucun point bloquant n’est ouvert.</p><label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={draftChecked(draft, "closing_confirmed")} onChange={(event) => updateDraft("closing_confirmed", event.target.checked)} className="mt-0.5 size-4" />La réception est terminée et le prochain point de contact a été confirmé.</label></div>}
          </CardContent>
        </Card>

        {workflow.status !== "completed" && <Card className="border-red-200"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-5 text-red-600" />Signaler un problème</CardTitle><CardDescription>Le responsable verra l’incident et pourra l’accuser réception puis le résoudre.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row"><Textarea value={problemText} onChange={(event) => setProblemText(event.target.value)} placeholder="Décrivez le blocage ou l’incident" /><Button type="button" variant="outline" disabled={saving} onClick={() => void reportProblem()}><Send className="size-4" />Signaler</Button></CardContent></Card>}

        {workflow.status !== "completed" && <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button type="button" variant="outline" disabled={saving || currentStep === 1} onClick={() => void goBack()}><ArrowLeft className="size-4" />Précédent</Button><Button type="button" disabled={saving || workflow.status === "blocked"} onClick={() => void goForward()}>{saving ? <Loader2 className="size-4 animate-spin" /> : currentStep === 8 ? <CheckCircle2 className="size-4" /> : <ArrowRight className="size-4" />}{currentStep === 8 ? "Clôturer la réception" : "Enregistrer et continuer"}</Button></div>}
      </div>
    </AdminLayout>
  )
}
