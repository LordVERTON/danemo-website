import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-middleware"
import { createArticle, getArticles } from "@/lib/articles"
import type { ArticleInput } from "@/lib/article-types"

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

export const GET = requireRole(["admin", "operator"])(async () => {
  try {
    const articles = await getArticles()
    return NextResponse.json({ success: true, articles })
  } catch (error) {
    console.error("[admin.articles.list] error", error)
    return jsonError("Impossible de recuperer les articles.", 500)
  }
})

export const POST = requireRole(["admin", "operator"])(async (request: NextRequest, user) => {
  try {
    const body = (await request.json()) as ArticleInput
    const article = await createArticle({
      ...body,
      created_by: user.email || user.id,
      updated_by: user.email || user.id,
    })

    return NextResponse.json({ success: true, article }, { status: 201 })
  } catch (error) {
    console.error("[admin.articles.create] error", error)
    return jsonError("Impossible de creer l'article.", 500)
  }
})
