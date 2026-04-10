import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { readBlogPosts } from "@/lib/blog-posts"

export default async function DynamicBlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const posts = await readBlogPosts()
  const post = posts.find((item) => item.href === `/blog/${slug}` && item.isActive)

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-gray-600">Article introuvable.</p>
          <div className="mt-8 text-center">
            <Link href="/blog" className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              ← Retour au blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">{post.title}</h1>
            <p className="text-gray-600 text-sm">{post.date}</p>
          </header>

          <div className="mb-8">
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
            ) : (
              <Image
                src={post.mediaUrl || post.image || "/placeholder.svg"}
                alt={post.title}
                width={900}
                height={520}
                className="w-full rounded-lg shadow-lg"
              />
            )}
          </div>

          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">{post.excerpt}</p>
          </div>

          {post.sections.map((section) => {
            if (section.type === "heading2") {
              return <h2 key={section.id} className="text-2xl font-serif text-amber-700 mb-4">{section.text}</h2>
            }
            if (section.type === "heading3") {
              return <h3 key={section.id} className="text-xl font-semibold text-gray-800 mb-3">{section.text}</h3>
            }
            if (section.type === "paragraph") {
              return (
                <section key={section.id} className="mb-6">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
                </section>
              )
            }
            if (section.type === "highlight") {
              return (
                <section key={section.id} className="mb-6 bg-orange-50 p-6 rounded-lg">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
                </section>
              )
            }
            if (section.type === "bullet_list") {
              return (
                <section key={section.id} className="mb-6">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {(section.items || []).map((item, idx) => <li key={`${section.id}-${idx}`}>{item}</li>)}
                  </ul>
                </section>
              )
            }
            if (section.type === "numbered_list") {
              return (
                <section key={section.id} className="mb-6">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    {(section.items || []).map((item, idx) => <li key={`${section.id}-${idx}`}>{item}</li>)}
                  </ol>
                </section>
              )
            }
            if (section.type === "media") {
              const mediaType = section.mediaType || "image"
              return (
                <section key={section.id} className="mb-8">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  {mediaType === "video" ? (
                    <video src={section.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
                  ) : (
                    <Image src={section.mediaUrl || "/placeholder.svg"} alt={section.title || "Media"} width={900} height={520} className="w-full rounded-lg shadow-lg" />
                  )}
                </section>
              )
            }
            return null
          })}
        </article>

        <div className="mt-12 text-center">
          <Link
            href={post.backLinkHref || "/blog"}
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {post.backLinkLabel || "← Retour au blog"}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
