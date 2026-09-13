"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  Loader2,
  MessageSquare,
  Package,
  PackagePlus,
  QrCode,
  Search,
  Truck,
  Users,
} from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const adminSections = [
  { href: "/admin/clients", label: "Clients", description: "Gérez les clients et leurs commandes.", icon: Users, mobileNavigationRedundant: true },
  { href: "/admin/containers", label: "Conteneurs", description: "Organisez les départs et les arrivées.", icon: Package, mobileNavigationRedundant: true },
  { href: "/admin/tracking", label: "Suivi", description: "Consultez le suivi des expéditions.", icon: Truck, mobileNavigationRedundant: true },
  { href: "/admin/analytics", label: "Analyses", description: "Suivez les indicateurs de l'activité.", icon: BarChart3, roles: ["admin"] },
  { href: "/admin/messages", label: "Messages", description: "Préparez les communications clients.", icon: MessageSquare, roles: ["admin"] },
  { href: "/admin/blogs", label: "Blogs", description: "Créez et publiez les articles du site.", icon: BookOpen, mobileNavigationRedundant: true },
  { href: "/admin/employees", label: "Collaborateurs", description: "Gérez les membres de l'équipe.", icon: Users, roles: ["admin"] },
]

type DashboardTaskKind = "tracking" | "payment" | "milestone" | "incident"

type DashboardTask = {
  id: string
  kind: DashboardTaskKind
  title: string
  description: string
  href: string
}

type OperatorDashboard = {
  tasks: DashboardTask[]
  totals: {
    toProcess: number
    tracking: number
    payments: number
    milestones: number
    incidents: number
  }
}

const taskAppearance: Record<DashboardTaskKind, { label: string; className: string }> = {
  tracking: { label: "Suivi", className: "bg-blue-50 text-blue-700" },
  payment: { label: "Règlement", className: "bg-amber-50 text-amber-800" },
  milestone: { label: "Échéance", className: "bg-violet-50 text-violet-700" },
  incident: { label: "Incident", className: "bg-red-50 text-red-700" },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [operatorDashboard, setOperatorDashboard] = useState<OperatorDashboard | null>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState("")
  const { data: session, status } = useSession()
  const role = session?.user?.role === "admin" ? "admin" : "operator"
  const sessionName = session?.user?.name || session?.user?.email?.split("@")[0] || "Utilisateur"
  const userName = sessionName.charAt(0).toUpperCase() + sessionName.slice(1)

  const loadDashboard = useCallback(async () => {
    setIsDashboardLoading(true)
    setDashboardError("")
    try {
      const response = await fetch("/api/dashboard/operator", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Chargement impossible")
      setOperatorDashboard(result.data)
    } catch (cause) {
      setOperatorDashboard(null)
      setDashboardError(cause instanceof Error ? cause.message : "Chargement impossible")
    } finally {
      setIsDashboardLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status !== "authenticated") return

    fetch("/api/stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) setStats(result.data)
      })
      .catch(() => setStats(null))
    loadDashboard()
  }, [loadDashboard, status])

  return (
    <AdminLayout title="Tableau de bord">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-gray-600">Bonjour {userName}. Commencez par la file d’action, puis utilisez un raccourci pour votre prochaine opération.</p>
        <p className="text-sm text-slate-500" aria-live="polite">{operatorDashboard ? `${operatorDashboard.totals.toProcess} action${operatorDashboard.totals.toProcess > 1 ? "s" : ""} à traiter` : ""}</p>
      </div>

      <section aria-labelledby="quick-actions-title" className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="size-5 text-orange-600" aria-hidden="true" />
          <h2 id="quick-actions-title" className="text-lg font-semibold text-slate-900">Actions rapides</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="h-auto min-h-14 justify-start px-4 py-3 text-left">
            <Link href="/admin?searchDialog=1"><Search className="size-5 text-orange-600" /><span><span className="block font-semibold">Rechercher</span><span className="block text-xs font-normal text-muted-foreground">Référence, client ou conteneur</span></span></Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-14 justify-start px-4 py-3 text-left">
            <Link href="/admin/qr"><QrCode className="size-5 text-orange-600" /><span><span className="block font-semibold">Scanner</span><span className="block text-xs font-normal text-muted-foreground">Identifier puis avancer un colis</span></span></Link>
          </Button>
          <Button asChild className="h-auto min-h-14 justify-start px-4 py-3 text-left">
            <Link href="/admin/reception"><PackagePlus className="size-5" /><span><span className="block font-semibold">Créer une commande</span><span className="block text-xs font-normal text-orange-100">Démarrer une réception Bruxelles</span></span></Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="action-queue-title" className="mb-8">
        <Card>
          <CardHeader className="border-b">
            <CardTitle id="action-queue-title" className="flex items-center gap-2"><AlertTriangle className="size-5 text-orange-600" />À traiter</CardTitle>
            <CardDescription>Suivis sans nouvelle récente, règlements à compléter, échéances proches et incidents signalés.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isDashboardLoading && (
              <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement de la file d’action…</div>
            )}
            {!isDashboardLoading && dashboardError && (
              <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-red-800">{dashboardError}</p>
                <Button type="button" variant="outline" onClick={loadDashboard}>Réessayer</Button>
              </div>
            )}
            {!isDashboardLoading && !dashboardError && operatorDashboard?.tasks.length === 0 && (
              <div className="py-5 text-sm text-muted-foreground">Aucune action prioritaire pour le moment.</div>
            )}
            {!isDashboardLoading && !dashboardError && operatorDashboard && operatorDashboard.tasks.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {operatorDashboard.tasks.map((task) => {
                  const appearance = taskAppearance[task.kind]
                  return (
                    <li key={task.id}>
                      <Link href={task.href} className="group flex min-h-16 items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2">
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${appearance.className}`}>{appearance.label}</span>
                        <span className="min-w-0 flex-1"><span className="block font-medium text-slate-900">{task.title}</span><span className="block truncate text-sm text-slate-500">{task.description}</span></span>
                        <ArrowRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Synthèse des commandes">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Colis en transit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.in_progress || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">En attente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.pending || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Commandes terminées</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.completed || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total || 0}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminSections.filter((section) => !section.roles || section.roles.includes(role)).map(({ href, label, description, icon: Icon, mobileNavigationRedundant }) => (
          <Link key={href} href={href} className={`group${mobileNavigationRedundant ? " hidden md:block" : ""}`}>
            <Card className="h-full transition-shadow group-hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-orange-600" />
                  {label}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}
