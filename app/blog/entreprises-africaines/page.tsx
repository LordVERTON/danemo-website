import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function EntreprisesAfricainesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">
              Entreprises africaines : facilitez vos achats en Europe grâce à Danemo, votre partenaire logistique de
              confiance
            </h1>
            <p className="text-gray-600 text-sm">24/07/2025</p>
          </header>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Vous êtes une entreprise basée au Cameroun ou ailleurs en Afrique, et vous commandez régulièrement des
              produits en Europe ? La gestion de vos expéditions peut vite devenir un vrai casse-tête : fournisseurs
              multiples, délais différents, frais élevés, suivi compliqué... Heureusement, Danemo SRL est là pour vous
              simplifier la vie.
            </p>
          </div>

          <div className="mb-8">
            <Image
              src="/images/entreprises-africaines-bureau.png"
              alt="Professionnels africains travaillant ensemble dans un bureau moderne"
              width={600}
              height={400}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              Danemo, l'intermédiaire logistique entre vos fournisseurs européens et votre entreprise
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Danemo vous propose un service sur mesure : nous centralisons vos commandes auprès de tous vos
              fournisseurs européens et nous occupons de tout le reste. Fini les expéditions vers votre entreprise en
              Afrique !
            </p>
            <p className="text-gray-700 leading-relaxed">
              Vous n'avez plus besoin de coordonner chaque envoi avec vos fournisseurs. Nous nous occupons de tout pour
              vous.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Comment ça fonctionne ?</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Vous commandez vos produits auprès de fournisseurs en France, Belgique, Allemagne (ou dans pays
                européen)
              </li>
              <li>Vous faites livrer directement les colis à notre entrepôt en Belgique</li>
              <li>Nous réceptionnons, vérifions et stockons vos marchandises pour vous</li>
              <li>Nous regroupons tous vos colis en un seul envoi groupé vers l'Afrique</li>
              <li>Nous expédions vers votre entreprise au Cameroun (ou ailleurs, selon vos besoins de déstockage)</li>
              <li>Vous recevez vos marchandises en colis regroupés, avec un seul interlocuteur</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              Quels types d'entreprises peuvent faire appel à Danemo ?
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Boutiques en gros à partir de commandes très acheteuses en Europe</li>
              <li>Revendeurs de pièces détachées, matériel informatique ou électroménager</li>
              <li>Entreprises qui importent du matériel professionnel (salon de beauté, restaurant, chantier...)</li>
              <li>Pharmacies et commerce ou grossistes</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Peu importe votre secteur d'activité, nous <strong>adaptons le service à vos besoins</strong>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Vos avantages en travaillant avec Danemo</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Optimisation de vos commandes</h3>
            <p className="text-gray-700 mb-4">
              En cas de frais de transport relativement élevé chaque colis,{" "}
              <strong>nous regroupons tous vos achats</strong> en un seul envoi logistique.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Gain de temps</h3>
            <p className="text-gray-700 mb-4">
              Vous ne perdez plus de temps à suivre chaque fournisseur.{" "}
              <strong>Danemo gère la logistique à votre place</strong>.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Réduction des coûts</h3>
            <p className="text-gray-700 mb-4">
              Avec notre système de <strong>groupage</strong> et nos tarifs négociés, vous bénéficiez de{" "}
              <strong>tarifs préférentiels</strong> sur le transport.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Suivi personnalisé</h3>
            <p className="text-gray-700 mb-4">
              Vous êtes informé à chaque étape : <strong>réception, chargement, envoi, arrivée</strong>. Nous restons
              disponibles pour répondre à vos questions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Sécurité et fiabilité</h3>
            <p className="text-gray-700">
              Vos colis sont traités avec soin, <strong>emballés et étiquetés</strong> dans de{" "}
              <strong>délais annoncés</strong>. Nos envois vers l'Afrique partent chaque <strong>semaine</strong>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              Danemo, un partenaire logistique au service du commerce Afrique-Europe
            </h2>
            <p className="text-gray-700 mb-4">
              En tant qu'intermédiaire de choix, nous facilitons vos{" "}
              <strong>partenaires sérieux, réactif et professionnel</strong> pour toutes vos activités en Europe.
            </p>
            <p className="text-gray-700 mb-4">
              Notre équipe, basée en Belgique, est votre <strong>pont logistique fiable</strong>, sans l'Inde, votre
              chez-vous en Europe, votre activité.
            </p>
            <p className="text-gray-700">
              Contactez-nous dès aujourd'hui pour mettre en place un service sur mesure de réception et d'expédition qui
              répond pour votre entreprise.
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
