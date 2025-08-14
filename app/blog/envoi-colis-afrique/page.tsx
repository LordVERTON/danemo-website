import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function EnvoiColisAfriquePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">
              Comment bien préparer un envoi de colis vers l'Afrique ? Les conseils de Danemo
            </h1>
            <p className="text-gray-600 text-sm">24/07/2025</p>
          </header>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Envoyer un colis vers l'Afrique, que ce soit à des proches pour des raisons professionnelles, demande un
              minimum d'organisation. Entre le choix de l'emballage, la déclaration douanière et les délais de
              livraison, il est important de savoir ce qu'il faut éviter et les meilleures pratiques pour un envoi
              réussi. <strong>Danemo SRL</strong>, votre partenaire de confiance, vous guide pour un envoi réussi.
            </p>
          </div>

          <div className="mb-8">
            <Image
              src="/images/terminal-portuaire-aerien.png"
              alt="Terminal portuaire avec grues et conteneurs"
              width={600}
              height={400}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Pourquoi anticiper son envoi de colis ?</h2>
            <p className="text-gray-700 mb-4">
              Beaucoup de gens s'imaginent qu'envoyer un colis à l'étranger à la dernière minute est aussi simple de
              l'envoyer en France. En réalité :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                Vous <strong>choisissez</strong> la <strong>meilleure date de départ</strong> (sans départs pour
                l'étranger samedi ?)
              </li>
              <li>
                Vous <strong>évitez</strong> les <strong>risques de blocage administratif</strong>
              </li>
              <li>
                Vous <strong>bénéficiez</strong> des <strong>meilleurs tarifs de groupage</strong>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">1. Choisissez un emballage solide et sécurisé</h2>
            <p className="text-gray-700 mb-4">Un bon emballage, c'est la base. Utilisez :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                Des <strong>cartons renforcés</strong>
              </li>
              <li>
                Du <strong>papier bulle</strong> ou des <strong>protections internes</strong>
              </li>
              <li>
                Du <strong>papier adhésif de qualité</strong>
              </li>
            </ul>
            <p className="text-gray-700">
              Évitez les sacs en emballage fragile : ils ne résistent facilement pendant le transport.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">2. Étiquetez correctement votre colis</h2>
            <p className="text-gray-700 mb-4">Assurez l'étiquetage :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                Le <strong>nom complet</strong> du destinataire
              </li>
              <li>
                Son <strong>adresse précise</strong> (quartier, rue, téléphone)
              </li>
              <li>
                Le <strong>pays de destination</strong>
              </li>
              <li>
                Votre <strong>adresse de retour</strong> en cas de problème
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">3. Préparez la liste de contenu</h2>
            <p className="text-gray-700 mb-4">
              <strong>Danemo</strong> vous demande une <strong>liste détaillée des objets envoyés</strong>. Cette étape
              permet :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                De <strong>faciliter</strong> le passage en douane
              </li>
              <li>
                D'<strong>assurer</strong> vos objets interdits
              </li>
              <li>
                D'<strong>estimer votre colis à sa juste</strong> valeur
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">4. Vérifiez les objets autorisés à l'envoi</h2>
            <p className="text-gray-700 mb-4">
              Chaque pays a ses restrictions. Par exemple : certains produits électroniques, médicaments ou cosmétiques
              peuvent être interdits ou soumis à des conditions d'entrée.
            </p>
            <p className="text-gray-700">
              <strong>Assurez</strong>-vous d'envoyer des produits autorisés ou de grande valeur sans protection
              particulière.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">5. Choisissez un prestataire fiable</h2>
            <p className="text-gray-700 mb-4">
              Avec <strong>Danemo</strong> :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>
                Vos colis sont <strong>chargés en toute sécurité</strong>
              </li>
              <li>
                Vous bénéficiez d'un <strong>suivi personnalisé</strong>
              </li>
              <li>
                Vous êtes informé des <strong>délais de départ et des délais estimés de livraison</strong>
              </li>
            </ul>
          </section>

          <section className="mb-8 bg-orange-50 p-6 rounded-lg">
            <h2 className="text-2xl font-serif text-amber-700 mb-4">Prêt à envoyer votre colis ?</h2>
            <p className="text-gray-700">
              Contactez <strong>Danemo</strong> dès maintenant pour connaître les prochaines dates de départ, recevoir
              un devis, et préparer votre colis en toute sérénité.
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
