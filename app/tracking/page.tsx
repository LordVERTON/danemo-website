"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Clock, Package, Truck, Ship, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useTrackingData, getStatusLabel, type PackageTracking } from "@/lib/tracking-data"

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingResult, setTrackingResult] = useState<PackageTracking | null>(null)
  const [error, setError] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRealTimeUpdate, setIsRealTimeUpdate] = useState(false)

  const allPackages = useTrackingData()

  useEffect(() => {
    if (trackingNumber.trim() && allPackages.length > 0) {
      const updatedPackage = allPackages.find(
        (pkg) => pkg.trackingNumber.toLowerCase() === trackingNumber.trim().toLowerCase(),
      )

      if (updatedPackage) {
        const hasChanged =
          !trackingResult ||
          JSON.stringify(updatedPackage.events) !== JSON.stringify(trackingResult.events) ||
          updatedPackage.currentStatus !== trackingResult.currentStatus ||
          updatedPackage.lastUpdate !== trackingResult.lastUpdate

        if (hasChanged && trackingResult) {
          setIsRealTimeUpdate(true)
          setTimeout(() => setIsRealTimeUpdate(false), 3000)
          console.log("Mise à jour en temps réel détectée pour:", trackingNumber)
        }

        if (hasChanged) {
          setTrackingResult(updatedPackage)
          setLastUpdate(new Date())
          setError("")
          console.log("Données mises à jour pour:", trackingNumber, "- Événements:", updatedPackage.events.length)
        }
      } else if (trackingResult) {
        console.warn(`Package ${trackingNumber} not found in updated data`)
      }
    }
  }, [allPackages, trackingNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsRealTimeUpdate(false)

    if (!trackingNumber.trim()) {
      setError("Veuillez entrer un numéro de suivi")
      return
    }

    const result = allPackages.find((pkg) => pkg.trackingNumber.toLowerCase() === trackingNumber.trim().toLowerCase())

    if (result) {
      setTrackingResult(result)
      setLastUpdate(new Date())
      console.log("Recherche manuelle effectuée pour:", trackingNumber)
    } else {
      setError("Numéro de suivi introuvable. Vérifiez le numéro et réessayez.")
      setTrackingResult(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      preparation: { variant: "outline" as const, className: "text-gray-600 border-gray-300" },
      expedie: { variant: "secondary" as const, className: "text-blue-600 bg-blue-50" },
      en_transit: { variant: "default" as const, className: "text-orange-600 bg-orange-50" },
      arrive_port: { variant: "secondary" as const, className: "text-purple-600 bg-purple-50" },
      dedouane: { variant: "outline" as const, className: "text-yellow-600 border-yellow-300" },
      livre: { variant: "default" as const, className: "text-green-600 bg-green-50" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.preparation
    return (
      <Badge variant={config.variant} className={config.className}>
        {getStatusLabel(status)}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparation":
        return <Package className="h-5 w-5 text-gray-600" />
      case "expedie":
        return <Truck className="h-5 w-5 text-blue-600" />
      case "en_transit":
        return <Ship className="h-5 w-5 text-orange-600" />
      case "arrive_port":
        return <MapPin className="h-5 w-5 text-purple-600" />
      case "dedouane":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "livre":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">Suivi de Colis</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <form onSubmit={handleSubmit} className="flex gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ex: DN2024001234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Suivre
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-center">
                {error}
              </div>
            )}
          </div>

          {trackingResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    isRealTimeUpdate ? "text-green-600 font-medium" : "text-gray-500"
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${isRealTimeUpdate ? "animate-spin" : ""}`} />
                  <span>{isRealTimeUpdate ? "Mise à jour en cours..." : "Données synchronisées en temps réel"}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Dernière mise à jour: {lastUpdate.toLocaleTimeString("fr-FR")}
                </div>
              </div>

              {isRealTimeUpdate && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Statut mis à jour automatiquement !</span>
                    <span className="text-sm">Les informations ont été synchronisées depuis l'administration.</span>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {getStatusIcon(trackingResult.currentStatus)}
                    Statut actuel : {getStatusBadge(trackingResult.currentStatus)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Numéro de suivi</h3>
                      <p className="text-lg font-mono">{trackingResult.trackingNumber}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Référence</h3>
                      <p className="text-lg">{trackingResult.reference}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Destination</h3>
                      <p className="text-lg">{trackingResult.destination}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Livraison estimée</h3>
                      <p className="text-lg">
                        {new Date(trackingResult.estimatedDelivery).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Poids</h3>
                      <p className="text-lg">{trackingResult.weight}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Dernière mise à jour</h3>
                      <p className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {new Date(trackingResult.lastUpdate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historique du suivi ({trackingResult.events.length} événements)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingResult.events
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full ${index === 0 ? "bg-orange-500" : "bg-gray-300"}`} />
                            {index < trackingResult.events.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(event.status)}
                              <span className="font-semibold">
                                {event.date} à {event.time}
                              </span>
                              {getStatusBadge(event.status)}
                            </div>
                            <div className="text-gray-600 mb-1 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                            <div className="text-gray-800">{event.description}</div>
                            {event.operator && (
                              <div className="text-sm text-gray-500 mt-1">Opérateur: {event.operator}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-[#B8860B] font-serif">Informations Utiles</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#B8860B] font-serif">Délais de Transit</h3>
                <ul className="space-y-2">
                  <li>• Transport maritime : 4-6 semaines</li>
                  <li>• Transport aérien : 3-7 jours</li>
                  <li>• Dédouanement : 2-5 jours ouvrables</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-[#B8860B] font-serif">Contact</h3>
                <ul className="space-y-2">
                  <li>• Téléphone : +32488645183</li>
                  <li>• Email : info@danemo.be</li>
                  <li>• Horaires : Lun-Sam 9h-18h</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Exemples de numéros de suivi :</strong> DN2024001234, DN2024001235, DN2024001236, DN2024001237
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
