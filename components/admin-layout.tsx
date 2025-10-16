"use client"

import type React from "react"

import { useEffect, useState, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Package, Truck, BarChart3, ShoppingCart, Users, QrCode } from "lucide-react"
import Link from "next/link"
import QRScanner from "@/components/qr-scanner"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState("")
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("danemo_admin_session")
    if (session === "authenticated") {
      setIsAuthenticated(true)
      setRole(localStorage.getItem("danemo_admin_role"))
    } else {
      router.push("/admin/login")
    }
    
    // Définir le chemin actuel
    setCurrentPath(window.location.pathname)
  }, [router])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("danemo_admin_session")
    localStorage.removeItem("danemo_admin_role")
    router.push("/admin/login")
  }, [router])

  const handleQRScan = useCallback((qrData: string) => {
    try {
      const data = JSON.parse(qrData)
      
      // Déterminer l'action selon la page actuelle
      if (currentPath === "/admin/inventory") {
        // Pour la page inventory
        const event = new CustomEvent('qrScanResult', { 
          detail: { 
            type: 'inventory',
            data: {
              type: data.type || "colis",
              reference: data.reference || "",
              description: data.description || "",
              client: data.client || "",
              status: "en_stock",
              location: "",
              poids: data.weight || "",
              dimensions: data.dimensions || "",
              valeur: data.value || ""
            }
          }
        })
        window.dispatchEvent(event)
      } else if (currentPath === "/admin/orders") {
        // Pour la page orders
        const event = new CustomEvent('qrScanResult', { 
          detail: { 
            type: 'orders',
            data: {
              client_name: data.client_name || "",
              client_email: data.client_email || "",
              client_phone: data.client_phone || "",
              service_type: data.service_type || "fret_maritime",
              origin: data.origin || "",
              destination: data.destination || "",
              weight: data.weight || "",
              value: data.value || "",
              estimated_delivery: data.estimated_delivery || ""
            }
          }
        })
        window.dispatchEvent(event)
      } else if (currentPath === "/admin/employees") {
        // Pour la page employees
        const event = new CustomEvent('qrScanResult', { 
          detail: { 
            type: 'employees',
            data: {
              name: data.name || "",
              email: data.email || "",
              role: data.role || "operator",
              salary: data.salary || "",
              position: data.position || "",
              hire_date: data.hire_date || "",
              password: data.password || "",
              is_active: data.is_active !== undefined ? data.is_active : true
            }
          }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Format de QR code invalide:', error)
    }
  }, [currentPath])

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
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-2xl font-bold text-orange-600">
                Administration Danemo
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin/orders" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes
                </Link>
                <Link href="/admin/inventory" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Package className="h-4 w-4" />
                  Stocks
                </Link>
                <Link href="/admin/tracking" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Truck className="h-4 w-4" />
                  Suivi
                </Link>
                {role !== 'operator' && (
                  <Link href="/admin/analytics" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                    <BarChart3 className="h-4 w-4" />
                    Analyses
                  </Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/employees" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                    <Users className="h-4 w-4" />
                    Collaborateurs
                  </Link>
                )}
              </nav>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around py-1 sm:py-2 px-1 sm:px-2 gap-0.5 sm:gap-1">
          {/* Orders */}
          <Link 
            href="/admin/orders" 
            className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
              currentPath === "/admin/orders" 
                ? "text-orange-600 bg-orange-50" 
                : "text-gray-600 hover:text-orange-600"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Commandes</span>
          </Link>

          {/* Inventory */}
          <Link 
            href="/admin/inventory" 
            className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
              currentPath === "/admin/inventory" 
                ? "text-orange-600 bg-orange-50" 
                : "text-gray-600 hover:text-orange-600"
            }`}
          >
            <Package className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Stocks</span>
          </Link>

          {/* QR Scanner - Au milieu */}
          <QRScanner 
            onScan={handleQRScan}
            title="Scanner QR Code"
            description="Scannez un QR code pour remplir automatiquement le formulaire"
            trigger={
              <div className="flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors text-gray-600 hover:text-orange-600 min-w-0 flex-1">
                <QrCode className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Scanner</span>
              </div>
            }
          />

          {/* Tracking */}
          <Link 
            href="/admin/tracking" 
            className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
              currentPath === "/admin/tracking" 
                ? "text-orange-600 bg-orange-50" 
                : "text-gray-600 hover:text-orange-600"
            }`}
          >
            <Truck className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Suivi</span>
          </Link>

          {/* Analytics (admin only) */}
          {role !== 'operator' && (
            <Link 
              href="/admin/analytics" 
              className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentPath === "/admin/analytics" 
                  ? "text-orange-600 bg-orange-50" 
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Analyses</span>
            </Link>
          )}

          {/* Employees (admin only) */}
          {role === 'admin' && (
            <Link 
              href="/admin/employees" 
              className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentPath === "/admin/employees" 
                  ? "text-orange-600 bg-orange-50" 
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Collaborateurs</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
