import { NextResponse } from "next/server"
import { readPublicBlogPosts } from "@/lib/public-blog-posts"

export async function GET() {
  try {
    const posts = await readPublicBlogPosts()
    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error("[public.blog-posts] error", error)
    return NextResponse.json({ success: false, error: "Failed to load blog posts" }, { status: 500 })
  }
}
