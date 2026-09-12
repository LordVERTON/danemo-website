"use client"

import { useState, useEffect, useMemo } from "react"
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
  Package, 
  Truck, 
  Euro, 
  Users,
} from "lucide-react"
import { useCurrentUser } from "@/lib/use-current-user"

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
  const { user: currentUser } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const [error, setError] = useState("")

  useEffect(() => {
    if (currentUser?.role === "admin") fetchData()
  }, [currentUser?.role, timeRange])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      const ordersResponse = await fetch('/api/orders')
      const ordersResult = await ordersResponse.json()
      
      if (ordersResponse.ok && ordersResult.success && Array.isArray(ordersResult.data)) {
        setOrders(ordersResult.data)
      } else {
        setError(ordersResult.error || 'Impossible de charger les commandes')
      }
    } catch (error) {
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const ordersForRange = useMemo(() => {
    const days = Number(timeRange)
    const start = new Date()
    start.setDate(start.getDate() - days)

    return orders.filter((order) => {
      const createdAt = new Date(order.created_at)
      return Number.isFinite(createdAt.getTime()) && createdAt >= start
    })
  }, [orders, timeRange])

  const stats = useMemo(() => ({
    total: ordersForRange.length,
    pending: ordersForRange.filter((order) => order.status === 'pending').length,
    confirmed: ordersForRange.filter((order) => order.status === 'confirmed').length,
    in_progress: ordersForRange.filter((order) => order.status === 'in_progress').length,
    completed: ordersForRange.filter((order) => order.status === 'completed').length,
    cancelled: ordersForRange.filter((order) => order.status === 'cancelled').length,
  }), [ordersForRange])

  const pricedOrders = useMemo(() => ordersForRange.flatMap((order) => {
    const amount = Number(order.value)
    return Number.isFinite(amount) && amount >= 0 ? [{ ...order, amount }] : []
  }), [ordersForRange])

  const totalOrderValue = pricedOrders.reduce((sum, order) => sum + order.amount, 0)
  const averageOrderValue = pricedOrders.length > 0 ? totalOrderValue / pricedOrders.length : null
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

  // Données pour les graphiques, calculées uniquement à partir des commandes de la période.
  const getStatusData = () => {
    return [
      { name: 'En attente', value: stats.pending, color: '#f59e0b' },
      { name: 'Confirmées', value: stats.confirmed, color: '#3b82f6' },
      { name: 'En cours', value: stats.in_progress, color: '#f97316' },
      { name: 'Terminées', value: stats.completed, color: '#10b981' },
      { name: 'Annulées', value: stats.cancelled, color: '#ef4444' }
    ].filter((entry) => entry.value > 0)
  }

  const getServiceTypeData = () => {
    const serviceTypes = ordersForRange.reduce((acc, order) => {
      acc[order.service_type] = (acc[order.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(serviceTypes).map(([type, count]) => ({
      name: getServiceTypeLabel(type),
      value: count
    }))
  }

  const getMonthlyData = () => {
    const monthlyData = ordersForRange.reduce((acc, order) => {
      const date = new Date(order.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData).sort(([first], [second]) => first.localeCompare(second)).map(([month, count]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      commandes: count
    }))
  }

  const getRevenueData = () => {
    const monthlyRevenue = pricedOrders.reduce((acc, order) => {
      const date = new Date(order.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      acc[key] = (acc[key] || 0) + order.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyRevenue).sort(([first], [second]) => first.localeCompare(second)).map(([month, revenue]) => ({
      month: new Date(`${month}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      revenue
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

  if (isLoading) {
    return (
      <AdminLayout allowedRoles={["admin"]}>
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
    <AdminLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analyses et rapports</h1>
            <p className="text-muted-foreground">
              Statistiques calculées à partir des commandes enregistrées
            </p>
          </div>
          <div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">3 derniers mois</SelectItem>
                <SelectItem value="365">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
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
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Sur la période sélectionnée
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes en cours</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.in_progress}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total ? Math.round((stats.in_progress / stats.total) * 100) : 0}% des commandes de la période
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant des commandes</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{euro.format(totalOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                {pricedOrders.length} commande{pricedOrders.length > 1 ? 's' : ''} avec un montant renseigné
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant moyen</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageOrderValue === null ? '—' : euro.format(averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                Sur les commandes dont le montant est renseigné
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
              <CardDescription>Nombre de commandes par service</CardDescription>
            </CardHeader>
            <CardContent>
              {getServiceTypeData().length ? <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getServiceTypeData()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#f97316" /></BarChart>
              </ResponsiveContainer> : <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Aucune commande sur cette période.</p>}
            </CardContent>
          </Card>

          {/* Graphique en secteurs - Statuts */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>Distribution des commandes par statut</CardDescription>
            </CardHeader>
            <CardContent>
              {getStatusData().length ? <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
              </ResponsiveContainer> : <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Aucune commande sur cette période.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Graphiques temporels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des commandes */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des commandes</CardTitle>
              <CardDescription>Nombre de commandes par mois</CardDescription>
            </CardHeader>
            <CardContent>
              {getMonthlyData().length ? <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="commandes" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer> : <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Aucune commande sur cette période.</p>}
            </CardContent>
          </Card>

          {/* Évolution des montants renseignés */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des montants</CardTitle>
              <CardDescription>Montants renseignés sur les commandes, par mois</CardDescription>
            </CardHeader>
            <CardContent>
              {getRevenueData().length ? <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [euro.format(Number(value)), 'Montant']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer> : <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">Aucun montant renseigné sur cette période.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Tableau des commandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
            <CardDescription>Les dernières commandes de la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersForRange.slice(0, 5).map((order) => (
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
                    <p className="font-medium">{order.value === null || order.value === undefined || !Number.isFinite(Number(order.value)) ? '—' : euro.format(Number(order.value))}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
              {ordersForRange.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune commande sur cette période.</p>}
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
