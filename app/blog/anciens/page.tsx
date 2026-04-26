import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { readBlogPosts } from "@/lib/blog-posts"

function toSortableDate(value: string): number {
  const parts = value.split("/")
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map((part) => Number(part))
    if (!Number.isNaN(dd) && !Number.isNaN(mm) && !Number.isNaN(yyyy)) {
      return new Date(yyyy, mm - 1, dd).getTime()
    }
  }
  const fallback = new Date(value).getTime()
  return Number.isNaN(fallback) ? 0 : fallback
}

export default async function AnciensArticles({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const POSTS_PER_PAGE = 2
  const oldPosts = (await readBlogPosts())
    .filter((post) => post.isActive)
    .sort((a, b) => toSortableDate(b.date) - toSortableDate(a.date))
    .slice(2)
  const totalPages = Math.max(1, Math.ceil(oldPosts.length / POSTS_PER_PAGE))
  const pageFromUrl = Number(resolvedSearchParams.page || "1")
  const currentPage = Number.isFinite(pageFromUrl)
    ? Math.min(Math.max(1, pageFromUrl), totalPages)
    : 1
  const start = (currentPage - 1) * POSTS_PER_PAGE
  const paginatedOldPosts = oldPosts.slice(start, start + POSTS_PER_PAGE)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 font-serif text-[#B8860B]">Blog</h1>
        </div>

        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              {paginatedOldPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="order-2 md:order-1">
                      <div className="p-6 md:p-0">
                        <h2 className="text-2xl font-bold mb-4 text-[#B8860B] font-serif leading-tight">
                          <Link href={post.href} className="hover:text-orange-600 transition-colors">
                            {post.title}
                          </Link>
                        </h2>
                        <p className="text-gray-500 text-sm mb-4">{post.date}</p>
                        <p className="text-gray-700 leading-relaxed mb-6">{post.excerpt}</p>
                        <Link
                          href={post.href}
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
                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          preload="metadata"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ) : (
                        <Image
                          src={post.mediaUrl || post.image || "/placeholder.svg"}
                          alt={post.title}
                          width={400}
                          height={250}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 text-left text-sm text-gray-600">
              <Link
                href={currentPage <= 1 ? "/blog" : "/blog/anciens?page=1"}
                className="hover:text-gray-800 transition-colors font-semibold"
              >
                &lt; Articles récents
              </Link>
              {currentPage < totalPages && (
                <>
                  <span className="mx-2">|</span>
                  <Link
                    href={`/blog/anciens?page=${totalPages}`}
                    className="hover:text-gray-800 transition-colors font-semibold"
                  >
                    Anciens articles &gt;
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
