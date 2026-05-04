import { supabaseAdmin } from "@/lib/supabase"
import type { Article, ArticleInput, ArticleRevisionInput } from "@/lib/article-types"

const EMPTY_PUCK_CONTENT = { root: {}, content: [] }

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .replace(/^\/?blog\//, "")
    .replace(/^\/+|\/+$/g, "")
}

function normalizeArticleInput(input: ArticleInput): ArticleInput {
  return {
    ...input,
    slug: normalizeSlug(input.slug),
    excerpt: input.excerpt || null,
    cover_image_url: input.cover_image_url || null,
    cover_image_public_id: input.cover_image_public_id || null,
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    puck_content: input.puck_content || EMPTY_PUCK_CONTENT,
    published_at: input.status === "published" ? input.published_at || new Date().toISOString() : input.published_at || null,
  }
}

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await (supabaseAdmin as any)
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) throw error
  return (data || []) as Article[]
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await (supabaseAdmin as any)
    .from("articles")
    .select("*")
    .eq("slug", normalizeSlug(slug))
    .eq("status", "published")
    .maybeSingle()

  if (error) throw error
  return (data || null) as Article | null
}

export async function getArticleById(id: string): Promise<Article> {
  const { data, error } = await (supabaseAdmin as any)
    .from("articles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data as Article
}

export async function createArticle(input: ArticleInput): Promise<Article> {
  const payload = normalizeArticleInput(input)
  const { data, error } = await (supabaseAdmin as any)
    .from("articles")
    .insert(payload)
    .select("*")
    .single()

  if (error) throw error
  return data as Article
}

export async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<Article> {
  const payload =
    typeof input.slug === "string" || input.status
      ? {
          ...input,
          slug: typeof input.slug === "string" ? normalizeSlug(input.slug) : undefined,
          published_at:
            input.status === "published" && !input.published_at ? new Date().toISOString() : input.published_at,
        }
      : input

  const { data, error } = await (supabaseAdmin as any)
    .from("articles")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Article
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await (supabaseAdmin as any).from("articles").delete().eq("id", id)
  if (error) throw error
}

export async function createArticleRevision(input: ArticleRevisionInput) {
  const { data, error } = await (supabaseAdmin as any)
    .from("article_revisions")
    .insert(input)
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function getArticleRevisions(articleId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from("article_revisions")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}
