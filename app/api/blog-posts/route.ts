import { NextRequest, NextResponse } from "next/server"
import { createArticle, deleteArticle, getArticleById, getArticles, updateArticle } from "@/lib/articles"
import { articleToBlogPost } from "@/lib/public-blog-posts"
import type { ArticleInput } from "@/lib/article-types"
import type { BlogPost, BlogSection } from "@/lib/blog-posts"
import { authenticateRequest } from "@/lib/auth-middleware"
import { recordBusinessAudit } from '@/lib/business-audit'

function canManageBlogs(userRole: string | undefined): boolean {
  return userRole === "admin" || userRole === "operator"
}

function sanitizePayload(body: Partial<BlogPost>) {
  const mediaUrl = String((body as any).mediaUrl || body.image || "").trim()
  const mediaType: "image" | "video" =
    (body as any).mediaType === "video" || /\.(mp4|webm|ogg)$/i.test(mediaUrl) ? "video" : "image"

  const sections = Array.isArray((body as any).sections) ? ((body as any).sections as BlogSection[]) : []

  return {
    title: String(body.title || "").trim(),
    date: String(body.date || "").trim(),
    excerpt: String(body.excerpt || "").trim(),
    mediaUrl,
    mediaType,
    image: mediaUrl,
    href: String(body.href || "").trim(),
    type: "blog",
    isActive: body.isActive !== false,
    sections,
    backLinkLabel: String((body as any).backLinkLabel || "← Retour au blog").trim(),
    backLinkHref: String((body as any).backLinkHref || "/blog").trim(),
  } as Omit<BlogPost, "id">
}

function validatePayload(payload: Omit<BlogPost, "id">): string | null {
  if (!payload.title) return "Le titre est requis"
  if (!payload.date) return "La date est requise"
  if (!payload.excerpt) return "L'extrait est requis"
  if (!payload.mediaUrl) return "Le media (image ou video) est requis"
  if (!payload.href) return "Le lien est requis"

  const isPersistedBlogMedia = (mediaUrl: string) =>
    mediaUrl.includes("/storage/v1/object/public/blog-media/") || mediaUrl.startsWith("/blogs/")

  // Supabase remains preferred for new uploads, while existing public blog assets stay editable.
  if (!isPersistedBlogMedia(payload.mediaUrl)) {
    return "Le media principal doit etre uploade sur Supabase via le champ d'upload"
  }

  for (const section of payload.sections || []) {
    if (section?.type !== "media") continue
    const sectionMediaUrl = String(section.mediaUrl || "").trim()
    if (!sectionMediaUrl) return "Chaque section media doit contenir une URL"
    if (!isPersistedBlogMedia(sectionMediaUrl)) {
      return "Les medias de section doivent etre uploades sur Supabase via le champ d'upload"
    }
  }

  return null
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getArticleSlug(payload: Omit<BlogPost, "id">) {
  const slugFromHref = payload.href
    .trim()
    .replace(/^\/?blog\//, "")
    .replace(/^\/+|\/+$/g, "")

  return slugify(slugFromHref) || slugify(payload.title)
}

function getPublishedAt(value: string): string | null {
  const frenchDate = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (frenchDate) {
    const [, day, month, year] = frenchDate
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function articleInputFromBlogPost(payload: Omit<BlogPost, "id">): ArticleInput {
  return {
    title: payload.title,
    slug: getArticleSlug(payload),
    excerpt: payload.excerpt,
    status: payload.isActive ? "published" : "draft",
    cover_image_url: payload.mediaUrl || null,
    legacy_content: payload,
    published_at: payload.isActive ? getPublishedAt(payload.date) : null,
  }
}

export async function GET() {
  try {
    const posts = (await getArticles()).map(articleToBlogPost)
    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error("[blog-posts.list] error", error)
    return NextResponse.json({ success: false, error: "Failed to load blog posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  if (!canManageBlogs(user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as Partial<BlogPost>
    const payload = sanitizePayload(body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 })
    }

    const article = await createArticle({
      ...articleInputFromBlogPost(payload),
      created_by: user.name || user.email || "Utilisateur",
      updated_by: user.name || user.email || "Utilisateur",
    })
    await recordBusinessAudit(request, {
      action: 'create',
      entityType: 'content',
      entityId: article.id,
    })
    return NextResponse.json({ success: true, data: articleToBlogPost(article) }, { status: 201 })
  } catch (error) {
    console.error("[blog-posts.create] error", error)
    return NextResponse.json({ success: false, error: "Failed to create blog post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  if (!canManageBlogs(user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const body = (await request.json()) as Partial<BlogPost>
    const id = String(body.id || "").trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "L'identifiant est requis" }, { status: 400 })
    }

    const payload = sanitizePayload(body)
    const validationError = validatePayload(payload)
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 })
    }

    try {
      await getArticleById(id)
    } catch {
      return NextResponse.json({ success: false, error: "Article introuvable" }, { status: 404 })
    }

    const article = await updateArticle(id, {
      ...articleInputFromBlogPost(payload),
      updated_by: user.name || user.email || "Utilisateur",
    })
    await recordBusinessAudit(request, {
      action: 'update',
      entityType: 'content',
      entityId: id,
      changedFields: Object.keys(payload),
    })
    return NextResponse.json({ success: true, data: articleToBlogPost(article) })
  } catch (error) {
    console.error("[blog-posts.update] error", error)
    return NextResponse.json({ success: false, error: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  if (!canManageBlogs(user.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")?.trim()
    if (!id) {
      return NextResponse.json({ success: false, error: "L'identifiant est requis" }, { status: 400 })
    }

    try {
      await getArticleById(id)
    } catch {
      return NextResponse.json({ success: false, error: "Article introuvable" }, { status: 404 })
    }

    await deleteArticle(id)
    await recordBusinessAudit(request, {
      action: 'delete',
      entityType: 'content',
      entityId: id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[blog-posts.delete] error", error)
    return NextResponse.json({ success: false, error: "Failed to delete blog post" }, { status: 500 })
  }
}
