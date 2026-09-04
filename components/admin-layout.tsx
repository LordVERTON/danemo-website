"use client"

import { useEffect, useState } from "react"
import type React from "react"

import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, BookOpen, Home, LogOut, Menu, MessageSquare, Package, QrCode, Truck, Users, X } from "lucide-react"
import Link from "next/link"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  allowedRoles?: Array<"admin" | "operator">
}

export default function AdminLayout({ children, title, allowedRoles }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const role = session?.user?.role === "admin" ? "admin" : "operator"

  const navigation = [
    { href: "/admin", label: "Tableau de bord", icon: Home },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/containers", label: "Conteneurs", icon: Package },
    { href: "/admin/tracking", label: "Suivi", icon: Truck },
    { href: "/admin/analytics", label: "Analyses", icon: BarChart3, roles: ["admin"] },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare, roles: ["admin"] },
    { href: "/admin/blogs", label: "Blogs", icon: BookOpen },
    { href: "/admin/employees", label: "Collaborateurs", icon: Users, roles: ["admin"] },
    { href: "/admin/qr", label: "Scanner", icon: QrCode },
  ]
  const visibleNavigation = navigation.filter((item) => !item.roles || item.roles.includes(role))
  const desktopNavigation = visibleNavigation.filter((item) => item.href !== "/admin/qr")
  const mobilePrimaryHrefs = new Set(["/admin", "/admin/clients", "/admin/tracking", "/admin/qr"])
  const mobilePrimaryNavigation = visibleNavigation.filter((item) => mobilePrimaryHrefs.has(item.href))
  const mobileSecondaryNavigation = visibleNavigation.filter((item) => !mobilePrimaryHrefs.has(item.href))
  const isMoreMenuActive = mobileSecondaryNavigation.some((item) => pathname.startsWith(item.href))

  useEffect(() => {
    setIsMoreMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" })
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Vérification de l'authentification...</div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto mt-24 max-w-md rounded-xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Accès non autorisé</h1>
          <p className="mt-2 text-sm text-gray-600">Votre rôle ne permet pas d’accéder à cet espace.</p>
          <Link href="/admin" className="mt-5 inline-flex rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Link href="/admin" className="min-w-0 text-xl font-bold text-orange-600 sm:text-2xl" aria-label="Tableau de bord Danemo">
                <span className="sm:hidden">Danemo</span>
                <span className="hidden sm:inline">Administration Danemo</span>
              </Link>
              <nav className="hidden items-center gap-4 lg:flex">
                {desktopNavigation.map(({ href, label, icon: Icon }) => {
                  const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        isActive ? "font-semibold text-orange-600" : "text-gray-600 hover:text-orange-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <Button variant="outline" onClick={handleLogout} className="h-11 shrink-0 bg-transparent">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {isMoreMenuOpen && (
        <nav
          id="admin-mobile-more-menu"
          aria-label="Sections supplémentaires de l'administration"
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-50 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:hidden"
        >
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-semibold text-slate-900">Plus de sections</p>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(false)}
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
              aria-label="Fermer les sections supplémentaires"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mobileSecondaryNavigation.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
                    isActive ? "bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50 hover:text-orange-700"
                  }`}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden" aria-label="Navigation administration mobile">
        <div className="mx-auto grid max-w-7xl grid-cols-5 px-1 py-1.5">
          {mobilePrimaryNavigation.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                  isActive ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50 hover:text-orange-600"
                }`}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isMoreMenuOpen}
            aria-controls="admin-mobile-more-menu"
            className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 sm:text-xs ${
              isMoreMenuActive || isMoreMenuOpen ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50 hover:text-orange-600"
            }`}
          >
            <Menu className="size-[18px] shrink-0" strokeWidth={1.8} />
            <span className="w-full truncate text-center">Plus</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
