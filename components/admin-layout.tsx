"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Package, Truck, BarChart3, Home } from "lucide-react"
import Link from "next/link"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("danemo_admin_session")
    if (session === "authenticated") {
      setIsAuthenticated(true)
    } else {
      router.push("/admin/login")
    }
  }, [router])

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
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-2xl font-bold text-orange-600">
                Administration Danemo
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Home className="h-4 w-4" />
                  Tableau de bord
                </Link>
                <Link href="/admin/inventory" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Package className="h-4 w-4" />
                  Stocks
                </Link>
                <Link href="/admin/tracking" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <Truck className="h-4 w-4" />
                  Suivi
                </Link>
                <Link href="/admin/analytics" className="flex items-center gap-2 text-gray-600 hover:text-orange-600">
                  <BarChart3 className="h-4 w-4" />
                  Analyses
                </Link>
              </nav>
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
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  )
}
