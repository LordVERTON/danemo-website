import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Reveal } from "@/components/reveal"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Anciens articles",
  description: "Retrouvez les anciens articles du blog Danemo sur l'expédition et le déménagement vers l'Afrique.",
}

const olderPosts = [
  {
    title: "Comment organiser un déménagement diplomatique en toute sérénité avec Danemo ?",
    date: "24/07/2025",
    excerpt:
      "Organiser un déménagement diplomatique peut vite devenir un casse-tête logistique, surtout lorsque chaque détail compte. Entre les délais à respecter, les formalités douanières et la protection des biens personnels, il est essentiel de faire appel à un partenaire de confiance. Danemo, spécialiste de l'import-export entre l'Europe et l'Afrique,...",
    image: "/images/demenagement-couple-moderne.png",
    slug: "demenagement-diplomatique",
  },
  {
    title: "Comment bien préparer un envoi de colis vers l'Afrique ? Les conseils de Danemo",
    date: "24/07/2025",
    excerpt:
      "Envoyer un colis vers l'Afrique, que ce soit à un proche ou pour des raisons professionnelles, demande un minimum d'organisation. Entre le choix de l'emballage, la déclaration douanière et les délais de livraison, il est important de suivre certaines étapes pour éviter les mauvaises surprises. Spécialiste de l'envoi de colis vers le Cameroun, ...",
    image: "/images/terminal-portuaire-aerien.png",
    slug: "envoi-colis-afrique",
  },
]

export default function AnciensArticles() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <section className="bg-[#14171a] pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <Reveal>
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3">Blog</p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-balance">
                Anciens articles
              </h1>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="space-y-8">
              {olderPosts.map((post, i) => (
                <Reveal key={post.slug} delay={i * 80}>
                  <article className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-auto">
                        <Image src={post.image} alt={post.title} fill className="object-cover" />
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
                href="/blog"
                className="inline-flex items-center gap-1.5 text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
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
