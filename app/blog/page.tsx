import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog",
  description: "Conseils et actualités Danemo sur l'envoi de colis, le dédouanement et le déménagement vers l'Afrique.",
}

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
    image: "/images/containers-shipping-port.png",
    slug: "envoi-conteneur-erreurs",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Blog</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Conseils et actualités Danemo
              </h1>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="space-y-8">
              {blogPosts.map((post, i) => (
                <Reveal key={post.id} delay={i * 80}>
                  <article className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-auto">
                        <Image
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-7 flex flex-col justify-center">
                        <p className="text-xs text-gray-400 mb-2">{post.date}</p>
                        <h2 className="text-xl font-bold text-[#14171a] leading-snug">
                          <Link href={`/blog/${post.slug}`} className="hover:text-orange-600 transition-colors">
                            {post.title}
                          </Link>
                        </h2>
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 group-hover:gap-2.5 transition-all"
                        >
                          Lire la suite
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/blog/anciens"
                className="inline-flex items-center gap-1.5 text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                Anciens articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
