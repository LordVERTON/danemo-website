"use client"

import type React from "react"

import { useEffect, useState, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Package, Truck, BarChart3, Users, QrCode, BookOpen, MessageSquare } from "lucide-react"
import Link from "next/link"
import QRScanner from "@/components/qr-scanner"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState("")
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    const legacySession = localStorage.getItem("danemo_admin_session")
    const nextAuthRole = session?.user?.role
    if (status === "authenticated") {
      setIsAuthenticated(true)
      setRole(nextAuthRole || localStorage.getItem("danemo_admin_role"))
    } else if (legacySession === "authenticated") {
      setIsAuthenticated(true)
      setRole(localStorage.getItem("danemo_admin_role"))
    } else {
      router.push("/admin/login")
    }

    // Définir le chemin actuel
    setCurrentPath(window.location.pathname)
  }, [router, session?.user?.role, status])

  const handleLogout = useCallback(async () => {
    localStorage.removeItem("danemo_admin_session")
    localStorage.removeItem("danemo_admin_role")
    document.cookie = "danemo_admin_session=; path=/; max-age=0"
    document.cookie = "danemo_admin_role=; path=/; max-age=0"
    await signOut({ redirect: false })
    router.push("/admin/login")
  }, [router])

  const extractQrCode = useCallback((rawPayload: string) => {
    const raw = String(rawPayload || "").trim()
    if (!raw) return null

    if (raw.startsWith("ORD-")) return raw

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const url = new URL(raw)
        return (
          url.searchParams.get("code") ||
          url.searchParams.get("qr") ||
          url.searchParams.get("tracking") ||
          null
        )
      } catch {
        return null
      }
    }

    try {
      const data = JSON.parse(raw)
      return (
        data.qr_code ||
        data.qr ||
        data.code ||
        data.order_number ||
        data.package_qr ||
        data.tracking ||
        null
      )
    } catch {
      return null
    }
  }, [])

  const handleQRScan = useCallback((qrData: string) => {
    const qrCode = extractQrCode(qrData)

    if (qrCode) {
      router.push(`/admin/qr?code=${encodeURIComponent(String(qrCode))}`)
      return
    }

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
      } else if (currentPath === "/admin/clients" || currentPath.startsWith("/admin/clients/")) {
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
  }, [currentPath, extractQrCode, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Vérification de l'authentification...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#14171a] text-white shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-4 lg:gap-8">
              <Link href="/admin" className="shrink-0 text-lg font-extrabold tracking-tight text-white sm:text-xl">
                DANEMO <span className="font-medium text-orange-400">ADMIN</span>
              </Link>
              <nav className="hidden items-center gap-1 overflow-x-auto lg:flex">
                <Link href="/admin/clients" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/clients" || currentPath.startsWith("/admin/clients/") ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                  <Users className="h-4 w-4" />
                  Clients
                </Link>
                <Link href="/admin/containers" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/containers" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                  <Package className="h-4 w-4" />
                  Conteneurs
                </Link>
                <Link href="/admin/tracking" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/tracking" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                  <Truck className="h-4 w-4" />
                  Suivi
                </Link>
                {role !== 'operator' && (
                  <Link href="/admin/analytics" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/analytics" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                    <BarChart3 className="h-4 w-4" />
                    Analyses
                  </Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/messages" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/messages" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                )}
                {(role === 'admin' || role === 'operator') && (
                  <Link href="/admin/blogs" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/blogs" || currentPath.startsWith("/admin/blogs/") ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                    <BookOpen className="h-4 w-4" />
                    Blogs
                  </Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/employees" className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${currentPath === "/admin/employees" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                    <Users className="h-4 w-4" />
                    Collaborateurs
                  </Link>
                )}
              </nav>
            </div>
            <Button variant="outline" onClick={handleLogout} className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 sm:px-6 lg:px-8 md:pb-8">
        {title && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around py-1 sm:py-2 px-1 sm:px-2 gap-0.5 sm:gap-1">
          {/* Clients */}
          <Link
            href="/admin/clients"
            className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
              currentPath === "/admin/clients" || currentPath.startsWith("/admin/clients/")
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-orange-600"
            }`}
          >
            <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Clients</span>
          </Link>

          {/* Containers */}
          <Link
            href="/admin/containers"
            className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
              currentPath === "/admin/containers"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:text-orange-600"
            }`}
          >
            <Package className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
            <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Conteneurs</span>
          </Link>

          {/*QR code */}
          <QRScanner
            onScan={handleQRScan}
            requireReauthOnFirstScanInSession
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

          {role === 'admin' && (
            <Link
              href="/admin/messages"
              className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentPath === "/admin/messages"
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Messages</span>
            </Link>
          )}

          {(role === 'admin' || role === 'operator') && (
            <Link
              href="/admin/blogs"
              className={`flex flex-col items-center py-1 sm:py-2 px-1 sm:px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentPath === "/admin/blogs"
                  ? "text-orange-600 bg-orange-50"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] xs:text-xs sm:text-xs mt-0.5 sm:mt-1 truncate">Blogs</span>
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
