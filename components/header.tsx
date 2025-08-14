"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Phone, Mail, Clock } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="relative">
      {/* Header Bar */}
      <div className="bg-gray-100 py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">Nous sommes ouverts du Lun - Sam 9h- 18h</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Mail className="w-4 h-4 text-gray-600" />
              <a href="mailto:info@danemo.be" className="hover:text-orange-500">
                info@danemo.be
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-4 h-4 text-gray-600" />
              <a href="tel:+32488645183" className="hover:text-orange-500">
                +32488645183
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/images/logo.webp" alt="Danemo Logo" width={60} height={60} className="object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-orange-500 font-serif">Danemo Srl</h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Accueil
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Services
              </Link>
              <Link href="/tarifs" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Tarifs
              </Link>
              <Link
                href="/contactez-nous"
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                Contactez-nous
              </Link>
              <Link href="/tracking" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Tracking
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Blog
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col space-y-4">
                <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium">
                  Accueil
                </Link>
                <Link href="/services" className="text-gray-700 hover:text-orange-500 font-medium">
                  Services
                </Link>
                <Link href="/tarifs" className="text-gray-700 hover:text-orange-500 font-medium">
                  Tarifs
                </Link>
                <Link href="/contactez-nous" className="text-gray-700 hover:text-orange-500 font-medium">
                  Contactez-nous
                </Link>
                <Link href="/tracking" className="text-gray-700 hover:text-orange-500 font-medium">
                  Tracking
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-orange-500 font-medium">
                  Blog
                </Link>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
