"use client"

import { useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"

type GalleryFieldProps = {
  value?: string[]
  onChange?: (value: string[]) => void
}

export function GalleryField({ value = [], onChange }: GalleryFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const images = Array.isArray(value) ? value : []

  async function uploadFiles(files: FileList) {
    try {
      setIsUploading(true)
      setError("")
      const uploaded: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("media", file)
        const response = await fetch("/api/admin/media/cloudinary", {
          method: "POST",
          body: formData,
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Upload impossible")
        }
        uploaded.push(result.data.mediaUrl)
      }

      onChange?.([...images, ...uploaded])
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload impossible")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <div key={`${image}-${index}`} className="relative overflow-hidden rounded-md border bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-36 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange?.(images.filter((_, imageIndex) => imageIndex !== index))}
              className="absolute right-2 top-2 rounded-md bg-white p-1.5 text-red-600 shadow"
              title="Retirer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-slate-50 text-sm text-slate-500 transition hover:bg-slate-100">
          {isUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          Ajouter des images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={async (event) => {
              const files = event.target.files
              if (!files?.length) return
              await uploadFiles(files)
              event.target.value = ""
            }}
          />
        </label>
      </div>

      <textarea
        value={images.join("\n")}
        onChange={(event) => onChange?.(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))}
        placeholder="Une URL d'image par ligne"
        className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
