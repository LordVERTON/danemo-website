import { v2 as cloudinary, type UploadApiResponse } from "cloudinary"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
}

export function assertCloudinaryConfigured() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
  }
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    resourceType?: "image" | "video" | "auto" | "raw"
    publicId?: string
  } = {},
): Promise<UploadApiResponse> {
  assertCloudinaryConfigured()

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "danemo/blog",
        resource_type: options.resourceType || "auto",
        public_id: options.publicId,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"))
          return
        }
        resolve(result)
      },
    )

    stream.end(buffer)
  })
}
