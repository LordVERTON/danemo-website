import { getArticles, getPublishedArticleBySlug } from "@/lib/articles"
import { readBlogPosts, type BlogPost } from "@/lib/blog-posts"
import type { Article } from "@/lib/article-types"

function formatArticleDate(article: Article) {
  const value = article.published_at || article.created_at
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString("fr-FR")
}

function inferMediaType(mediaUrl?: string | null): "image" | "video" {
  return /\.(mp4|webm|ogg)$/i.test(mediaUrl || "") ? "video" : "image"
}

export function articleToBlogPost(article: Article): BlogPost {
  const legacy = article.legacy_content && typeof article.legacy_content === "object"
    ? (article.legacy_content as Partial<BlogPost>)
    : null
  const mediaUrl = article.cover_image_url || legacy?.mediaUrl || legacy?.image || ""

  return {
    id: article.id,
    title: article.title || legacy?.title || "",
    date: legacy?.date || formatArticleDate(article),
    excerpt: article.excerpt || legacy?.excerpt || "",
    image: mediaUrl,
    mediaUrl,
    mediaType: legacy?.mediaType || inferMediaType(mediaUrl),
    href: `/blog/${article.slug}`,
    type: "blog",
    isActive: article.status === "published",
    sections: legacy?.sections || [],
    backLinkLabel: legacy?.backLinkLabel || "Retour au blog",
    backLinkHref: legacy?.backLinkHref || "/blog",
    createdAt: article.created_at,
    createdByName: article.created_by || undefined,
    createdByEmail: article.created_by || undefined,
    updatedAt: article.updated_at,
    updatedByName: article.updated_by || undefined,
    updatedByEmail: article.updated_by || undefined,
  }
}

export async function readPublicBlogPosts(): Promise<BlogPost[]> {
  try {
    const articles = await getArticles()
    const published = articles
      .filter((article) => article.status === "published")
      .map(articleToBlogPost)

    if (published.length > 0) return published
  } catch (error) {
    console.error("[public-blog-posts] Supabase fallback to JSON", error)
  }

  return (await readBlogPosts()).filter((post) => post.isActive)
}

export async function readPublicBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const article = await getPublishedArticleBySlug(slug)
    if (article) return articleToBlogPost(article)
  } catch (error) {
    console.error("[public-blog-posts] Supabase article fallback to JSON", error)
  }

  const posts = await readBlogPosts()
  return posts.find((post) => post.href === `/blog/${slug}` && post.isActive) || null
}

export async function readPublicArticleBySlug(slug: string): Promise<Article | null> {
  try {
    return await getPublishedArticleBySlug(slug)
  } catch (error) {
    console.error("[public-blog-posts] Supabase raw article lookup failed", error)
    return null
  }
}
