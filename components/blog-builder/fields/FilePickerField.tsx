"use client"

import { useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

type FilePickerFieldProps = {
  value?: string
  onChange?: (value: string) => void
}

export function FilePickerField({ value = "", onChange }: FilePickerFieldProps) {
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
        <Input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder="URL du fichier" />
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          Uploader
          <input
            type="file"
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
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-medium text-orange-600 hover:text-orange-700">
          Ouvrir le fichier
        </a>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
