import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { readBlogPosts, writeBlogPosts, type BlogPost, type BlogSection } from "@/lib/blog-posts"
import { authenticateRequest } from "@/lib/auth-middleware"

function canManageBlogs(userRole: string | undefined): boolean {
  return userRole === "admin"
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

  // Enforce Supabase media persistence for all new/updated blog content.
  const isMainMediaSupabase = payload.mediaUrl.includes("/storage/v1/object/public/blog-media/")
  if (!isMainMediaSupabase) {
    return "Le media principal doit etre uploade sur Supabase via le champ d'upload"
  }

  for (const section of payload.sections || []) {
    if (section?.type !== "media") continue
    const sectionMediaUrl = String(section.mediaUrl || "").trim()
    if (!sectionMediaUrl) return "Chaque section media doit contenir une URL"
    const isSectionMediaSupabase = sectionMediaUrl.includes("/storage/v1/object/public/blog-media/")
    if (!isSectionMediaSupabase) {
      return "Les medias de section doivent etre uploades sur Supabase via le champ d'upload"
    }
  }

  return null
}

export async function GET() {
  try {
    const posts = await readBlogPosts()
    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
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

    const posts = await readBlogPosts()
    const newPost: BlogPost = {
      id: `post-${randomUUID()}`,
      ...payload,
    }

    posts.unshift(newPost)
    await writeBlogPosts(posts)
    return NextResponse.json({ success: true, data: newPost }, { status: 201 })
  } catch (error) {
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

    const posts = await readBlogPosts()
    const index = posts.findIndex((post) => post.id === id)
    if (index < 0) {
      return NextResponse.json({ success: false, error: "Article introuvable" }, { status: 404 })
    }

    const updatedPost: BlogPost = { id, ...payload }
    posts[index] = updatedPost
    await writeBlogPosts(posts)
    return NextResponse.json({ success: true, data: updatedPost })
  } catch (error) {
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

    const posts = await readBlogPosts()
    const filteredPosts = posts.filter((post) => post.id !== id)
    if (filteredPosts.length === posts.length) {
      return NextResponse.json({ success: false, error: "Article introuvable" }, { status: 404 })
    }

    await writeBlogPosts(filteredPosts)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete blog post" }, { status: 500 })
  }
}
