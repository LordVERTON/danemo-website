import fs from "fs/promises"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.production.local" })
dotenv.config({ path: ".env.development.local" })
dotenv.config({ path: ".env.local" })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const blogPostsPath = path.join(process.cwd(), "data", "blog-posts.json")
const emptyPuckContent = { root: {}, content: [] }

function slugFromHref(href, title) {
  const fromHref = String(href || "")
    .trim()
    .replace(/^\/?blog\//, "")
    .replace(/^\/+|\/+$/g, "")

  if (fromHref) return fromHref

  return String(title || "article")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function parseFrenchDate(date) {
  const value = String(date || "").trim()
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null

  const [, day, month, year] = match
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0)).toISOString()
}

function toArticle(post) {
  const status = post.isActive === false ? "draft" : "published"
  const publishedAt = status === "published" ? parseFrenchDate(post.date) : null
  const slug = slugFromHref(post.href, post.title)

  return {
    title: String(post.title || "").trim() || "Article sans titre",
    slug,
    excerpt: post.excerpt || null,
    status,
    cover_image_url: post.mediaUrl || post.image || null,
    cover_image_public_id: null,
    seo_title: post.title || null,
    seo_description: post.excerpt || null,
    legacy_content: post,
    puck_content: emptyPuckContent,
    published_at: publishedAt,
    created_by: post.createdByEmail || post.createdByName || "json-migration",
    updated_by: post.updatedByEmail || post.updatedByName || "json-migration",
  }
}

async function run() {
  const raw = await fs.readFile(blogPostsPath, "utf8")
  const posts = JSON.parse(raw)

  if (!Array.isArray(posts)) {
    throw new Error("data/blog-posts.json must contain an array")
  }

  const articles = posts.map(toArticle)

  const { data, error } = await supabase
    .from("articles")
    .upsert(articles, { onConflict: "slug" })
    .select("id, slug, title")

  if (error) {
    throw new Error(`Article migration failed: ${error.message}`)
  }

  console.log(`Migrated ${data?.length || 0} article(s) into public.articles`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
