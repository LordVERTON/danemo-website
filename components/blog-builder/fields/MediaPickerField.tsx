"use client"

import { useState } from "react"
import { ImageIcon, Loader2, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"

type MediaPickerFieldProps = {
  value?: string
  onChange?: (value: string) => void
}

export function MediaPickerField({ value = "", onChange }: MediaPickerFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  async function uploadFile(file: File) {
    try {
      setIsUploading(true)
      setError("")

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

      onChange?.(result.data.mediaUrl)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload impossible")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="https://res.cloudinary.com/..."
          className="bg-white"
        />
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Uploader
          <input
            type="file"
            accept="image/*,video/*,application/pdf"
            className="hidden"
            disabled={isUploading}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              await uploadFile(file)
              event.target.value = ""
            }}
          />
        </label>
      </div>

      {value ? (
        <div className="overflow-hidden rounded-md border bg-slate-50">
          {/\.(mp4|webm|ogg)(\?|$)/i.test(value) ? (
            <video src={value} controls className="max-h-56 w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-56 w-full object-cover" />
          )}
        </div>
      ) : (
        <div className="flex min-h-28 items-center justify-center gap-2 rounded-md border border-dashed bg-slate-50 text-sm text-slate-500">
          <ImageIcon className="size-4" />
          Aucun media selectionne
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
