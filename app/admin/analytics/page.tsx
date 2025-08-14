"use client"

import { useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Download, TrendingUp, TrendingDown, Package, Euro, Users, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")

  // Sample data for charts
  const revenueData = [
    { month: "Jan", revenue: 45000, packages: 120, clients: 85 },
    { month: "Fév", revenue: 52000, packages: 145, clients: 92 },
    { month: "Mar", revenue: 48000, packages: 135, clients: 88 },
    { month: "Avr", revenue: 61000, packages: 165, clients: 105 },
    { month: "Mai", revenue: 55000, packages: 150, clients: 98 },
    { month: "Jun", revenue: 67000, packages: 180, clients: 115 },
  ]

  const packageTypeData = [
    { name: "Colis", value: 65, color: "#f39c12" },
    { name: "Véhicules", value: 20, color: "#3498db" },
    { name: "Marchandises", value: 15, color: "#2ecc71" },
  ]

  const destinationData = [
    { destination: "Yaoundé", packages: 85, revenue: 28500 },
    { destination: "Douala", packages: 120, revenue: 42000 },
    { destination: "Bafoussam", packages: 35, revenue: 12500 },
    { destination: "Bamenda", packages: 25, revenue: 8900 },
    { destination: "Garoua", packages: 15, revenue: 5200 },
  ]

  const statusData = [
    { status: "Livré", count: 180, percentage: 64 },
    { status: "En transit", count: 65, percentage: 23 },
    { status: "En préparation", count: 25, percentage: 9 },
    { status: "En attente", count: 12, percentage: 4 },
  ]

  const exportData = () => {
    // In a real application, this would generate and download a report
    const data = {
      period: selectedPeriod,
      revenue: revenueData,
      packages: packageTypeData,
      destinations: destinationData,
      status: statusData,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `danemo-analytics-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout title="Analyses et rapports">
      {/* Controls */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportData} className="bg-orange-600 hover:bg-orange-700">
          <Download className="h-4 w-4 mr-2" />
          Exporter les données
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€328,500</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colis expédiés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">795</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">583</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.3% vs mois dernier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23 jours</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              +2 jours vs mois dernier
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
            <CardDescription>Revenus mensuels et nombre de colis expédiés</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenus (€)",
                  color: "#f39c12",
                },
                packages: {
                  label: "Colis",
                  color: "#3498db",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f39c12" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="packages" stroke="#3498db" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Package Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
            <CardDescription>Distribution des types de colis expédiés</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                colis: {
                  label: "Colis",
                  color: "#f39c12",
                },
                vehicules: {
                  label: "Véhicules",
                  color: "#3498db",
                },
                marchandises: {
                  label: "Marchandises",
                  color: "#2ecc71",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {packageTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Destinations and Status Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Principales destinations</CardTitle>
            <CardDescription>Classement par nombre de colis et revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {destinationData.map((dest, index) => (
                <div key={dest.destination} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{dest.destination}</div>
                      <div className="text-sm text-gray-600">{dest.packages} colis</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">€{dest.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{((dest.packages / 280) * 100).toFixed(1)}% du total</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des statuts</CardTitle>
            <CardDescription>État actuel de tous les colis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData.map((status) => (
                <div key={status.status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{status.status}</span>
                    <span className="text-sm text-gray-600">
                      {status.count} colis ({status.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Métriques de performance</CardTitle>
          <CardDescription>Indicateurs clés de performance pour la période sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">96.5%</div>
              <div className="text-sm text-gray-600">Taux de livraison réussie</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">4.8/5</div>
              <div className="text-sm text-gray-600">Satisfaction client moyenne</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">€413</div>
              <div className="text-sm text-gray-600">Valeur moyenne par colis</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
