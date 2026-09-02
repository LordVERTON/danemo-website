import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("articles")
      .select("id, title, slug, excerpt, cover_image_url, legacy_content, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
    if (error) throw error
    const posts = (data || []).map((article: any) => {
      const legacy = article.legacy_content || {}
      return {
        id: article.id,
        title: article.title,
        href: legacy.href || `/blog/${article.slug}`,
        excerpt: article.excerpt || "",
        image: legacy.mediaUrl || article.cover_image_url || null,
        date: legacy.date || article.published_at,
      }
    })
    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error("[public.blog-posts]", error)
    return NextResponse.json({ success: false, error: "Impossible de charger les articles" }, { status: 500 })
  }
}
