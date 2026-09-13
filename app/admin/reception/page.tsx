"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Loader2, Plus, TriangleAlert } from "lucide-react"

import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ReceptionWorkflow = {
  id: string
  customer_id: string | null
  order_id: string | null
  status: "in_progress" | "blocked" | "completed"
  current_step: number
  draft: Record<string, unknown>
  created_by_email: string | null
  started_at: string
  updated_at: string
}

const statusLabels: Record<ReceptionWorkflow["status"], string> = {
  in_progress: "En cours",
  blocked: "Bloquée",
  completed: "Clôturée",
}

export default function ReceptionListPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<ReceptionWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const loadWorkflows = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/receptions", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Chargement impossible")
      setWorkflows(result.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadWorkflows() }, [loadWorkflows])

  async function createWorkflow() {
    setCreating(true)
    setError("")
    try {
      const response = await fetch("/api/receptions", { method: "POST" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Création impossible")
      router.push(`/admin/reception/${result.data.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Création impossible")
      setCreating(false)
    }
  }

  return (
    <AdminLayout title="Réception Bruxelles">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-orange-600" />Assistant de réception</CardTitle>
            <CardDescription>Un parcours terrain en huit étapes. Chaque brouillon conserve les étapes réalisées, l’opérateur et les problèmes signalés.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={createWorkflow} disabled={creating} className="w-full sm:w-auto">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Démarrer une réception
            </Button>
          </CardContent>
        </Card>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <Button type="button" variant="link" className="h-auto px-1 text-red-800" onClick={loadWorkflows}>Réessayer</Button></div>}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réceptions récentes</CardTitle>
            <CardDescription>Reprenez un brouillon ou consultez une réception clôturée.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement…</p> : workflows.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Aucune réception n’a encore été ouverte.</p> : (
              <ul className="divide-y rounded-lg border">
                {workflows.map((workflow) => {
                  const clientName = typeof workflow.draft.customer_name === "string" ? workflow.draft.customer_name : "Client à renseigner"
                  return <li key={workflow.id}><Link href={`/admin/reception/${workflow.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"><span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-900">{clientName}</span><span className="block text-sm text-slate-500">Étape {workflow.current_step}/8 · mis à jour le {new Date(workflow.updated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span></span><Badge variant={workflow.status === "blocked" ? "destructive" : workflow.status === "completed" ? "secondary" : "outline"}>{workflow.status === "blocked" && <TriangleAlert className="mr-1 size-3" />}{statusLabels[workflow.status]}</Badge></Link></li>
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
