import path from "path"
import { promises as fs } from "fs"

export type BlogPostType = "blog"
export type BlogSectionType = "heading2" | "heading3" | "paragraph" | "bullet_list" | "numbered_list" | "media" | "highlight"

export interface BlogSection {
  id: string
  type: BlogSectionType
  title?: string
  text?: string
  items?: string[]
  mediaUrl?: string
  mediaType?: "image" | "video"
}

export interface BlogPost {
  id: string
  title: string
  date: string
  excerpt: string
  image?: string
  mediaUrl: string
  mediaType: "image" | "video"
  href: string
  type: BlogPostType
  isActive: boolean
  sections: BlogSection[]
  backLinkLabel?: string
  backLinkHref?: string
  createdAt?: string
  createdByName?: string
  createdByEmail?: string
  updatedAt?: string
  updatedByName?: string
  updatedByEmail?: string
}

const BLOG_POSTS_FILE = path.join(process.cwd(), "data", "blog-posts.json")

export async function readBlogPosts(): Promise<BlogPost[]> {
  const content = await fs.readFile(BLOG_POSTS_FILE, "utf8")
  const parsed = JSON.parse(content) as any[]
  if (!Array.isArray(parsed)) return []

  return parsed.map((post) => {
    const mediaUrl = String(post.mediaUrl || post.image || "").trim()
    const mediaType: "image" | "video" =
      post.mediaType === "video" || /\.(mp4|webm|ogg)$/i.test(mediaUrl) ? "video" : "image"

    return {
      ...post,
      mediaUrl,
      mediaType,
      image: post.image || mediaUrl,
      sections: Array.isArray(post.sections) ? post.sections : [],
      backLinkLabel: typeof post.backLinkLabel === "string" ? post.backLinkLabel : "← Retour au blog",
      backLinkHref: typeof post.backLinkHref === "string" ? post.backLinkHref : "/blog",
      createdAt: typeof post.createdAt === "string" ? post.createdAt : undefined,
      createdByName: typeof post.createdByName === "string" ? post.createdByName : undefined,
      createdByEmail: typeof post.createdByEmail === "string" ? post.createdByEmail : undefined,
      updatedAt: typeof post.updatedAt === "string" ? post.updatedAt : undefined,
      updatedByName: typeof post.updatedByName === "string" ? post.updatedByName : undefined,
      updatedByEmail: typeof post.updatedByEmail === "string" ? post.updatedByEmail : undefined,
    } as BlogPost
  })
}

export async function writeBlogPosts(posts: BlogPost[]): Promise<void> {
  await fs.writeFile(BLOG_POSTS_FILE, JSON.stringify(posts, null, 2), "utf8")
}
