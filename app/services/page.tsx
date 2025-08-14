import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">Services</h1>

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
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">Fret maritime et Aérien</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous sommes spécialisés dans le transport de vos colis vers le Cameroun, mais recevons vos colis,
                  après conditionnement, les voila sont transportés et livrés dans un délai moyen d'un mois.
                </p>
              </div>
            </div>
          </section>

          {/* Commerce général */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">Commerce général</h2>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">Nous vendons dans nos magasins au Cameroun :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Produits de bureau (rame de papiers...)</li>
                    <li>Électroménager (frigos, micro-ondes, télévisions, ventilateurs, Mixeurs, fer repassé...)</li>
                    <li>Les produits d'hygiène</li>
                    <li>Ustensiles de cuisine (marmites, couverts, poêles...)</li>
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
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">Conditionnement des colis</h2>
                <p className="text-gray-700 leading-relaxed">
                  Conscient qu'un bon emballage garantit à 90% la sécurité d'un colis, Danemo met à la disposition des
                  clients un service approprié pour le conditionnement des colis.
                </p>
              </div>
            </div>
          </section>

          {/* Dédouanement Véhicules, Conteneurs et Marchandises */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">
                  Dédouanement Véhicules, Conteneurs et Marchandises
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Dans le souci d'aider la diaspora, Danemo a mis sur pieds un service de aide dans l'achat des
                  véhicules, facilite sa procédure de dédouanement en mettant à disposition des clients des déclarants
                  agréés, en outre Danemo Srl fait le suivi des commandes de marchandises, dédouane et les achemine pour
                  des clients qui résident en Afrique ou dans la diaspora.
                </p>
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
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">Négoce</h2>
                <p className="text-gray-700 leading-relaxed">
                  Danemo mets en contact les petites et moyennes entreprise avec les fournisseurs pour faciliter l'achat
                  et le transport des marchandises et matières premières.
                </p>
              </div>
            </div>
          </section>

          {/* Déménagement international */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif">Déménagement international</h2>
                <p className="text-gray-700 leading-relaxed">
                  Danemo mets à la disposition des personnes désireuses déménager à l'étranger, le conteneur et un
                  service spécialisé dans le déménagement international des meubles, le conditionnement et le chargement
                  dans le conteneur.
                </p>
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
