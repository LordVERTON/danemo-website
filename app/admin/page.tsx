"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  BarChart3,
  BookOpen,
  MessageSquare,
  Package,
  Truck,
  Users,
} from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const adminSections = [
  { href: "/admin/clients", label: "Clients", description: "Gérez les clients et leurs commandes.", icon: Users },
  { href: "/admin/containers", label: "Conteneurs", description: "Organisez les départs et les arrivées.", icon: Package },
  { href: "/admin/tracking", label: "Suivi", description: "Consultez le suivi des expéditions.", icon: Truck },
  { href: "/admin/analytics", label: "Analyses", description: "Suivez les indicateurs de l'activité.", icon: BarChart3, roles: ["admin"] },
  { href: "/admin/messages", label: "Messages", description: "Préparez les communications clients.", icon: MessageSquare, roles: ["admin"] },
  { href: "/admin/blogs", label: "Blogs", description: "Créez et publiez les articles du site.", icon: BookOpen },
  { href: "/admin/employees", label: "Collaborateurs", description: "Gérez les membres de l'équipe.", icon: Users, roles: ["admin"] },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const { data: session, status } = useSession()
  const role = session?.user?.role === "admin" ? "admin" : "operator"

  useEffect(() => {
    if (status !== "authenticated") return

    fetch("/api/stats")
      .then((response) => response.json())
      .then((result) => {
        if (result.success) setStats(result.data)
      })
      .catch(() => setStats(null))
  }, [status])

  return (
    <AdminLayout title="Tableau de bord">
      <p className="mb-8 text-gray-600">Accédez rapidement aux outils de gestion Danemo.</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        {adminSections.filter((section) => !section.roles || section.roles.includes(role)).map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="group">
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
