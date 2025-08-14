import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function EnvoiConteneurErreursPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">
              Envoi de conteneur vers l'Afrique : 7 erreurs fréquentes à éviter absolument
            </h1>
            <p className="text-gray-600 text-sm">24/07/2025</p>
          </header>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Envoyer un conteneur vers l'Afrique représente un projet important, que ce soit pour un{" "}
              <strong>déménagement personnel</strong>, un <strong>transfert professionnel</strong> ou un{" "}
              <strong>approvisionnement commercial</strong>. Mais attention : certaines erreurs courantes peuvent coûter
              cher, en temps comme en argent. <strong>Danemo</strong>, spécialiste de l'expédition vers l'Afrique, vous
              aide à éviter les pièges les plus fréquents pour que votre conteneur arrive à bon port sans stress.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">1. Ne pas anticiper les délais</h2>
            <p className="text-gray-700 mb-4">
              Beaucoup pensent qu'un conteneur peut être chargé et <strong>expédié</strong> du jour au lendemain. En
              réalité, une expédition demande du temps :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Préparation des biens</li>
              <li>Formalités douanières</li>
              <li>Réservation du conteneur</li>
              <li>Logistique de chargement</li>
            </ul>
            <p className="text-gray-700">
              <strong>Conseil Danemo</strong> : contactez-nous au moins <strong>10 jours à l'avance</strong> pour une
              meilleure planification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">2. Mal estimer le volume à expédier</h2>
            <p className="text-gray-700 mb-4">
              Une erreur fréquente est de choisir un conteneur <strong>trop petit</strong>, ou trop grand. Cela génère :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Des frais inutiles</li>
              <li>Des difficultés de chargement</li>
              <li>Un gaspillage d'espace ou d'argent</li>
            </ul>
            <p className="text-gray-700">
              <strong>Astuce</strong> : faites un <strong>inventaire précis</strong> ou demandez notre aide pour
              l'estimation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">3. Négliger l'emballage et la protection</h2>
            <p className="text-gray-700 mb-4">
              Un conteneur subit des <strong>secousses</strong>, des <strong>variations de température</strong> et
              parfois de <strong>l'humidité</strong>. Évitez les objets mal protégés, c'est primordial en voyage :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Emballage</li>
              <li>Déshumidification</li>
              <li>Cristallisation</li>
            </ul>
            <p className="text-gray-700">
              <strong>Danemo</strong> vous propose des <strong>solutions d'emballage adaptées</strong> : caisses,
              cartons, palettes étanches.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">4. Oublier certains documents administratifs</h2>
            <p className="text-gray-700 mb-4">
              Un conteneur sans les bons papiers peut être <strong>bloqué à la douane</strong> pendant plusieurs jours,
              voire refoulé. Les documents à ne jamais oublier :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Facture ou liste de colisage</li>
              <li>Copie de carte d'identité</li>
              <li>Attestation de déménagement (si les éléments)</li>
            </ul>
            <p className="text-gray-700">
              <strong>Conseil</strong> : Danemo vous accompagne dans la préparation de{" "}
              <strong>tous vos documents douaniers</strong>.
            </p>
          </section>

          <div className="mb-8">
            <Image
              src="/images/containers-shipping-port.png"
              alt="Conteneurs colorés dans un port"
              width={600}
              height={400}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              5. Mettre des objets interdits dans le conteneur
            </h2>
            <p className="text-gray-700 mb-4">Certains produits sont strictement interdits :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Armes</li>
              <li>Produits chimiques</li>
              <li>Médicaments non déclarés</li>
              <li>Alcool en grande quantité</li>
            </ul>
            <p className="text-gray-700">
              <strong>Résultat</strong> : votre conteneur peut être saisi ou retardé.
            </p>
            <p className="text-gray-700">
              <strong>Danemo vérifie</strong> avec vous la conformité du contenu pour éviter tout problème.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">6. Mal charger le conteneur</h2>
            <p className="text-gray-700 mb-4">Le chargement mal réparti peut :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Endommager les biens pendant le transport</li>
              <li>Créer des déséquilibres</li>
              <li>Rendre le déchargement compliqué à l'arrivée</li>
            </ul>
            <p className="text-gray-700">
              <strong>Nos équipes professionnelles</strong> s'occupent du chargement pour optimiser l'espace et
              sécuriser vos produits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">7. Ne pas assurer son envoi</h2>
            <p className="text-gray-700 mb-4">
              Même avec toutes les précautions du monde, un incident peut survenir durant le transport : perte
              partielle, dégât des eaux, accident de manutention, etc. <strong>Une assurance</strong> vous couvre contre
              ces risques.
            </p>
            <p className="text-gray-700">
              <strong>Danemo propose une assurance adaptée à votre envoi</strong>, à partir de 3% du prix.
            </p>
          </section>

          <section className="mb-8 bg-orange-50 p-6 rounded-lg">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">
              En résumé : pour un envoi de conteneur réussi, faites confiance à des pros
            </h2>
            <p className="text-gray-700 mb-4">
              <strong>Danemo SRL</strong> vous accompagne de A à Z :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Estimation</li>
              <li>Préparation des documents</li>
              <li>Emballage sécurisé</li>
              <li>Chargement et suivi</li>
              <li>Livraison jusqu'au Cameroun (et ailleurs vers l'Afrique)</li>
            </ul>
            <p className="text-gray-700">
              <strong>Contactez-nous dès maintenant</strong> pour un devis personnalisé ou un accompagnement sur votre
              projet de confiance.
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
