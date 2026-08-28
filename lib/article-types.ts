export type ArticleStatus = "draft" | "published" | "archived"

export type PuckContent = {
  root?: Record<string, unknown>
  content?: unknown[]
  [key: string]: unknown
}

export type Article = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  status: ArticleStatus
  cover_image_url?: string | null
  cover_image_public_id?: string | null
  seo_title?: string | null
  seo_description?: string | null
  legacy_content?: unknown
  puck_content: PuckContent
  published_at?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export type ArticleInput = {
  title: string
  slug: string
  excerpt?: string | null
  status: ArticleStatus
  cover_image_url?: string | null
  cover_image_public_id?: string | null
  seo_title?: string | null
  seo_description?: string | null
  legacy_content?: unknown
  puck_content?: PuckContent
  published_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export type ArticleRevisionInput = {
  article_id: string
  title: string
  slug: string
  status: ArticleStatus
  cover_image_url?: string | null
  cover_image_public_id?: string | null
  seo_title?: string | null
  seo_description?: string | null
  puck_content: PuckContent
  legacy_content?: unknown
  revision_note?: string | null
  created_by?: string | null
}
