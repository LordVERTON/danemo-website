"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, Phone, Mail, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/tracking", label: "Suivi" },
  { href: "/blog", label: "Blog" },
  { href: "/contactez-nous", label: "Contact" },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="hidden md:block bg-[#14171a] text-gray-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center text-xs py-2">
          <p>Lun – Ven 9h–18h · Sam 9h–14h</p>
          <div className="flex items-center gap-6">
            <a href="mailto:info@danemo.be" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              info@danemo.be
            </a>
            <a href="tel:+32488645183" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              +32 488 64 51 83
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        className={cn(
          "bg-white/95 backdrop-blur transition-shadow duration-300",
          isScrolled ? "shadow-md" : "shadow-sm",
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2.5">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image src="/images/logo-clair.webp" alt="Danemo" width={44} height={44} className="object-contain" />
              <span className="text-xl font-extrabold tracking-tight text-[#14171a]">
                DANEMO
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                      active ? "text-orange-600 bg-orange-50" : "text-gray-700 hover:text-orange-600 hover:bg-gray-50",
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden lg:block">
              <Link
                href="/contactez-nous"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm shadow-orange-600/20"
              >
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              className="lg:hidden p-2 -mr-2 text-gray-700"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-[72px] bottom-0 bg-white z-40 transition-transform duration-300 ease-out overflow-y-auto",
          isMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
      >
        <div className="flex flex-col px-6 py-6 gap-1">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-3.5 rounded-xl text-base font-semibold transition-colors",
                  active ? "text-orange-600 bg-orange-50" : "text-gray-800 hover:bg-gray-50",
                )}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/contactez-nous"
            className="mt-4 inline-flex items-center justify-center gap-2 bg-orange-600 text-white text-base font-semibold px-5 py-3.5 rounded-xl"
          >
            Demander un devis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3 text-sm text-gray-600">
            <a href="tel:+32488645183" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-600" />
              +32 488 64 51 83
            </a>
            <a href="mailto:info@danemo.be" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-600" />
              info@danemo.be
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
