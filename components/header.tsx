"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Phone, Mail, Clock } from "lucide-react"
import LanguageSwitcher from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { messages } = useI18n()
  const header = messages.header

  return (
    <header className="relative">
      {/* Header Bar */}
      <div className="bg-gray-100 py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-semibold">{header.openHours}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Mail className="w-4 h-4 text-gray-600" />
              <a href={`mailto:${header.contact.email}`} className="hover:text-orange-500">
                {header.contact.email}
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-4 h-4 text-gray-600" />
              <a href={`tel:${header.contact.phone}`} className="hover:text-orange-500">
                {header.contact.phone}
              </a>
            </div>
            <div className="md:hidden">
              <LanguageSwitcher />
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
                {header.nav.home}
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                {header.nav.services}
              </Link>
              <Link href="/tarifs" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                {header.nav.rates}
              </Link>
              <Link
                href="/contactez-nous"
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                {header.nav.contact}
              </Link>
              <Link href="/tracking" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                {header.nav.tracking}
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                {header.nav.blog}
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="flex flex-col space-y-4">
                <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.home}
                </Link>
                <Link href="/services" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.services}
                </Link>
                <Link href="/tarifs" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.rates}
                </Link>
                <Link href="/contactez-nous" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.contact}
                </Link>
                <Link href="/tracking" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.tracking}
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-orange-500 font-medium">
                  {header.nav.blog}
                </Link>
                <div className="pt-4 border-t">
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
