"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Puck } from "@measured/puck"
import { blogPuckConfig, emptyBlogPuckData, type BlogPuckData } from "@/components/blog-builder/config"

type BlogPuckEditorProps = {
  articleId: string
  articleTitle: string
  initialData: unknown
}

function isPuckData(data: unknown): data is BlogPuckData {
  return Boolean(data && typeof data === "object" && Array.isArray((data as BlogPuckData).content))
}

export function BlogPuckEditor({ articleId, articleTitle, initialData }: BlogPuckEditorProps) {
  const [status, setStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const data = useMemo(() => (isPuckData(initialData) ? initialData : emptyBlogPuckData), [initialData])
  const timerRef = useRef<number | null>(null)
  const latestDataRef = useRef<BlogPuckData>(data)
  const lastSavedSerializedRef = useRef(JSON.stringify(data))

  const saveData = useCallback(async (nextData: BlogPuckData, options: { createRevision: boolean; note: string }) => {
    const serialized = JSON.stringify(nextData)
    if (!options.createRevision && serialized === lastSavedSerializedRef.current) return

    setStatus("saving")
    const response = await fetch(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puck_content: nextData,
        revision_note: options.note,
        create_revision: options.createRevision,
      }),
    })

    if (!response.ok) {
      setStatus("error")
      throw new Error("Erreur pendant la sauvegarde Puck.")
    }

    lastSavedSerializedRef.current = serialized
    setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    setStatus("saved")
  }, [articleId])

  const scheduleAutosave = useCallback((nextData: BlogPuckData) => {
    latestDataRef.current = nextData
    const serialized = JSON.stringify(nextData)

    if (serialized === lastSavedSerializedRef.current) {
      setStatus("saved")
      return
    }

    setStatus("dirty")
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      saveData(latestDataRef.current, {
        createRevision: false,
        note: "Autosave Puck",
      }).catch(() => {
        setStatus("error")
      })
    }, 1500)
  }, [saveData])

  async function handlePublish(nextData: BlogPuckData) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    await saveData(nextData, {
      createRevision: true,
      note: "Revision Puck publiee manuellement",
    })
  }

  useEffect(() => {
    latestDataRef.current = data
    lastSavedSerializedRef.current = JSON.stringify(data)
  }, [data])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed right-4 top-4 z-50 rounded-md bg-white px-3 py-2 text-sm shadow-lg">
        {status === "idle" && <span className="text-slate-500">Pret</span>}
        {status === "dirty" && <span className="text-amber-600">Modifications non sauvegardees</span>}
        {status === "saving" && <span className="text-slate-500">Sauvegarde...</span>}
        {status === "saved" && <span className="text-green-600">Sauvegarde{lastSavedAt ? ` a ${lastSavedAt}` : ""}</span>}
        {status === "error" && <span className="text-red-600">Erreur</span>}
      </div>
      <Puck
        config={blogPuckConfig}
        data={data}
        onChange={scheduleAutosave}
        onPublish={handlePublish}
        headerTitle={`Editeur Puck - ${articleTitle}`}
      />
    </div>
  )
}
