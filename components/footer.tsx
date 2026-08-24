import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"

const SERVICE_LINKS = [
  { href: "/services#fret", label: "Fret maritime et aérien" },
  { href: "/services#dedouanement", label: "Dédouanement" },
  { href: "/services#negoce", label: "Négoce" },
  { href: "/services#demenagement", label: "Déménagement international" },
]

const COMPANY_LINKS = [
  { href: "/services", label: "Nos services" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/tracking", label: "Suivi de colis" },
  { href: "/blog", label: "Blog" },
  { href: "/contactez-nous", label: "Contact" },
]

export default function Footer() {
  return (
    <footer className="bg-[#14171a] text-gray-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-8">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/images/logo-clair.webp" alt="Danemo" width={40} height={40} className="object-contain" />
              <span className="text-lg font-extrabold tracking-tight text-white">DANEMO</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Rapprocher plus vite l&apos;Afrique de la diaspora. Depuis plus de cinq ans, votre partenaire de
              confiance entre l&apos;Europe et le Cameroun.
            </p>
          </div>

          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2.5 text-sm">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Entreprise</h3>
            <ul className="space-y-2.5 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Nos bureaux</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                <span>
                  <strong className="text-gray-200 block">Bruxelles</strong>
                  Avenue du Port 108–110, 1000 Bruxelles
                </span>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                <span>
                  <strong className="text-gray-200 block">Yaoundé</strong>
                  Biyem-Assi, Tam-Tam Week-end · +237 690 26 20 04
                </span>
              </li>
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                <span>
                  <strong className="text-gray-200 block">Douala</strong>
                  Youpwe · +237 655 51 25 98
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                <a href="tel:+32488645183" className="hover:text-orange-400 transition-colors">
                  +32 488 64 51 83
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 text-orange-400" />
                <a href="mailto:info@danemo.be" className="hover:text-orange-400 transition-colors">
                  info@danemo.be
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Danemo SRL. Tous droits réservés.</p>
          <p>Fait avec soin entre Bruxelles et Yaoundé.</p>
        </div>
      </div>
    </footer>
  )
}
