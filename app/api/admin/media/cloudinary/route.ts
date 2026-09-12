import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-middleware"
import { uploadBufferToCloudinary } from "@/lib/cloudinary"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 50 * 1024 * 1024

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status })
}

function getMediaType(mime: string): "image" | "video" | "file" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "file"
}

function getCloudinaryResourceType(mediaType: "image" | "video" | "file") {
  if (mediaType === "image") return "image"
  if (mediaType === "video") return "video"
  return "raw"
}

export const POST = requireRole(["admin", "operator"])(async (request: NextRequest, user) => {
  try {
    const formData = await request.formData()
    const file = formData.get("media")
    if (!(file instanceof File)) return jsonError("Aucun fichier fourni", 400)

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return jsonError("Fichier invalide ou trop volumineux (max 50MB)", 400)
    }

    const mime = String(file.type || "application/octet-stream")
    const mediaType = getMediaType(mime)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const upload = await uploadBufferToCloudinary(buffer, {
      folder: "danemo/blog",
      resourceType: getCloudinaryResourceType(mediaType),
    })

    const publicUrl = upload.secure_url || upload.url
    const fileName = path.basename(upload.public_id || file.name)

    const { data: media, error } = await (supabaseAdmin as any)
      .from("media_library")
      .insert({
        provider: "cloudinary",
        media_type: mediaType,
        original_name: file.name,
        file_name: fileName,
        mime_type: mime,
        size_bytes: file.size,
        public_url: publicUrl,
        secure_url: upload.secure_url || null,
        cloudinary_public_id: upload.public_id,
        cloudinary_resource_type: upload.resource_type,
        cloudinary_format: upload.format || null,
        width: upload.width || null,
        height: upload.height || null,
        created_by: user.email || user.id,
      })
      .select("*")
      .single()

    if (error) {
      return jsonError(`Media uploade, mais metadata non sauvegardee: ${error.message}`, 500)
    }

    return NextResponse.json({
      success: true,
      media,
      data: {
        mediaUrl: publicUrl,
        mediaType,
        publicId: upload.public_id,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload Cloudinary impossible"
    console.error("[admin.media.cloudinary] error", error)
    return jsonError(message, 500)
  }
})
