import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function DemenagementDiplomatiquePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">
              Comment organiser un déménagement diplomatique en toute sérénité avec Danemo ?
            </h1>
            <p className="text-gray-600 text-sm">24/07/2025</p>
          </header>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Organiser un déménagement diplomatique peut vite devenir un casse-tête logistique, surtout lorsqu'il
              s'agit de respecter les formalités douanières et la protection des biens personnels. Il est essentiel de
              faire appel à un partenaire de confiance. <strong>Danemo</strong>, spécialiste des transferts
              internationaux, vous accompagne dans cette étape importante pour que vos effets personnels diplomatiques
              dans leurs transferts internationaux, en matière fiscale et sécurisée.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              Pourquoi un déménagement diplomatique nécessite une expertise particulière ?
            </h2>
            <p className="text-gray-700 mb-4">
              Contrairement à un déménagement classique, un déménagement diplomatique implique :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                Des <strong>objets de valeur</strong> et <strong>effets personnels sensibles</strong>
              </li>
              <li>
                Des <strong>formalités administratives spécifiques</strong> selon les conventions internationales
              </li>
              <li>
                Des <strong>délais serrés</strong> souvent imposés par des fins de mission ou des mutations
                diplomatiques
              </li>
              <li>
                Un <strong>niveau de service</strong> et de <strong>discrétion</strong> élevé
              </li>
            </ul>
            <p className="text-gray-700">
              C'est pourquoi il est recommandé de faire appel à une entreprise spécialisée, capable d'offrir un{" "}
              <strong>service sur mesure, discret et fiable</strong>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              Danemo, votre allié logistique pour un départ sans stress
            </h2>
            <p className="text-gray-700 mb-4">
              Fort de son expertise dans les transports entre l'Europe et l'Afrique, <strong>Danemo SRL</strong> propose
              une <strong>prise en charge complète</strong> de votre déménagement diplomatique, de l'Europe vers
              l'Afrique.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Un accompagnement de ce bout</h3>
            <p className="text-gray-700 mb-4">Nous gérons :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                L'<strong>emballage sécurisé</strong> de vos biens
              </li>
              <li>
                Le <strong>chargement et transport</strong> en conteneur
              </li>
              <li>
                Le <strong>dédouanement</strong>
              </li>
              <li>
                La <strong>livraison à domicile</strong> ou dans vos nouveaux locaux
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Des atouts certains</h3>
            <p className="text-gray-700 mb-4">
              Nos partenaires partent <strong>tous les samedis</strong>, garantissent une grande réactivité et une
              organisation méthodique.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Un service sur mesure</h3>
            <p className="text-gray-700">
              Danemo adapte ses prestations à vos besoins spécifiques : volumes, délais, conditions particulières...
              Nous discutons avec un professionnel tout au long du processus.
            </p>
          </section>

          <div className="mb-8">
            <Image
              src="/images/demenagement-couple-moderne.png"
              alt="Couple préparant un déménagement diplomatique"
              width={600}
              height={400}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Un réseau fiable entre l'Europe et le Cameroun</h2>
            <p className="text-gray-700 mb-4">
              Avec des équipes basées en Belgique et au Cameroun, Danemo garantit une{" "}
              <strong>coordination fluide entre les deux continents</strong>. Vous bénéficiez d'un{" "}
              <strong>interlocuteur unique</strong> pour gérer l'ensemble des démarches, en toute transparence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Prêt à déménager l'esprit tranquille ?</h2>
            <p className="text-gray-700 mb-4">
              Que vous soyez en fin de mission diplomatique ou sur le point d'être affecté dans une nouvelle ville,{" "}
              <strong>Danemo</strong> vous accompagne à <strong>chaque étape</strong> de votre{" "}
              <strong>transfert</strong>.
            </p>
            <p className="text-gray-700">
              <strong>Contactez-nous dès maintenant</strong> pour recevoir un devis personnalisé et organiser votre
              déménagement diplomatique en toute sérénité.
            </p>
          </section>
        </article>

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            ← Retour au blog
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
