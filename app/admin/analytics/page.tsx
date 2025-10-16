"use client"

import { useState, useEffect, useRef } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  Euro, 
  Users,
  Calendar,
  Download
} from "lucide-react"
import ExportMenu from "@/components/export-menu"
import { ExportData } from "@/lib/export-utils"

interface Stats {
  total: number
  pending: number
  confirmed: number
  in_progress: number
  completed: number
  cancelled: number
}

interface Order {
  id: string
  order_number: string
  client_name: string
  service_type: string
  status: string
  value?: number
  created_at: string
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const [error, setError] = useState("")
  const [role, setRole] = useState<string | null>(null)
  const [isFiltering, setIsFiltering] = useState(false)
  
  // Refs pour les graphiques
  const barChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)
  const lineChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRole = typeof window !== 'undefined' ? localStorage.getItem('danemo_admin_role') : null
    setRole(currentRole)
    if (currentRole === 'operator') {
      // Redirect operators away from analytics
      window.location.href = '/admin'
      return
    }
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setIsFiltering(true)
      
      // Calculer la date de début selon la période sélectionnée
      const days = parseInt(timeRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // Récupérer les statistiques avec filtre de date
      const statsResponse = await fetch(`/api/stats?start_date=${startDate.toISOString()}`)
      const statsResult = await statsResponse.json()
      
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Récupérer les commandes pour les graphiques avec filtre de date
      const ordersResponse = await fetch(`/api/orders?start_date=${startDate.toISOString()}`)
      const ordersResult = await ordersResponse.json()
      
      if (ordersResult.success) {
        setOrders(ordersResult.data)
      }
    } catch (error) {
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
      setIsFiltering(false)
    }
  }

  // Données pour les graphiques
  const getStatusData = () => {
    if (!stats) return []
    return [
      { name: 'En attente', value: stats.pending, color: '#f59e0b' },
      { name: 'Confirmées', value: stats.confirmed, color: '#3b82f6' },
      { name: 'En cours', value: stats.in_progress, color: '#f97316' },
      { name: 'Terminées', value: stats.completed, color: '#10b981' },
      { name: 'Annulées', value: stats.cancelled, color: '#ef4444' }
    ]
  }

  const getServiceTypeData = () => {
    const serviceTypes = orders.reduce((acc, order) => {
      acc[order.service_type] = (acc[order.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(serviceTypes).map(([type, count]) => ({
      name: getServiceTypeLabel(type),
      value: count
    }))
  }

  const getMonthlyData = () => {
    const monthlyData = orders.reduce((acc, order) => {
      const month = new Date(order.created_at).toLocaleDateString('fr-FR', { month: 'short' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      commandes: count
    }))
  }

  const getRevenueData = () => {
    const monthlyRevenue = orders.reduce((acc, order) => {
      const month = new Date(order.created_at).toLocaleDateString('fr-FR', { month: 'short' })
      const value = order.value || 0
      acc[month] = (acc[month] || 0) + value
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: revenue / 1000 // Convertir en milliers d'euros
    }))
  }

  const getServiceTypeLabel = (type: string) => {
    const types = {
      fret_maritime: "Fret maritime",
      fret_aerien: "Fret aérien",
      demenagement: "Déménagement",
      dedouanement: "Dédouanement",
      negoce: "Négoce"
    }
    return types[type as keyof typeof types] || type
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.value || 0), 0)
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // Fonction pour obtenir le label de la période
  const getPeriodLabel = () => {
    const days = parseInt(timeRange)
    if (days === 7) return "7 derniers jours"
    if (days === 30) return "30 derniers jours"
    if (days === 90) return "3 derniers mois"
    if (days === 365) return "12 derniers mois"
    return "Période sélectionnée"
  }

  // Préparer les données d'export
  const getExportData = (): ExportData => ({
    stats: stats || {
      total: 0,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    },
    orders,
    timeRange,
    periodLabel: getPeriodLabel()
  })

  // Obtenir les éléments des graphiques
  const getChartElements = (): HTMLElement[] => {
    const elements: HTMLElement[] = []
    if (barChartRef.current) elements.push(barChartRef.current)
    if (pieChartRef.current) elements.push(pieChartRef.current)
    if (lineChartRef.current) elements.push(lineChartRef.current)
    return elements
  }

  if (isLoading) {
    return (
      <AdminLayout title="Analyses et rapports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>Chargement des analyses...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Analyses et rapports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Consultez les statistiques et générez des rapports - {getPeriodLabel()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeRange} onValueChange={setTimeRange} disabled={isFiltering}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">3 derniers mois</SelectItem>
                  <SelectItem value="365">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
              {isFiltering && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              )}
            </div>
            <ExportMenu 
              data={getExportData()}
              chartElements={getChartElements()}
            />
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes en cours</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.in_progress || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total ? Math.round(((stats.in_progress || 0) / stats.total) * 100) : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +8% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur moyenne</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{Math.round(averageOrderValue).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Par commande
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique en barres - Types de services */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type de service</CardTitle>
              <CardDescription>Nombre de commandes par service - {getPeriodLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={barChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getServiceTypeData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Graphique en secteurs - Statuts */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>Distribution des commandes par statut - {getPeriodLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={pieChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques temporels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des commandes */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des commandes</CardTitle>
              <CardDescription>Nombre de commandes par mois - {getPeriodLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={lineChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="commandes" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Évolution des revenus */}
          {role !== 'operator' && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
                <CardDescription>Revenus par mois (en milliers d'euros) - {getPeriodLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}k`, 'Revenus']} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tableau des commandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
            <CardDescription>Les dernières commandes ajoutées - {getPeriodLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{order.client_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{getServiceTypeLabel(order.service_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{order.value?.toLocaleString() || '0'}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}