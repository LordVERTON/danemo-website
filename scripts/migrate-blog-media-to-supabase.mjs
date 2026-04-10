import fs from "fs/promises"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = "blog-media"

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const blogPostsPath = path.join(process.cwd(), "data", "blog-posts.json")
const publicDir = path.join(process.cwd(), "public")

function isLocalMedia(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
}

function guessMediaType(filePath) {
  return /\.(mp4|webm|ogg)$/i.test(filePath) ? "video" : "image"
}

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".mp4") return "video/mp4"
  if (ext === ".webm") return "video/webm"
  if (ext === ".ogg") return "video/ogg"
  return "application/octet-stream"
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!(buckets || []).some((b) => b.name === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true })
    if (error) throw new Error(`Create bucket failed: ${error.message}`)
  }
}

async function uploadAndPersist(localUrl, createdBy = "migration") {
  const normalizedPath = localUrl.replace(/^\/+/, "")
  const localFile = path.join(publicDir, normalizedPath)
  const fileBuffer = await fs.readFile(localFile)
  const fileName = path.basename(localFile)
  const storagePath = `legacy/${Date.now()}-${fileName}`
  const mimeType = guessMimeType(localFile)
  const mediaType = guessMediaType(localFile)

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: false })

  if (uploadError) {
    throw new Error(`Upload failed (${localUrl}): ${uploadError.message}`)
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  const publicUrl = publicData.publicUrl

  const { error: dbError } = await supabase.from("blog_media").upsert(
    {
      file_name: fileName,
      original_name: fileName,
      mime_type: mimeType,
      size_bytes: fileBuffer.byteLength,
      storage_bucket: bucket,
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: mediaType,
      created_by: createdBy,
    },
    { onConflict: "storage_path" },
  )

  if (dbError) {
    throw new Error(`DB insert failed (${localUrl}): ${dbError.message}`)
  }

  return { publicUrl, mediaType }
}

async function run() {
  await ensureBucket()
  const raw = await fs.readFile(blogPostsPath, "utf8")
  const posts = JSON.parse(raw)
  const migratedMap = new Map()

  for (const post of posts) {
    if (isLocalMedia(post.mediaUrl)) {
      if (!migratedMap.has(post.mediaUrl)) {
        const migrated = await uploadAndPersist(post.mediaUrl, "blog-migration")
        migratedMap.set(post.mediaUrl, migrated)
      }
      const migrated = migratedMap.get(post.mediaUrl)
      post.mediaUrl = migrated.publicUrl
      post.image = migrated.publicUrl
      post.mediaType = migrated.mediaType
    }

    if (Array.isArray(post.sections)) {
      for (const section of post.sections) {
        if (section?.type === "media" && isLocalMedia(section.mediaUrl)) {
          if (!migratedMap.has(section.mediaUrl)) {
            const migrated = await uploadAndPersist(section.mediaUrl, "blog-migration")
            migratedMap.set(section.mediaUrl, migrated)
          }
          const migrated = migratedMap.get(section.mediaUrl)
          section.mediaUrl = migrated.publicUrl
          section.mediaType = migrated.mediaType
        }
      }
    }
  }

  await fs.writeFile(blogPostsPath, JSON.stringify(posts, null, 2), "utf8")
  console.log(`Migration done. Uploaded ${migratedMap.size} media file(s).`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
