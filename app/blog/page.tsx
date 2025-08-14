import Header from "@/components/header"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title:
        "Entreprises africaines : facilitez vos achats en Europe grâce à Danemo, votre partenaire logistique de confiance",
      date: "24/07/2025",
      excerpt:
        "Vous êtes une entreprise basée au Cameroun ou ailleurs en Afrique, et vous commandez régulièrement des marchandises en Europe ? La gestion de vos expéditions peut vite devenir un casse-tête : fournisseurs multiples, colis dispersés, frais élevés, suivi compliqué... Heureusement, Danemo SRL est là pour vous simplifier la vie.",
      image: "/images/entreprises-africaines-bureau.png",
      slug: "entreprises-africaines",
    },
    {
      id: 2,
      title: "Envoi de conteneur vers l'Afrique : 7 erreurs fréquentes à éviter absolument",
      date: "24/07/2025",
      excerpt:
        "Envoyer un conteneur vers l'Afrique représente un projet important, que ce soit pour un déménagement personnel, un transfert professionnel ou un approvisionnement commercial. Mais attention : certaines erreurs courantes peuvent coûter cher, en temps comme en argent. Danemo, spécialiste du transport entre l'Europe et l'Afrique, vous partage les...",
      image: "/images/containers-shipping-port.png", // Updated to use new container image
      slug: "envoi-conteneur-erreurs",
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">Blog</h1>

          <div className="space-y-12">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="order-2 md:order-1">
                    <div className="p-6 md:p-0">
                      <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif leading-tight">
                        <Link href={`/blog/${post.slug}`} className="hover:text-orange-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-gray-500 text-sm mb-4">{post.date}</p>
                      <p className="text-gray-700 leading-relaxed mb-6">{post.excerpt}</p>
                      <Link
                        href={`/blog/${post.slug}`}
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
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      width={400}
                      height={250}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/blog/anciens"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Anciens articles
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
