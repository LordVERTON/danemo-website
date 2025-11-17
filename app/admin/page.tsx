"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Truck, BarChart3, Users, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("danemo_admin_session")
    if (session === "authenticated") {
      setIsAuthenticated(true)
      setRole(localStorage.getItem("danemo_admin_role"))
      fetchStats()
    } else {
      router.push("/admin/login")
    }
  }, [router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("danemo_admin_session")
    router.push("/admin/login")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Vérification de l'authentification...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">Administration Danemo</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-gray-600">Gérez vos stocks, suivez les colis et analysez les performances</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colis en transit</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.in_progress || 0}</div>
              <p className="text-xs text-muted-foreground">Commandes en cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Véhicules en stock</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Commandes en attente</p>
            </CardContent>
          </Card>

          {role !== 'operator' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completed || 0}</div>
              <p className="text-xs text-muted-foreground">Commandes terminées</p>
            </CardContent>
          </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Total des commandes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/clients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Gestion des clients
                </CardTitle>
                <CardDescription>Gérez vos clients et leurs commandes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/containers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  Gestion des conteneurs
                </CardTitle>
                <CardDescription>Suivez les conteneurs et leurs statuts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/tracking">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Suivi des colis
                </CardTitle>
                <CardDescription>Suivez les expéditions et mettez à jour les statuts</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {role !== 'operator' && (
            <Link href="/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    Analyses et rapports
                  </CardTitle>
                  <CardDescription>Consultez les statistiques et générez des rapports</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around py-2 px-2">
          <Link
            href="/admin/clients"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Clients</span>
          </Link>
          <Link
            href="/admin/containers"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600"
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Conteneurs</span>
          </Link>
          <Link
            href="/admin/tracking"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600"
          >
            <Truck className="h-5 w-5" />
            <span className="text-xs">Suivi</span>
          </Link>
          {role !== 'operator' && (
            <Link
              href="/admin/analytics"
              className="flex flex-col items-center gap-1 text-gray-600 hover:text-orange-600"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Analyses</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
