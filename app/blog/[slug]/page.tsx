import Image from "next/image"
import Link from "next/link"
import type { CSSProperties } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { BlogPuckRenderer, hasPuckContent } from "@/components/blog-builder/BlogPuckRenderer"
import { articleToBlogPost, readPublicArticleBySlug, readPublicBlogPostBySlug, readPublicBlogPosts } from "@/lib/public-blog-posts"

function backgroundClass(background?: string) {
  if (background === "soft") return "bg-orange-50"
  if (background === "dark") return "bg-slate-900 text-white"
  return ""
}

function alignClass(align?: string) {
  if (align === "left") return "text-left"
  if (align === "right") return "text-right"
  return "text-center"
}

function mediaWidthStyle(width?: number): CSSProperties {
  const safeWidth = Math.min(100, Math.max(30, Number(width || 100)))
  return { width: `${safeWidth}%` }
}

export default async function DynamicBlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [posts, article, fallbackPost] = await Promise.all([
    readPublicBlogPosts(),
    readPublicArticleBySlug(slug),
    readPublicBlogPostBySlug(slug),
  ])
  const post = article ? articleToBlogPost(article) : fallbackPost
  const shouldRenderPuck = hasPuckContent(article?.puck_content)

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

          {shouldRenderPuck ? (
            <BlogPuckRenderer data={article?.puck_content} />
          ) : post.sections.map((section) => {
            const sectionBackground = backgroundClass(section.settings?.background)
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
                  <div className="mx-auto" style={mediaWidthStyle(section.settings?.width)}>
                    {mediaType === "video" ? (
                      <video src={section.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
                    ) : (
                      <Image src={section.mediaUrl || "/placeholder.svg"} alt={section.title || "Media"} width={900} height={520} className="w-full rounded-lg shadow-lg" />
                    )}
                  </div>
                </section>
              )
            }
            if (section.type === "text_image") {
              const mediaType = section.mediaType || "image"
              return (
                <section key={section.id} className={`mb-8 grid gap-6 rounded-lg p-0 md:grid-cols-2 ${sectionBackground}`}>
                  <div className="flex flex-col justify-center">
                    {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
                  </div>
                  <div className="mx-auto" style={mediaWidthStyle(section.settings?.width)}>
                    {mediaType === "video" ? (
                      <video src={section.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
                    ) : (
                      <Image src={section.mediaUrl || "/placeholder.svg"} alt={section.title || "Media"} width={900} height={520} className="w-full rounded-lg shadow-lg" />
                    )}
                  </div>
                </section>
              )
            }
            if (section.type === "columns") {
              const columnCount = section.settings?.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
              return (
                <section key={section.id} className={`mb-8 rounded-lg p-0 ${sectionBackground}`}>
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <div className={`grid gap-6 ${columnCount}`}>
                    {(section.columns || ["", ""]).map((column, idx) => (
                      <p key={`${section.id}-column-${idx}`} className="text-gray-700 leading-relaxed whitespace-pre-line">{column}</p>
                    ))}
                  </div>
                </section>
              )
            }
            if (section.type === "gallery") {
              return (
                <section key={section.id} className="mb-8">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(section.images || []).filter(Boolean).map((image, idx) => (
                      <Image key={`${section.id}-image-${idx}`} src={image} alt={`${section.title || "Galerie"} ${idx + 1}`} width={900} height={620} className="h-full min-h-64 w-full rounded-lg object-cover shadow-lg" />
                    ))}
                  </div>
                </section>
              )
            }
            if (section.type === "divider") {
              return <hr key={section.id} className="my-10 border-orange-200" />
            }
            if (section.type === "spacer") {
              const height = section.settings?.height === "large" ? "h-20" : section.settings?.height === "small" ? "h-6" : "h-12"
              return <div key={section.id} className={height} />
            }
            if (section.type === "button") {
              return (
                <section key={section.id} className={`mb-8 ${alignClass(section.settings?.align)}`}>
                  <Link href={section.buttonHref || "/contactez-nous"} className="inline-flex items-center rounded-md bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600">
                    {section.buttonLabel || "Contactez-nous"}
                  </Link>
                </section>
              )
            }
            if (section.type === "html") {
              return <section key={section.id} className="mb-8" dangerouslySetInnerHTML={{ __html: section.html || "" }} />
            }
            if (section.type === "faq") {
              return (
                <section key={section.id} className="mb-8 rounded-lg bg-orange-50 p-6">
                  {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
                  <div className="space-y-4">
                    {(section.items || []).map((item, idx) => {
                      const [question, answer] = item.split("::")
                      return (
                        <div key={`${section.id}-faq-${idx}`} className="border-b border-orange-100 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-semibold text-gray-900">{question}</h3>
                          {answer && <p className="mt-2 text-gray-700">{answer}</p>}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            }
            if (section.type === "contact") {
              return (
                <section key={section.id} className="mb-8 rounded-lg bg-slate-900 p-6 text-white">
                  <h2 className="text-2xl font-serif text-orange-200 mb-3">{section.title || "Contactez Danemo"}</h2>
                  <p className="whitespace-pre-line text-white/85">{section.text || "WhatsApp : +32 488 64 51 83\nEntrepot : Avenue du Port 108-110, 1000 Bruxelles"}</p>
                </section>
              )
            }
            if (section.type === "newsletter") {
              return (
                <section key={section.id} className="mb-8 rounded-lg border border-orange-100 bg-orange-50 p-6 text-center">
                  <h2 className="text-2xl font-serif text-amber-700 mb-3">{section.title || "Recevoir les conseils Danemo"}</h2>
                  <p className="text-gray-700">{section.text || "Ajoutez un formulaire newsletter depuis votre outil marketing."}</p>
                </section>
              )
            }
            if (section.type === "recent_posts") {
              const recentPosts = posts.filter((item) => item.id !== post.id && item.isActive).slice(0, 3)
              return (
                <section key={section.id} className="mb-8">
                  <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title || "Articles recents"}</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {recentPosts.map((recentPost) => (
                      <Link key={recentPost.id} href={recentPost.href} className="rounded-lg border border-orange-100 p-4 transition hover:border-orange-300 hover:bg-orange-50">
                        <p className="line-clamp-3 font-medium text-gray-900">{recentPost.title}</p>
                        <p className="mt-2 text-sm text-gray-500">{recentPost.date}</p>
                      </Link>
                    ))}
                  </div>
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
