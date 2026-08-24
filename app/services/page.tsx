import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock3,
  Coins,
  FileCheck,
  Handshake,
  Plane,
  Ship,
  Store,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Nos services",
  description:
    "Fret maritime et aérien, dédouanement de véhicules et marchandises, négoce et déménagement international entre l'Europe et le Cameroun.",
}

const SERVICES = [
  {
    id: "fret",
    icon: Ship,
    label: "Service 01",
    title: "Fret maritime et aérien",
    image: "/images/fret-maritime-aerien.png",
    description:
      "Danemo accompagne l'expédition de colis et de marchandises entre l'Europe et le Cameroun, par voie maritime ou aérienne, selon vos besoins et vos préférences.",
    audience: ["Particuliers", "Entreprises", "Diaspora africaine"],
    getItems: [
      "L'expédition de vos colis ou marchandises par voie maritime ou aérienne.",
      "Un traitement individualisé de chaque envoi.",
      "Un conditionnement adapté : emballage, étiquetage et préparation des documents.",
    ],
  },
  {
    id: "dedouanement",
    icon: FileCheck,
    label: "Service 02",
    title: "Dédouanement véhicules, conteneurs et marchandises",
    image: "/images/dedouanement-vehicules-updated.png",
    description:
      "Danemo propose une assistance à l'achat de véhicules ainsi qu'un accompagnement complet dans les procédures de dédouanement, en mettant ses clients en relation avec des déclarants agréés.",
    audience: ["Diaspora africaine", "Clients résidant en Afrique", "Entreprises"],
    getItems: [
      "Un accompagnement à l'achat de votre véhicule.",
      "L'accès à un déclarant agréé pour les formalités douanières.",
      "Le suivi de votre commande de marchandises.",
      "La prise en charge du dédouanement et de l'acheminement.",
    ],
  },
  {
    id: "negoce",
    icon: Handshake,
    label: "Service 03",
    title: "Négoce",
    image: "/images/entreprises-africaines-bureau.png",
    description:
      "Dans un monde où le réseau est essentiel, Danemo se positionne comme intermédiaire entre les PME africaines et des fournisseurs de qualité en Europe, pour favoriser le développement des affaires.",
    audience: ["PME africaines", "Entreprises Europe – Afrique"],
    getItems: [
      "Une mise en relation avec des fournisseurs de qualité.",
      "Un environnement propice au développement de votre activité.",
    ],
  },
  {
    id: "demenagement",
    icon: Boxes,
    label: "Service 04",
    title: "Déménagement international",
    image: "/images/demenagement-couple-moderne.png",
    description:
      "Vous souhaitez vous installer en Afrique ? Danemo met à disposition une équipe expérimentée, spécialisée dans le conditionnement de meubles, de machines et d'équipements divers, préparés avec soin pour une expédition sécurisée en conteneur.",
    audience: ["Ambassades", "Entreprises", "Particuliers"],
    getItems: [
      "Le conditionnement professionnel de vos meubles, machines et équipements.",
      "Une expédition sécurisée en conteneur.",
      "Un accompagnement de la préparation jusqu'à l'expédition.",
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Intro */}
        <section className="bg-[#14171a] pt-20 pb-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Nos services</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Quatre domaines d&apos;expertise, sous un même toit.
              </h1>
              <p className="mt-5 text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Négoce, fret maritime et aérien, dédouanement et déménagement international : chaque service peut
                être mobilisé seul ou combiné, avec Danemo comme interlocuteur unique.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Service blocks */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {SERVICES.map((service, i) => (
            <section
              key={service.id}
              id={service.id}
              className="scroll-mt-24 py-16 md:py-24 border-b border-gray-100 last:border-b-0"
            >
              <div className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <Reveal>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-orange-600 flex items-center justify-center shrink-0">
                        <service.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-orange-600">{service.label}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#14171a] tracking-tight text-balance">
                      {service.title}
                    </h2>

                    <p className="mt-4 text-gray-600 leading-relaxed">{service.description}</p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {service.audience.map((a) => (
                        <span
                          key={a}
                          className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
                        >
                          {a}
                        </span>
                      ))}
                    </div>

                    <ul className="mt-6 space-y-3">
                      {service.getItems.map((item) => (
                        <li key={item} className="flex gap-3 text-sm text-gray-700">
                          <CheckCircle2 className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/contactez-nous"
                      className="mt-8 inline-flex items-center gap-2 bg-[#14171a] hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
                    >
                      Demander un devis pour ce service
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image src={service.image} alt={service.title} fill className="object-cover" />
                  </div>
                </Reveal>
              </div>

              {service.id === "fret" && (
                <Reveal delay={160}>
                  <div className="mt-4 grid sm:grid-cols-3 gap-4">
                    {[
                      { icon: Calendar, label: "Fréquence des départs", value: "4 départs par mois depuis Anvers" },
                      { icon: Clock3, label: "Délai indicatif", value: "≈ 3 semaines après le départ du conteneur" },
                      { icon: Coins, label: "Tarif fret maritime", value: "À partir de 600 €/m³" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                        <stat.icon className="w-5 h-5 text-orange-600" />
                        <p className="mt-3 font-bold text-[#14171a]">{stat.value}</p>
                        <p className="mt-1 text-xs text-gray-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Délai et tarif donnés à titre indicatif ; ils peuvent varier selon les caractéristiques de
                    l&apos;expédition et les conditions logistiques et douanières.
                  </p>
                </Reveal>
              )}
            </section>
          ))}
        </div>

        {/* Commerce général — offering outside the four core services */}
        <section className="py-16 md:py-24 bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Reveal>
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden order-2 lg:order-1">
                  <Image src="/images/commerce-general.png" alt="Commerce général" fill className="object-cover" />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#14171a] flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-500">Nos boutiques au Cameroun</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#14171a] tracking-tight">Commerce général</h2>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    En complément de nos services d&apos;expédition, Danemo vend directement dans ses boutiques au
                    Cameroun :
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                    {[
                      "Produits de bureau (ramettes de papier...)",
                      "Électroménager (frigos, micro-ondes, ventilateurs...)",
                      "Produits d'hygiène",
                      "Ustensiles de cuisine (marmites, couverts, poêles...)",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
                <Ship className="w-5 h-5" />
                <Plane className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#14171a] tracking-tight text-balance">
                Un projet en tête ? Parlons-en.
              </h2>
              <p className="mt-3 text-gray-600">
                Quel que soit le service concerné, notre équipe étudie votre besoin et vous propose une solution
                adaptée.
              </p>
              <Link
                href="/contactez-nous"
                className="mt-7 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
              >
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
