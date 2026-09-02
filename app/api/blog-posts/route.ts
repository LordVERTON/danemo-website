import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminApiAccess, requireStaffApiAccess } from "@/lib/staff-api-auth"

type LegacyContent = Record<string, unknown>

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function toPost(article: any) {
  const legacy = (article.legacy_content || {}) as LegacyContent
  return {
    id: article.id, title: article.title,
    date: legacy.date || new Date(article.published_at || article.created_at).toLocaleDateString("fr-FR"),
    excerpt: article.excerpt || "", mediaUrl: legacy.mediaUrl || article.cover_image_url || "",
    mediaType: legacy.mediaType === "video" ? "video" : "image", href: legacy.href || `/blog/${article.slug}`,
    type: "blog", isActive: article.status === "published", sections: Array.isArray(legacy.sections) ? legacy.sections : [],
    backLinkLabel: legacy.backLinkLabel || "Retour au blog", backLinkHref: legacy.backLinkHref || "/blog",
    createdAt: article.created_at, createdByEmail: article.created_by, updatedAt: article.updated_at, updatedByEmail: article.updated_by,
  }
}

function toArticlePayload(body: Record<string, unknown>) {
  const title = String(body.title || "").trim()
  if (!title) throw new Error("Le titre est requis")
  const requestedSlug = String(body.href || "").trim().replace(/^\/?blog\//, "")
  const slug = slugify(requestedSlug || title)
  if (!slug) throw new Error("Le titre doit contenir au moins un caractère utilisable")
  const legacy: LegacyContent = {
    date: String(body.date || ""), mediaUrl: String(body.mediaUrl || ""), mediaType: body.mediaType === "video" ? "video" : "image",
    href: `/blog/${slug}`, sections: Array.isArray(body.sections) ? body.sections : [],
    backLinkLabel: String(body.backLinkLabel || "Retour au blog"), backLinkHref: String(body.backLinkHref || "/blog"),
  }
  return { title, slug, excerpt: String(body.excerpt || "").trim() || null, status: body.isActive === false ? "draft" : "published", cover_image_url: String(body.mediaUrl || "").trim() || null, legacy_content: legacy, published_at: body.isActive === false ? null : new Date().toISOString() }
}

export async function GET() {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { data, error } = await (supabaseAdmin as any).from("articles").select("*").order("updated_at", { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: (data || []).map(toPost) })
  } catch (error) {
    console.error("[blog-posts.get]", error)
    return NextResponse.json({ success: false, error: "Impossible de récupérer les articles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const { data, error } = await (supabaseAdmin as any).from("articles").insert(toArticlePayload(await request.json())).select("*").single()
    if (error) throw error
    return NextResponse.json({ success: true, data: toPost(data) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Impossible de créer l'article" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const body = await request.json()
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ success: false, error: "Identifiant requis" }, { status: 400 })
    const { data: previous, error: findError } = await (supabaseAdmin as any).from("articles").select("*").eq("id", id).maybeSingle()
    if (findError) throw findError
    if (!previous) return NextResponse.json({ success: false, error: "Article introuvable" }, { status: 404 })
    const { error: revisionError } = await (supabaseAdmin as any).from("article_revisions").insert({
      article_id: previous.id, title: previous.title, slug: previous.slug, status: previous.status,
      cover_image_url: previous.cover_image_url, cover_image_public_id: previous.cover_image_public_id,
      seo_title: previous.seo_title, seo_description: previous.seo_description,
      puck_content: previous.puck_content || { root: {}, content: [] }, legacy_content: previous.legacy_content,
      revision_note: "Sauvegarde avant modification",
    })
    if (revisionError) throw revisionError
    const { data, error } = await (supabaseAdmin as any).from("articles").update(toArticlePayload(body)).eq("id", id).select("*").single()
    if (error) throw error
    return NextResponse.json({ success: true, data: toPost(data) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Impossible de mettre à jour l'article" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireAdminApiAccess()
  if (accessError) return accessError
  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ success: false, error: "Identifiant requis" }, { status: 400 })
  const { error } = await (supabaseAdmin as any).from("articles").delete().eq("id", id)
  if (error) return NextResponse.json({ success: false, error: "Impossible de supprimer l'article" }, { status: 500 })
  return NextResponse.json({ success: true })
}
