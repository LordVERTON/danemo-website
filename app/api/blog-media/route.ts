import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireStaffApiAccess } from "@/lib/staff-api-auth"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 50 * 1024 * 1024
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"])

export async function POST(request: NextRequest) {
  const accessError = await requireStaffApiAccess()
  if (accessError) return accessError
  try {
    const formData = await request.formData()
    const media = formData.get("media")
    if (!(media instanceof File)) return NextResponse.json({ success: false, error: "Fichier requis" }, { status: 400 })
    if (!allowedTypes.has(media.type) || media.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Format non pris en charge ou fichier trop volumineux (50 Mo maximum)" }, { status: 400 })
    }
    const extension = media.name.split(".").pop()?.toLowerCase() || (media.type.startsWith("video/") ? "mp4" : "webp")
    const objectPath = `blog/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`
    const bucket = "blog-media"
    const storage = supabaseAdmin.storage
    const { error: bucketError } = await storage.createBucket(bucket, { public: true, fileSizeLimit: `${MAX_FILE_SIZE}` })
    if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) throw bucketError
    const { error: uploadError } = await storage.from(bucket).upload(objectPath, Buffer.from(await media.arrayBuffer()), { contentType: media.type, upsert: false })
    if (uploadError) throw uploadError
    const { data } = storage.from(bucket).getPublicUrl(objectPath)
    return NextResponse.json({ success: true, data: { mediaUrl: data.publicUrl, mediaType: media.type.startsWith("video/") ? "video" : "image" } }, { status: 201 })
  } catch (error) {
    console.error("[blog-media.post]", error)
    return NextResponse.json({ success: false, error: "Impossible de téléverser le média" }, { status: 500 })
  }
}
