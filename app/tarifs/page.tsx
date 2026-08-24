import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import Link from "next/link"
import { ArrowRight, Luggage, Refrigerator, Sofa, Tv } from "lucide-react"

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Fret maritime à partir de 600 €/m³. Consultez nos tarifs indicatifs par article pour l'envoi de vos biens vers le Cameroun.",
}

const CATEGORIES = [
  {
    title: "Mobilier & salon",
    icon: Sofa,
    items: [
      { label: "Canapé 2 places, à partir de", price: "250 €" },
      { label: "Canapé 3 places, à partir de", price: "350 €" },
      { label: "Canapé d'angle, à partir de", price: "350 €" },
      { label: "Salon complet (canapé 2/3 places et table basse)", price: "800 €" },
      { label: "Matelas, à partir de", price: "100 €" },
    ],
  },
  {
    title: "Électroménager",
    icon: Refrigerator,
    items: [
      { label: "Congélateur + de 500 litres, à partir de", price: "550 €" },
      { label: "Congélateur 150 – 250 litres, à partir de", price: "275 €" },
      { label: "Congélateur 251 – 490 litres, à partir de", price: "350 €" },
      { label: "Réfrigérateur 140 cm, à partir de", price: "220 €" },
      { label: "Réfrigérateur 170 cm, à partir de", price: "280 €" },
      { label: "Réfrigérateur 190 cm, à partir de", price: "310 €" },
      { label: "Réfrigérateur américain, à partir de", price: "400 €" },
      { label: "Réfrigérateur de chambre, à partir de", price: "120 €" },
      { label: "Cuisinière + de 4 foyers, à partir de", price: "175 €" },
      { label: "Cuisinière − de 4 foyers, à partir de", price: "160 €" },
      { label: "Lave-linge − de 10 kg", price: "180 €" },
      { label: "Lave-linge 6 – 10 kg", price: "165 €" },
      { label: "Micro-ondes standard", price: "40 €" },
      { label: "Groupe électrogène, à partir de", price: "220 €" },
    ],
  },
  {
    title: "Multimédia",
    icon: Tv,
    items: [
      { label: "Téléviseur jusqu'à 30 pouces", price: "100 €" },
      { label: "Téléviseur jusqu'à 40 pouces", price: "150 €" },
      { label: "Téléviseur 50 pouces et plus, à partir de", price: "300 €" },
    ],
  },
  {
    title: "Bagagerie, mobilité & divers",
    icon: Luggage,
    items: [
      { label: "Cantine 100 cm", price: "140 €" },
      { label: "Cantine 80/90 cm", price: "125 €" },
      { label: "Carreaux (prix par palette)", price: "700 €/m³" },
      { label: "Fût Orange, prix de vente vide", price: "30 €" },
      { label: "Fût Orange 220 L", price: "170 €" },
      { label: "Moteur véhicule, à partir de", price: "400 €" },
      { label: "Vélo adulte", price: "75 €" },
      { label: "Vélo enfant", price: "35 €" },
    ],
  },
]

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Tarifs</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Des prix clairs, sans surprise.
              </h1>
              <p className="mt-5 text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
                Le fret maritime est proposé à partir de <strong className="text-white">600 €/m³</strong>. Retrouvez
                ci-dessous nos tarifs indicatifs par article — le tarif définitif peut varier selon la valeur
                marchande et les caractéristiques de votre expédition.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {CATEGORIES.map((category, i) => (
                <Reveal key={category.title} delay={i * 80}>
                  <div className="h-full bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-5 bg-[#faf9f7] border-b border-gray-200">
                      <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                        <category.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <h2 className="font-bold text-[#14171a]">{category.title}</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {category.items.map((item) => (
                        <li key={item.label} className="flex justify-between items-center gap-4 px-6 py-3.5 hover:bg-orange-50/40 transition-colors">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-bold text-[#14171a] whitespace-nowrap">{item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="mt-12 rounded-2xl bg-orange-50 border border-orange-100 p-8 md:p-10 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-[#14171a]">
                  Votre article ne figure pas dans la liste ?
                </h2>
                <p className="mt-2 text-gray-600 max-w-xl mx-auto">
                  Contactez-nous avec le détail de votre envoi : nous vous répondons avec un devis personnalisé.
                </p>
                <Link
                  href="/contactez-nous?sujet=Demande%20de%20devis"
                  className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
                >
                  Demander un devis personnalisé
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
