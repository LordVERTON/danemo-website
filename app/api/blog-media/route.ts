import { randomUUID } from "crypto"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 50 * 1024 * 1024
const BLOG_MEDIA_BUCKET = "blog-media"

function extFromName(name: string): string {
  const ext = path.extname(name || "").toLowerCase()
  return ext || ""
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
  }
  if (user.role !== "admin" && user.role !== "operator") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("media")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Fichier invalide ou trop volumineux (max 50MB)" }, { status: 400 })
    }

    const mime = String(file.type || "")
    const isImage = mime.startsWith("image/")
    const isVideo = mime.startsWith("video/")
    if (!isImage && !isVideo) {
      return NextResponse.json({ success: false, error: "Formats acceptes: image ou video" }, { status: 400 })
    }

    const ext = extFromName(file.name) || (isImage ? ".jpg" : ".mp4")
    const fileName = `${Date.now()}-${randomUUID()}${ext}`
    const storagePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

    const bytes = await file.arrayBuffer()
    const fileBuffer = Buffer.from(bytes)

    // Créer le bucket si besoin (ignore si déjà existant)
    await supabaseAdmin.storage.createBucket(BLOG_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_FILE_SIZE}`,
    })

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BLOG_MEDIA_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mime,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ success: false, error: `Upload impossible: ${uploadError.message}` }, { status: 500 })
    }

    const { data: publicData } = supabaseAdmin.storage.from(BLOG_MEDIA_BUCKET).getPublicUrl(storagePath)
    const publicUrl = publicData.publicUrl

    const mediaType = isVideo ? "video" : "image"

    // Persister les metadata en table SQL
    await supabaseAdmin.from("blog_media").insert({
      file_name: fileName,
      original_name: file.name,
      mime_type: mime,
      size_bytes: file.size,
      storage_bucket: BLOG_MEDIA_BUCKET,
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: mediaType,
      created_by: user.id,
    } as any)

    return NextResponse.json({
      success: true,
      data: {
        mediaUrl: publicUrl,
        mediaType,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Upload impossible" }, { status: 500 })
  }
}
