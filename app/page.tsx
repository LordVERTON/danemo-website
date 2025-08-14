import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="/images/services-fret.webp"
            alt="NYK LINE Container ship"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4">
          <div className="bg-white/90 px-8 py-4 rounded-lg mb-6 inline-block">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800">Transit entre Bruxelles - Douala- Yaoundé</h1>
          </div>
          <div className="inline-block bg-orange-500 px-6 py-3 rounded-lg">
            <h2 className="text-lg md:text-xl font-bold italic">"Rapprocher plus vite l'Afrique de la Diaspora"</h2>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-center mb-8 italic">À propos</h2>

              <div className="space-y-6 text-lg leading-relaxed">
                <p>
                  Crée en Juin 2021, Danemo Srl est une entreprise de transport international qui s'occupe de l'envoi
                  des colis de toute nature entre l'Europe et le Cameroun.
                </p>
                <p>
                  Nous sommes spécialisés dans le réception, le reconditionnement, le transport et le dédouanement de
                  vos marchandises, véhicules, effets personnels et autres.
                </p>
                <p>Pour tous vos besoins, nous mettons à votre disposition :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Des déclarants agrées et spécialisés dans le dédouanent des véhicules et conteneur.</li>
                  <li>
                    Une équipe spécialisée dans le conditionnement des colis mettant ainsi un point d'honneur sur leur
                    sécurité.
                  </li>
                  <li>Un grand entrepôt de 500 m carré au Cameroun qui sert à stocker vos colis.</li>
                  <li>Une équipe spécialisé au dépotage et dispatching des dits colis</li>
                </ul>

                <div className="bg-orange-50 p-6 rounded-lg mt-8">
                  <p className="text-lg font-semibold text-orange-800">
                    Nous vous rassurons de la sécurité de vos envois et d'un délai de livraison de 1 mois maximum après
                    confirmation du départ du bateau.
                  </p>
                  <p className="text-lg font-semibold text-orange-800 mt-2">
                    Nous organisons un chargement tous les 2 semaines pour satisfaire la demande.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Image src="/images/logo.webp" alt="Danemo Logo" width={400} height={300} className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Prochain Départ Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Prochain départ</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-700 mb-2">Date de départ :</h3>
              <p className="text-lg text-gray-600">À confirmer</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-700 mb-2">Date d'arrivée prévue :</h3>
              <p className="text-lg text-gray-600">À confirmer</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-700 mb-2">Statut du chargement :</h3>
              <p className="text-lg text-gray-600">En préparation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nos activités</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Fret maritime et aérien */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/fret-maritime-aerien.png"
                  alt="Fret maritime et aérien"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-orange-600 italic">Fret maritime et aérien</h3>
                <p className="text-gray-600 italic">Nous vous offrons le transport maritime et aérien</p>
              </div>
            </Link>

            {/* Commerce général */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image src="/images/services-commerce.webp" alt="Commerce général" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-orange-600 italic">Commerce général</h3>
                <p className="text-gray-600 italic">Nous vendons dans nos magasins au Cameroun plusieurs produits</p>
              </div>
            </Link>

            {/* Dédouanement */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/dedouanement-vehicules-updated.png"
                  alt="Dédouanement"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-3 text-orange-600 italic">
                  Dédouanement véhicules,Conteneur et Marchandises
                </h3>
                <p className="text-gray-600 italic">
                  Nous effectuons vos procédures de dédouanement de voiture au Cameroun
                </p>
              </div>
            </Link>

            {/* Négoce */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image src="/images/negoce.png" alt="Négoce" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-orange-600 italic">Négoce</h3>
                <p className="text-gray-600 italic">
                  Nous mettons en contact les petites et moyennes entreprises avec les fournisseurs pour faciliter
                  l'achat des marchandises et autres
                </p>
              </div>
            </Link>

            {/* Déménagement */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image src="/images/demenagement-international.png" alt="Déménagement" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-orange-600 italic">Déménagement</h3>
                <p className="text-gray-600 italic">
                  Danemo mets à la disposition des personnes désireuse dénénager pour l'étranger, le conteneur et autres
                </p>
              </div>
            </Link>

            {/* Manutention */}
            <Link
              href="/services"
              className="service-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/conditionnement-colis-updated.png"
                  alt="Manutention"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 text-orange-600 italic">Manutention</h3>
                <p className="text-gray-600 italic">
                  {
                    "Nous disposons d'un grand entrepôt pour la réception de colis et véhicules à destination de l'Afrique"
                  }
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Témoignages</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/L1e6I_c57jI"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/46S7xTtEFaM"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/M1l--qBwoCk"
                className="w-full h-full rounded-lg"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Brussels Map */}
            <div className="lg:col-span-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976!2d4.3520295!3d50.8684709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2savenue+du+port+108%2C+1000+Bruxelles!5e0!3m2!1sfr!2sBE!4v1751895260000"
                className="w-full h-64 rounded-lg"
                loading="lazy"
              ></iframe>
            </div>

            {/* Brussels Contact */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold mb-4">Contact à Bruxelles</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">Danemo Srl</p>
                  <p className="font-semibold">Avenue du port 108 - 110, 1000 Bruxelles</p>
                  <p className="font-semibold">Kai 299 porte 2.60</p>
                </div>
                <div>
                  <p className="font-semibold">+32488645183</p>
                </div>
                <div>
                  <p className="font-semibold">info@danemo.be</p>
                </div>
              </div>
            </div>

            {/* Cameroon Map */}
            <div className="lg:col-span-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976!2d11.4889261!3d3.8316289!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2stam+tam+week+-end+yaounde+cameroun!5e0!3m2!1sfr!2sBE!4v1751895260000"
                className="w-full h-64 rounded-lg"
                loading="lazy"
              ></iframe>
            </div>

            {/* Cameroon Contact */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold mb-4">Contact au Cameroun</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-center">YAOUNDE : Biyem-assi Tam-Tam Week-end</p>
                  <p className="font-semibold">Tel : +237690262004</p>
                </div>
                <div>
                  <p className="font-semibold">DOUALA : Youpwe</p>
                  <p className="font-semibold">Tel : +237655512598</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
