'use client'

import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import { useI18n } from "@/lib/i18n"

export default function ServicesPage() {
  const { messages } = useI18n()
  const { title, sections } = messages.services

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">{title}</h1>

          {/* Fret maritime et Aérien */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <Image
                  src="/images/fret-maritime-aerien.png"
                  alt="Fret maritime et Aérien"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.freight.title}</h2>
                <p className="text-gray-700 leading-relaxed">{sections.freight.description}</p>
              </div>
            </div>
          </section>

          {/* Commerce général */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.commerce.title}</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">{sections.commerce.intro}</p>
                  <ul className="list-disc list-inside space-y-1">
                    {sections.commerce.items.map((item, index) => (
                      <li key={`commerce-item-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <Image
                  src="/images/commerce-general.png"
                  alt="Commerce général"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </div>
          </section>

          {/* Conditionnement des colis */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <Image
                  src="/images/conditionnement-colis-updated.png"
                  alt="Conditionnement des colis"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.packaging.title}</h2>
                <p className="text-gray-700 leading-relaxed">{sections.packaging.description}</p>
              </div>
            </div>
          </section>

          {/* Dédouanement Véhicules, Conteneurs et Marchandises */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.customs.title}</h2>
                <p className="text-gray-700 leading-relaxed">{sections.customs.description}</p>
              </div>
              <div>
                <Image
                  src="/images/dedouanement-vehicules-updated.png"
                  alt="Dédouanement Véhicules"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </div>
          </section>

          {/* Négoce */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <Image
                  src="/images/negoce.png"
                  alt="Négoce"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.trading.title}</h2>
                <p className="text-gray-700 leading-relaxed">{sections.trading.description}</p>
              </div>
            </div>
          </section>

          {/* Déménagement international */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">{sections.moving.title}</h2>
                <p className="text-gray-700 leading-relaxed">{sections.moving.description}</p>
              </div>
              <div>
                <Image
                  src="/images/demenagement-international.png"
                  alt="Déménagement international"
                  width={600}
                  height={400}
                  className="rounded-lg object-cover w-full"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
