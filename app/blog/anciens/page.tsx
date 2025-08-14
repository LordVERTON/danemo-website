import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default function AnciensArticles() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-50 to-orange-100 py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-600 mb-4">Blog</h1>
            <div className="w-24 h-1 bg-orange-500 mx-auto"></div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              {/* Article 1 */}
              <article className="bg-white rounded-lg overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="order-2 md:order-1">
                    <div className="p-6 md:p-0">
                      <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif leading-tight">
                        <Link
                          href="/blog/demenagement-diplomatique"
                          className="hover:text-orange-600 transition-colors"
                        >
                          Comment organiser un déménagement diplomatique en toute sérénité avec Danemo ?
                        </Link>
                      </h2>
                      <p className="text-gray-500 text-sm mb-4">24/07/2025</p>
                      <p className="text-gray-700 leading-relaxed mb-6">
                        Organiser un déménagement diplomatique peut vite devenir un casse-tête logistique, surtout
                        lorsque chaque détail compte. Entre les délais à respecter, les formalités douanières et la
                        protection des biens personnels, il est essentiel de faire appel à un partenaire de confiance.{" "}
                        <strong>Danemo</strong>, spécialiste de l'import-export entre l'Europe et l'Afrique,...
                      </p>
                      <Link
                        href="/blog/demenagement-diplomatique"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      >
                        Lire la suite
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <Image
                      src="/images/demenagement-couple-moderne.png"
                      alt="Déménagement diplomatique"
                      width={400}
                      height={250}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </article>

              {/* Article 2 */}
              <article className="bg-white rounded-lg overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="order-2 md:order-1">
                    <div className="p-6 md:p-0">
                      <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif leading-tight">
                        <Link href="/blog/envoi-colis-afrique" className="hover:text-orange-600 transition-colors">
                          Comment bien préparer un envoi de colis vers l'Afrique ? Les conseils de Danemo
                        </Link>
                      </h2>
                      <p className="text-gray-500 text-sm mb-4">24/07/2025</p>
                      <p className="text-gray-700 leading-relaxed mb-6">
                        Envoyer un colis vers l'Afrique, que ce soit à un proche ou pour des raisons professionnelles,
                        demande un minimum d'organisation. Entre le choix de l'emballage, la déclaration douanière et
                        les délais de livraison, il est important de suivre certaines étapes pour éviter les mauvaises
                        surprises. Spécialiste de l'envoi de colis vers le Cameroun, ...
                      </p>
                      <Link
                        href="/blog/envoi-colis-afrique"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      >
                        Lire la suite
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <Image
                      src="/images/terminal-portuaire-aerien.png"
                      alt="Envoi de colis vers l'Afrique"
                      width={400}
                      height={250}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </article>
            </div>

            {/* Navigation */}
            <div className="text-center mt-12">
              <Link
                href="/blog"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Articles récents
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
