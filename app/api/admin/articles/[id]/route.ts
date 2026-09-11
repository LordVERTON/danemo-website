import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest, type AuthenticatedUser } from "@/lib/auth-middleware"
import { createArticleRevision, deleteArticle, getArticleById, updateArticle } from "@/lib/articles"
import type { ArticleInput } from "@/lib/article-types"

type Context = {
  params: Promise<{
    id: string
  }>
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

async function requireArticleUser(request: NextRequest, allowedRoles: Array<AuthenticatedUser["role"]>) {
  const user = await authenticateRequest(request)
  if (!user) return { response: jsonError("Authentication required", 401), user: null }
  if (!allowedRoles.includes(user.role)) return { response: jsonError("Insufficient permissions", 403), user: null }
  return { response: null, user }
}

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireArticleUser(request, ["admin", "operator"])
  if (auth.response) return auth.response

  try {
    const { id } = await context.params
    const article = await getArticleById(id)
    return NextResponse.json({ success: true, article })
  } catch (error) {
    console.error("[admin.articles.get] error", error)
    return jsonError("Article introuvable.", 404)
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireArticleUser(request, ["admin", "operator"])
  if (auth.response) return auth.response
  const user = auth.user!

  try {
    const { id } = await context.params
    const body = (await request.json()) as Partial<ArticleInput> & {
      revision_note?: string
      create_revision?: boolean
    }
    const shouldCreateRevision = body.create_revision !== false

    if (shouldCreateRevision) {
      const current = await getArticleById(id)
      await createArticleRevision({
        article_id: current.id,
        title: current.title,
        slug: current.slug,
        status: current.status,
        cover_image_url: current.cover_image_url,
        cover_image_public_id: current.cover_image_public_id,
        seo_title: current.seo_title,
        seo_description: current.seo_description,
        puck_content: current.puck_content,
        legacy_content: current.legacy_content,
        revision_note: body.revision_note || "Sauvegarde avant modification",
        created_by: user.email || user.id,
      })
    }

    const { revision_note: _revisionNote, create_revision: _createRevision, ...patch } = body
    const article = await updateArticle(id, {
      ...patch,
      updated_by: user.email || user.id,
    })

    return NextResponse.json({ success: true, article })
  } catch (error) {
    console.error("[admin.articles.update] error", error)
    return jsonError("Impossible de modifier l'article.", 500)
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireArticleUser(request, ["admin"])
  if (auth.response) return auth.response

  try {
    const { id } = await context.params
    await deleteArticle(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin.articles.delete] error", error)
    return jsonError("Impossible de supprimer l'article.", 500)
  }
}
