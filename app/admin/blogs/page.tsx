"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Box,
  Calendar,
  Code2,
  Columns2,
  Columns3,
  Copy,
  Eye,
  FileText,
  Heading,
  HelpCircle,
  ImageIcon,
  Images,
  LinkIcon,
  Lock,
  Mail,
  MapPin,
  Minus,
  MoreVertical,
  Paperclip,
  PenLine,
  Plus,
  Save,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react"
import AdminLayout from "@/components/admin-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface BlogPost {
  id: string
  title: string
  date: string
  excerpt: string
  mediaUrl: string
  mediaType: "image" | "video"
  href: string
  type: "blog"
  isActive: boolean
  sections: BlogSection[]
  backLinkLabel?: string
  backLinkHref?: string
  createdAt?: string
  createdByName?: string
  createdByEmail?: string
  updatedAt?: string
  updatedByName?: string
  updatedByEmail?: string
}

type BlogSectionType =
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bullet_list"
  | "numbered_list"
  | "media"
  | "highlight"
  | "text_image"
  | "columns"
  | "gallery"
  | "divider"
  | "spacer"
  | "button"
  | "html"
  | "faq"
  | "contact"
  | "newsletter"
  | "recent_posts"

interface BlogSection {
  id: string
  type: BlogSectionType
  title?: string
  text?: string
  items?: string[]
  mediaUrl?: string
  mediaType?: "image" | "video"
  columns?: string[]
  images?: string[]
  buttonLabel?: string
  buttonHref?: string
  html?: string
  settings?: {
    background?: "white" | "soft" | "dark"
    columns?: 2 | 3
    height?: "small" | "medium" | "large"
    align?: "left" | "center" | "right"
    width?: number
  }
}

type PaletteMode = "section" | "content"

const EMPTY_FORM: Omit<BlogPost, "id"> = {
  title: "",
  date: "",
  excerpt: "",
  mediaUrl: "",
  mediaType: "image",
  href: "",
  type: "blog",
  isActive: true,
  sections: [],
  backLinkLabel: "Retour au blog",
  backLinkHref: "/blog",
}

const sectionOptions = [
  { type: "paragraph", label: "Vide", icon: AlignLeft },
  { type: "text_image", label: "Texte et image", icon: ImageIcon },
  { type: "columns", label: "Deux colonnes", icon: Columns2, settings: { columns: 2 } },
  { type: "columns", label: "Trois colonnes", icon: Columns3, settings: { columns: 3 } },
  { type: "heading2", label: "Titre", icon: Heading },
  { type: "highlight", label: "Services", icon: Box },
  { type: "button", label: "Tarifs", icon: LinkIcon },
  { type: "recent_posts", label: "Articles recents", icon: FileText },
  { type: "gallery", label: "Galerie photos", icon: Images },
  { type: "contact", label: "Contact", icon: MapPin },
  { type: "newsletter", label: "Newsletter", icon: Mail },
  { type: "faq", label: "FAQ", icon: HelpCircle },
] satisfies Array<{ type: BlogSectionType; label: string; icon: any; settings?: BlogSection["settings"] }>

const contentOptions = [
  { type: "paragraph", label: "Texte", icon: FileText },
  { type: "media", label: "Image", icon: ImageIcon, mediaType: "image" },
  { type: "gallery", label: "Galerie photo", icon: Images },
  { type: "media", label: "Video", icon: Video, mediaType: "video" },
  { type: "divider", label: "Ligne", icon: Minus },
  { type: "spacer", label: "Espace", icon: Plus },
  { type: "contact", label: "Plan", icon: MapPin },
  { type: "button", label: "Bouton", icon: LinkIcon },
  { type: "newsletter", label: "Formulaire de contact", icon: Mail },
  { type: "highlight", label: "Formulaire vierge", icon: MoreVertical },
  { type: "html", label: "HTML", icon: Code2 },
  { type: "button", label: "Fichier", icon: Paperclip },
  { type: "recent_posts", label: "Articles recents", icon: FileText },
] satisfies Array<{ type: BlogSectionType; label: string; icon: any; mediaType?: "image" | "video" }>

function createId(prefix = "section") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createSection(
  type: BlogSectionType,
  seed: Partial<BlogSection> = {},
): BlogSection {
  const settings = seed.settings || {}
  const columns = settings.columns === 3 ? 3 : 2
  const base: BlogSection = {
    id: createId(),
    type,
    title: "",
    text: "",
    items: [],
    mediaUrl: "",
    mediaType: seed.mediaType || "image",
    columns: Array.from({ length: columns }, () => ""),
    images: [],
    buttonLabel: "",
    buttonHref: "",
    html: "",
    settings: { background: "white", align: "center", height: "medium", width: 100, ...settings },
    ...seed,
  }

  if (type === "heading2") return { ...base, text: "Nouveau titre" }
  if (type === "heading3") return { ...base, text: "Nouveau sous-titre" }
  if (type === "paragraph") return { ...base, text: "Saisissez votre texte ici." }
  if (type === "highlight") return { ...base, title: "Encadre", text: "Ajoutez une information importante." }
  if (type === "bullet_list" || type === "numbered_list") return { ...base, items: ["Premier point"] }
  if (type === "media") return { ...base, title: seed.mediaType === "video" ? "Video" : "Image" }
  if (type === "text_image") return { ...base, title: "Texte et image", text: "Ajoutez votre contenu.", mediaType: "image" }
  if (type === "gallery") return { ...base, title: "Galerie photos", images: [] }
  if (type === "button") return { ...base, buttonLabel: "Contactez-nous", buttonHref: "/contactez-nous" }
  if (type === "html") return { ...base, html: "<div>Contenu HTML</div>" }
  if (type === "faq") return { ...base, title: "Questions frequentes", items: ["Question ?::Reponse."] }
  if (type === "contact") {
    return {
      ...base,
      title: "Contactez Danemo",
      text: "WhatsApp : +32 488 64 51 83\nEntrepot : Avenue du Port 108-110, 1000 Bruxelles",
      settings: { ...base.settings, background: "dark" },
    }
  }
  if (type === "newsletter") return { ...base, title: "Recevoir les conseils Danemo", text: "Ajoutez ici votre message." }
  if (type === "recent_posts") return { ...base, title: "Articles recents" }
  return base
}

function getSectionLabel(type: BlogSectionType) {
  const match = [...sectionOptions, ...contentOptions].find((option) => option.type === type)
  return match?.label || type
}

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<BlogPost, "id">>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [palette, setPalette] = useState<{ mode: PaletteMode; index: number } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const hydrateRef = useRef(false)

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedId) || null, [posts, selectedId])
  const activeSection = useMemo(
    () => form.sections.find((section) => section.id === activeSectionId) || null,
    [activeSectionId, form.sections],
  )
  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return posts
    return posts.filter((post) => `${post.title} ${post.excerpt}`.toLowerCase().includes(needle))
  }, [posts, query])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/blog-posts")
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Chargement impossible")
      setPosts(result.data || [])
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des contenus")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    hydrateRef.current = true
    if (selectedPost) {
      const { id: _id, ...payload } = selectedPost
      setForm({ ...EMPTY_FORM, ...payload, sections: payload.sections || [] })
    } else {
      setForm(EMPTY_FORM)
    }
    setActiveSectionId(null)
    setPalette(null)
    setHasUnsavedChanges(false)
    window.setTimeout(() => {
      hydrateRef.current = false
    }, 0)
  }, [selectedPost])

  const updateForm = (patch: Partial<Omit<BlogPost, "id">>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    if (!hydrateRef.current) setHasUnsavedChanges(true)
  }

  const updateSection = (id: string, patch: Partial<BlogSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    }))
    if (!hydrateRef.current) setHasUnsavedChanges(true)
  }

  const insertSection = (index: number, type: BlogSectionType, seed: Partial<BlogSection> = {}) => {
    const nextSection = createSection(type, seed)
    setForm((prev) => {
      const updated = [...prev.sections]
      updated.splice(index, 0, nextSection)
      return { ...prev, sections: updated }
    })
    setActiveSectionId(nextSection.id)
    setPalette(null)
    setHasUnsavedChanges(true)
  }

  const removeSection = (id: string) => {
    if (!window.confirm("Supprimer cette section ?")) return
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((section) => section.id !== id) }))
    if (activeSectionId === id) setActiveSectionId(null)
    setHasUnsavedChanges(true)
  }

  const duplicateSection = (section: BlogSection) => {
    const clone = { ...section, id: createId("section-copy") }
    const index = form.sections.findIndex((item) => item.id === section.id)
    setForm((prev) => {
      const updated = [...prev.sections]
      updated.splice(index + 1, 0, clone)
      return { ...prev, sections: updated }
    })
    setActiveSectionId(clone.id)
    setHasUnsavedChanges(true)
  }

  const moveSection = (id: string, direction: "up" | "down") => {
    setForm((prev) => {
      const index = prev.sections.findIndex((section) => section.id === id)
      if (index < 0) return prev
      if (direction === "up" && index === 0) return prev
      if (direction === "down" && index === prev.sections.length - 1) return prev
      const nextIndex = direction === "up" ? index - 1 : index + 1
      const updated = [...prev.sections]
      ;[updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]]
      return { ...prev, sections: updated }
    })
    setHasUnsavedChanges(true)
  }

  const uploadMedia = async (file: File, onUploaded: (mediaUrl: string, mediaType: "image" | "video") => void) => {
    try {
      setIsUploading(true)
      setError("")
      setMessage("")
      const uploadData = new FormData()
      uploadData.append("media", file)
      const response = await fetch("/api/blog-media", { method: "POST", body: uploadData })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Upload impossible")
      onUploaded(result.data.mediaUrl, result.data.mediaType)
      setMessage("Media televerse avec succes")
      setHasUnsavedChanges(true)
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const onNew = () => {
    setSelectedId(null)
    setForm({ ...EMPTY_FORM, date: new Date().toLocaleDateString("fr-FR") })
    setMessage("")
    setError("")
    setHasUnsavedChanges(true)
  }

  const onSelect = (id: string) => {
    if (hasUnsavedChanges && !window.confirm("Des modifications ne sont pas enregistrees. Changer d'article ?")) return
    setSelectedId(id)
    setMessage("")
    setError("")
  }

  const onSave = async () => {
    try {
      setIsSaving(true)
      setMessage("")
      setError("")
      const href = form.href || `/blog/${slugify(form.title || "nouvel-article")}`
      const payload = selectedId ? { id: selectedId, ...form, href } : { ...form, href }
      const response = await fetch("/api/blog-posts", {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Sauvegarde impossible")
      await fetchPosts()
      if (!selectedId && result.data?.id) setSelectedId(result.data.id)
      setForm((prev) => ({ ...prev, href }))
      setHasUnsavedChanges(false)
      setMessage(selectedId ? "Article mis a jour" : "Nouvel article ajoute")
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!window.confirm("Supprimer cet article ?")) return
    try {
      setIsSaving(true)
      setMessage("")
      setError("")
      const response = await fetch(`/api/blog-posts?id=${encodeURIComponent(selectedId)}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Suppression impossible")
      setSelectedId(null)
      await fetchPosts()
      setMessage("Article supprime")
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la suppression")
    } finally {
      setIsSaving(false)
    }
  }

  const renderPalette = () => {
    if (!palette) return null
    const options = palette.mode === "section" ? sectionOptions : contentOptions
    return (
      <div className="absolute left-8 top-9 z-30 w-[min(520px,calc(100vw-3rem))] overflow-hidden rounded-md bg-slate-900 text-slate-100 shadow-2xl ring-1 ring-slate-700">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 text-sm">
          <span>{palette.mode === "section" ? "Ajouter une section" : "Ajouter du contenu"}</span>
          <button
            type="button"
            onClick={() => setPalette(null)}
            className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Fermer
          </button>
        </div>
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          {options.map((option, idx) => {
            const Icon = option.icon
            return (
              <button
                key={`${option.label}-${idx}`}
                type="button"
                onClick={() =>
                  insertSection(palette.index, option.type, {
                    settings: "settings" in option ? option.settings : undefined,
                    mediaType: "mediaType" in option ? option.mediaType : undefined,
                  })
                }
                className="flex h-24 flex-col items-center justify-center gap-2 rounded border border-slate-700 bg-slate-800 p-3 text-center text-sm transition hover:border-slate-500 hover:bg-slate-700"
              >
                <Icon className="size-6 text-slate-400" />
                <span className="leading-tight">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderInsertHandle = (index: number, mode: PaletteMode = "section") => (
    <div className="relative my-5 flex items-center">
      <div className="h-px flex-1 border-t border-dashed border-slate-300" />
      <button
        type="button"
        onClick={() => setPalette((current) => (current?.index === index && current.mode === mode ? null : { mode, index }))}
        className="group relative z-10 flex size-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-white shadow-lg transition hover:bg-orange-500"
        title={mode === "section" ? "Ajouter une section" : "Ajouter du contenu"}
      >
        <Plus className="size-4" />
      </button>
      <div className="h-px flex-1 border-t border-dashed border-slate-300" />
      {palette?.index === index && palette.mode === mode && renderPalette()}
    </div>
  )

  const renderSectionEditor = (section: BlogSection, index: number) => {
    const isActive = activeSectionId === section.id
    const sectionShell =
      "group relative rounded-md border bg-white p-5 transition hover:border-slate-400 " +
      (isActive ? "border-slate-900 shadow-lg ring-2 ring-slate-900/10" : "border-transparent")

    return (
      <div key={section.id}>
        <section
          className={sectionShell}
          onClick={() => {
            setActiveSectionId(section.id)
            setPalette(null)
          }}
        >
          {isActive && (
            <div className="pointer-events-none absolute right-3 top-[-30px] z-10 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              Section selectionnee
            </div>
          )}

          <div className="absolute right-3 top-3 z-10 hidden items-center gap-1 rounded-md border bg-white p-1 shadow-sm group-hover:flex">
            <button type="button" onClick={() => moveSection(section.id, "up")} disabled={index === 0} className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Monter">
              <ArrowUp className="size-4" />
            </button>
            <button type="button" onClick={() => moveSection(section.id, "down")} disabled={index === form.sections.length - 1} className="rounded p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Descendre">
              <ArrowDown className="size-4" />
            </button>
            <button type="button" onClick={() => duplicateSection(section)} className="rounded p-1.5 text-slate-600 hover:bg-slate-100" title="Dupliquer">
              <Copy className="size-4" />
            </button>
            <button type="button" onClick={() => setActiveSectionId(section.id)} className="rounded p-1.5 text-slate-600 hover:bg-slate-100" title="Parametres">
              <Settings className="size-4" />
            </button>
            <button type="button" onClick={() => removeSection(section.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Supprimer">
              <Trash2 className="size-4" />
            </button>
          </div>

          {section.type === "heading2" && (
            <Input
              value={section.text || ""}
              onChange={(event) => updateSection(section.id, { text: event.target.value })}
              className="h-auto border-0 bg-transparent p-0 text-center font-serif text-4xl leading-tight text-amber-700 shadow-none focus-visible:ring-0"
            />
          )}
          {section.type === "heading3" && (
            <Input
              value={section.text || ""}
              onChange={(event) => updateSection(section.id, { text: event.target.value })}
              className="h-auto border-0 bg-transparent p-0 text-2xl font-semibold text-slate-800 shadow-none focus-visible:ring-0"
            />
          )}
          {(section.type === "paragraph" || section.type === "highlight") && (
            <div className={section.type === "highlight" ? "rounded-md bg-orange-50 p-5" : ""}>
              <Input
                value={section.title || ""}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                placeholder="Titre optionnel"
                className="mb-3 h-auto border-0 bg-transparent p-0 font-serif text-2xl text-amber-700 shadow-none focus-visible:ring-0"
              />
              <Textarea
                value={section.text || ""}
                onChange={(event) => updateSection(section.id, { text: event.target.value })}
                placeholder="Texte"
                rows={4}
                className="min-h-28 resize-y border-0 bg-transparent p-0 text-base leading-relaxed text-slate-700 shadow-none focus-visible:ring-0"
              />
            </div>
          )}
          {(section.type === "bullet_list" || section.type === "numbered_list" || section.type === "faq") && (
            <div>
              <Input
                value={section.title || ""}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                placeholder="Titre optionnel"
                className="mb-3 h-auto border-0 bg-transparent p-0 font-serif text-2xl text-amber-700 shadow-none focus-visible:ring-0"
              />
              <Textarea
                value={(section.items || []).join("\n")}
                onChange={(event) =>
                  updateSection(section.id, {
                    items: event.target.value.split("\n").filter((line) => line.trim().length > 0),
                  })
                }
                placeholder={section.type === "faq" ? "Question ?::Reponse." : "Une ligne = un element"}
                rows={5}
                className="resize-y text-base"
              />
            </div>
          )}
          {section.type === "media" && (
            <MediaEditor section={section} updateSection={updateSection} uploadMedia={uploadMedia} />
          )}
          {section.type === "text_image" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col justify-center">
                <Input
                  value={section.title || ""}
                  onChange={(event) => updateSection(section.id, { title: event.target.value })}
                  className="mb-3 h-auto border-0 bg-transparent p-0 font-serif text-2xl text-amber-700 shadow-none focus-visible:ring-0"
                />
                <Textarea
                  value={section.text || ""}
                  onChange={(event) => updateSection(section.id, { text: event.target.value })}
                  rows={6}
                  className="resize-y border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
                />
              </div>
              <MediaEditor section={section} updateSection={updateSection} uploadMedia={uploadMedia} compact />
            </div>
          )}
          {section.type === "columns" && (
            <div>
              <Input
                value={section.title || ""}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                placeholder="Titre optionnel"
                className="mb-5 h-auto border-0 bg-transparent p-0 font-serif text-2xl text-amber-700 shadow-none focus-visible:ring-0"
              />
              <div className={`grid gap-5 ${section.settings?.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {(section.columns || ["", ""]).map((column, columnIndex) => (
                  <Textarea
                    key={`${section.id}-column-${columnIndex}`}
                    value={column}
                    onChange={(event) => {
                      const nextColumns = [...(section.columns || [])]
                      nextColumns[columnIndex] = event.target.value
                      updateSection(section.id, { columns: nextColumns })
                    }}
                    placeholder={`Colonne ${columnIndex + 1}`}
                    rows={6}
                  />
                ))}
              </div>
            </div>
          )}
          {section.type === "gallery" && (
            <GalleryEditor section={section} updateSection={updateSection} uploadMedia={uploadMedia} />
          )}
          {section.type === "divider" && <div className="py-6"><div className="h-px bg-orange-200" /></div>}
          {section.type === "spacer" && <div className={section.settings?.height === "large" ? "h-20" : section.settings?.height === "small" ? "h-6" : "h-12"} />}
          {section.type === "button" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Input value={section.buttonLabel || ""} onChange={(event) => updateSection(section.id, { buttonLabel: event.target.value })} placeholder="Texte du bouton" className="max-w-sm text-center" />
              <Input value={section.buttonHref || ""} onChange={(event) => updateSection(section.id, { buttonHref: event.target.value })} placeholder="/contactez-nous" className="max-w-sm text-center" />
              <span className="inline-flex rounded-md bg-orange-500 px-6 py-3 font-medium text-white">{section.buttonLabel || "Bouton"}</span>
            </div>
          )}
          {section.type === "html" && (
            <Textarea value={section.html || ""} onChange={(event) => updateSection(section.id, { html: event.target.value })} rows={8} className="font-mono text-sm" />
          )}
          {(section.type === "contact" || section.type === "newsletter") && (
            <div className={section.type === "contact" ? "rounded-md bg-slate-900 p-6 text-white" : "rounded-md bg-orange-50 p-6 text-center"}>
              <Input
                value={section.title || ""}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                className={`mb-3 h-auto border-0 bg-transparent p-0 font-serif text-2xl shadow-none focus-visible:ring-0 ${section.type === "contact" ? "text-orange-100" : "text-amber-700"}`}
              />
              <Textarea
                value={section.text || ""}
                onChange={(event) => updateSection(section.id, { text: event.target.value })}
                rows={4}
                className={`resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 ${section.type === "contact" ? "text-white" : "text-slate-700"}`}
              />
            </div>
          )}
          {section.type === "recent_posts" && (
            <div>
              <Input
                value={section.title || ""}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                className="mb-4 h-auto border-0 bg-transparent p-0 font-serif text-2xl text-amber-700 shadow-none focus-visible:ring-0"
              />
              <div className="grid gap-3 md:grid-cols-3">
                {posts.filter((post) => post.id !== selectedId).slice(0, 3).map((post) => (
                  <div key={post.id} className="rounded-md border border-orange-100 p-4">
                    <p className="line-clamp-3 font-medium">{post.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{post.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        {renderInsertHandle(index + 1, "content")}
      </div>
    )
  }

  return (
    <AdminLayout title="Gestion Blogs">
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
          <Card className="h-fit overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-orange-500" />
                    Gerer les articles
                  </CardTitle>
                  <CardDescription>{posts.length} articles</CardDescription>
                </div>
                <Button onClick={onNew} variant="outline" size="icon" title="Ajouter un nouvel article">
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto p-3">
              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Chargement...</p>
              ) : (
                filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onSelect(post.id)}
                    className={`w-full rounded-md border p-3 text-left transition ${selectedId === post.id ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={post.isActive ? "default" : "outline"}>{post.isActive ? "Publie" : "Brouillon"}</Badge>
                      <span className="text-xs text-slate-500">{post.date}</span>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">{post.excerpt}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <div className="min-w-0">
            <div className="sticky top-3 z-20 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white/95 p-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={form.isActive ? "default" : "outline"}>{form.isActive ? "Publie" : "Brouillon"}</Badge>
                {hasUnsavedChanges && <Badge variant="outline">Modifications non enregistrees</Badge>}
                {isUploading && <Badge variant="outline">Upload en cours</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => window.open(form.href || "/blog", "_blank")} disabled={!form.href}>
                  <Eye className="size-4" />
                  Previsualiser
                </Button>
                <Button type="button" onClick={onSave} disabled={isSaving || isUploading} className="bg-orange-600 hover:bg-orange-700">
                  <Save className="size-4" />
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>

            <div className="rounded-md border bg-white px-4 py-8 shadow-sm sm:px-8 lg:px-12">
              <article className="mx-auto max-w-4xl">
                <header className="mb-12 text-center">
                  <Input
                    value={form.title}
                    onChange={(event) => {
                      const title = event.target.value
                      updateForm({ title, href: selectedId ? form.href : `/blog/${slugify(title)}` })
                    }}
                    placeholder="Titre de l'article"
                    className="h-auto border-0 bg-transparent p-0 text-center font-serif text-4xl leading-tight text-amber-700 shadow-none focus-visible:ring-0 md:text-6xl"
                  />
                  <div className="mx-auto my-5 h-1 w-16 bg-orange-100" />
                  <Input
                    value={form.date}
                    onChange={(event) => updateForm({ date: event.target.value })}
                    placeholder="Date"
                    className="mx-auto h-auto max-w-40 border-0 bg-transparent p-0 text-center text-sm italic text-slate-400 shadow-none focus-visible:ring-0"
                  />
                </header>

                {renderInsertHandle(0)}

                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Label>Vignette / media principal</Label>
                    <Label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50">
                      <ImageIcon className="size-4" />
                      Changer
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          await uploadMedia(file, (mediaUrl, mediaType) => updateForm({ mediaUrl, mediaType }))
                          event.target.value = ""
                        }}
                      />
                    </Label>
                  </div>
                  {form.mediaUrl ? (
                    form.mediaType === "video" ? (
                      <video src={form.mediaUrl} controls className="max-h-[520px] w-full rounded-md border object-cover shadow-lg" />
                    ) : (
                      <Image src={form.mediaUrl} alt={form.title || "Media principal"} width={1600} height={900} className="max-h-[520px] w-full rounded-md border object-cover shadow-lg" />
                    )
                  ) : (
                    <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed bg-slate-50 text-slate-500">Ajoutez une image principale</div>
                  )}
                </div>

                <section className="mb-8 rounded-md border border-transparent p-5 hover:border-slate-300">
                  <Textarea
                    value={form.excerpt}
                    onChange={(event) => updateForm({ excerpt: event.target.value })}
                    placeholder="Resume de l'article"
                    rows={4}
                    className="resize-y border-0 bg-transparent p-0 text-lg leading-relaxed text-slate-700 shadow-none focus-visible:ring-0"
                  />
                </section>

                {form.sections.map((section, index) => renderSectionEditor(section, index))}

                <div className="mt-10 text-center">
                  <span className="inline-flex rounded-md bg-orange-500 px-6 py-3 font-medium text-white">
                    {form.backLinkLabel || "Retour au blog"}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parametres article</CardTitle>
                <CardDescription>Publication, SEO et navigation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><PenLine className="size-4" /> Mode brouillon</Label>
                  <Select value={form.isActive ? "published" : "draft"} onValueChange={(value) => updateForm({ isActive: value === "published" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Publie</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="size-4" /> Planifier la publication</Label>
                  <Input value={form.date} onChange={(event) => updateForm({ date: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Lock className="size-4" /> Restreindre l'acces</Label>
                  <Input disabled value="Non active" />
                </div>
                <div className="space-y-2">
                  <Label>Parametres SEO de l'article</Label>
                  <Input value={form.href} onChange={(event) => updateForm({ href: event.target.value })} placeholder="/blog/slug" />
                  <Textarea value={form.excerpt} onChange={(event) => updateForm({ excerpt: event.target.value })} rows={4} placeholder="Meta description" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Texte bouton retour</Label>
                    <Input value={form.backLinkLabel || ""} onChange={(event) => updateForm({ backLinkLabel: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lien bouton retour</Label>
                    <Input value={form.backLinkHref || ""} onChange={(event) => updateForm({ backLinkHref: event.target.value })} />
                  </div>
                </div>
                {selectedPost && (
                  <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                    <p>Cree par : {selectedPost.createdByName || selectedPost.createdByEmail || "N/A"}</p>
                    <p>Modifie par : {selectedPost.updatedByName || selectedPost.updatedByEmail || "N/A"}</p>
                  </div>
                )}
                {selectedId && (
                  <Button type="button" variant="destructive" onClick={onDelete} disabled={isSaving} className="w-full">
                    <Trash2 className="size-4" />
                    Supprimer l'article
                  </Button>
                )}
              </CardContent>
            </Card>

            {activeSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Section active</CardTitle>
                  <CardDescription>{getSectionLabel(activeSection.type)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Arriere-plan</Label>
                    <Select
                      value={activeSection.settings?.background || "white"}
                      onValueChange={(value: "white" | "soft" | "dark") =>
                        updateSection(activeSection.id, { settings: { ...activeSection.settings, background: value } })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">Blanc</SelectItem>
                        <SelectItem value="soft">Doux</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeSection.type === "columns" && (
                    <div className="space-y-2">
                      <Label>Colonnes</Label>
                      <Select
                        value={String(activeSection.settings?.columns || 2)}
                        onValueChange={(value) => {
                          const count = value === "3" ? 3 : 2
                          updateSection(activeSection.id, {
                            settings: { ...activeSection.settings, columns: count },
                            columns: Array.from({ length: count }, (_, idx) => activeSection.columns?.[idx] || ""),
                          })
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Deux colonnes</SelectItem>
                          <SelectItem value="3">Trois colonnes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => duplicateSection(activeSection)} className="w-full">
                    <Copy className="size-4" />
                    Dupliquer la section
                  </Button>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}
      </div>
    </AdminLayout>
  )
}

function MediaEditor({
  section,
  updateSection,
  uploadMedia,
  compact = false,
}: {
  section: BlogSection
  updateSection: (id: string, patch: Partial<BlogSection>) => void
  uploadMedia: (file: File, onUploaded: (mediaUrl: string, mediaType: "image" | "video") => Promise<void> | void) => Promise<void>
  compact?: boolean
}) {
  const width = Math.min(100, Math.max(30, section.settings?.width || 100))

  return (
    <div className="space-y-3">
      {!compact && (
        <Input value={section.title || ""} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="Titre optionnel" />
      )}
      <div className="mx-auto overflow-hidden rounded-md border bg-slate-50" style={{ width: `${width}%` }}>
        {section.mediaUrl ? (
          section.mediaType === "video" ? (
            <video src={section.mediaUrl} controls className="max-h-96 w-full object-cover" />
          ) : (
            <Image src={section.mediaUrl} alt={section.title || "Media"} width={1200} height={760} className="max-h-96 w-full object-cover" />
          )
        ) : (
          <div className="flex min-h-56 items-center justify-center text-slate-500">Aucun media</div>
        )}
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <Input value={section.mediaUrl || ""} onChange={(event) => updateSection(section.id, { mediaUrl: event.target.value })} placeholder="/uploads/blog-media/..." />
        <Label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50">
          <ImageIcon className="size-4" />
          Uploader
          <Input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              await uploadMedia(file, (mediaUrl, mediaType) => updateSection(section.id, { mediaUrl, mediaType }))
              event.target.value = ""
            }}
          />
        </Label>
      </div>
      <div className="space-y-2 rounded-md border bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm">Taille du media</Label>
          <span className="text-sm font-medium text-slate-600">{width}%</span>
        </div>
        <input
          type="range"
          min={30}
          max={100}
          step={5}
          value={width}
          onChange={(event) =>
            updateSection(section.id, {
              settings: {
                ...section.settings,
                width: Number(event.target.value),
              },
            })
          }
          className="w-full accent-orange-500"
        />
      </div>
    </div>
  )
}

function GalleryEditor({
  section,
  updateSection,
  uploadMedia,
}: {
  section: BlogSection
  updateSection: (id: string, patch: Partial<BlogSection>) => void
  uploadMedia: (file: File, onUploaded: (mediaUrl: string, mediaType: "image" | "video") => Promise<void> | void) => Promise<void>
}) {
  const images = section.images || []
  return (
    <div className="space-y-3">
      <Input value={section.title || ""} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="Titre de galerie" />
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <div key={`${section.id}-gallery-${index}`} className="relative overflow-hidden rounded-md border bg-slate-50">
            <Image src={image || "/placeholder.svg"} alt={`Galerie ${index + 1}`} width={800} height={540} className="h-44 w-full object-cover" />
            <button
              type="button"
              onClick={() => updateSection(section.id, { images: images.filter((_, imageIndex) => imageIndex !== index) })}
              className="absolute right-2 top-2 rounded-md bg-white p-1.5 text-red-600 shadow"
              title="Retirer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <Label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-slate-50 text-sm text-slate-500 hover:bg-slate-100">
          <Plus className="size-5" />
          Ajouter une image
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              await uploadMedia(file, (mediaUrl) => updateSection(section.id, { images: [...images, mediaUrl] }))
              event.target.value = ""
            }}
          />
        </Label>
      </div>
    </div>
  )
}
