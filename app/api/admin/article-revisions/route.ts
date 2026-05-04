import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-middleware"
import { createArticleRevision, getArticleRevisions } from "@/lib/articles"
import type { ArticleRevisionInput } from "@/lib/article-types"

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

export const GET = requireRole(["admin", "operator"])(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get("article_id")
    if (!articleId) return jsonError("article_id est requis.", 400)

    const revisions = await getArticleRevisions(articleId)
    return NextResponse.json({ success: true, revisions })
  } catch (error) {
    console.error("[admin.article-revisions.list] error", error)
    return jsonError("Impossible de recuperer les revisions.", 500)
  }
})

export const POST = requireRole(["admin", "operator"])(async (request: NextRequest, user) => {
  try {
    const body = (await request.json()) as ArticleRevisionInput
    const revision = await createArticleRevision({
      ...body,
      created_by: body.created_by || user.email || user.id,
    })

    return NextResponse.json({ success: true, revision }, { status: 201 })
  } catch (error) {
    console.error("[admin.article-revisions.create] error", error)
    return jsonError("Impossible de creer la revision.", 500)
  }
})
