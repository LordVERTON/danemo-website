"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
}

interface BlogSection {
  id: string
  type: "heading2" | "heading3" | "paragraph" | "bullet_list" | "numbered_list" | "media" | "highlight"
  title?: string
  text?: string
  items?: string[]
  mediaUrl?: string
  mediaType?: "image" | "video"
}

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
  backLinkLabel: "← Retour au blog",
  backLinkHref: "/blog",
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

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedId) || null, [posts, selectedId])

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
    if (selectedPost) {
      const { id: _id, ...payload } = selectedPost
      setForm(payload)
    } else {
      setForm(EMPTY_FORM)
    }
  }, [selectedPost])

  const onNew = () => {
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setMessage("")
    setError("")
  }

  const onSelect = (id: string) => {
    setSelectedId(id)
    setMessage("")
    setError("")
  }

  const onSave = async () => {
    try {
      setIsSaving(true)
      setMessage("")
      setError("")

      const method = selectedId ? "PUT" : "POST"
      const payload = selectedId ? { id: selectedId, ...form } : form

      const response = await fetch("/api/blog-posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Sauvegarde impossible")

      await fetchPosts()
      if (!selectedId && result.data?.id) {
        setSelectedId(result.data.id)
      }
      setMessage(selectedId ? "Contenu mis à jour" : "Nouveau contenu ajouté")
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  const addSection = (type: BlogSection["type"]) => {
    const section: BlogSection = {
      id: `section-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      title: "",
      text: "",
      items: type === "bullet_list" || type === "numbered_list" ? [""] : [],
      mediaUrl: "",
      mediaType: "image",
    }
    setForm((prev) => ({ ...prev, sections: [...prev.sections, section] }))
  }

  const updateSection = (id: string, patch: Partial<BlogSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    }))
  }

  const removeSection = (id: string) => {
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((section) => section.id !== id) }))
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
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!window.confirm("Supprimer ce contenu ?")) return

    try {
      setIsSaving(true)
      setMessage("")
      setError("")
      const response = await fetch(`/api/blog-posts?id=${encodeURIComponent(selectedId)}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Suppression impossible")
      setSelectedId(null)
      await fetchPosts()
      setMessage("Contenu supprimé")
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la suppression")
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionPreview = (section: BlogSection) => {
    if (section.type === "heading2") {
      return <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.text}</h2>
    }
    if (section.type === "heading3") {
      return <h3 className="text-xl font-semibold text-gray-800 mb-3">{section.text}</h3>
    }
    if (section.type === "paragraph") {
      return (
        <section className="mb-6">
          {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
        </section>
      )
    }
    if (section.type === "highlight") {
      return (
        <section className="mb-6 bg-orange-50 p-6 rounded-lg">
          {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.text}</p>
        </section>
      )
    }
    if (section.type === "bullet_list") {
      return (
        <section className="mb-6">
          {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {(section.items || []).map((item, idx) => (
              <li key={`${section.id}-preview-b-${idx}`}>{item}</li>
            ))}
          </ul>
        </section>
      )
    }
    if (section.type === "numbered_list") {
      return (
        <section className="mb-6">
          {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {(section.items || []).map((item, idx) => (
              <li key={`${section.id}-preview-n-${idx}`}>{item}</li>
            ))}
          </ol>
        </section>
      )
    }
    if (section.type === "media") {
      return (
        <section className="mb-8">
          {section.title && <h2 className="text-2xl font-serif text-amber-700 mb-4">{section.title}</h2>}
          {section.mediaType === "video" ? (
            <video src={section.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
          ) : (
            <img src={section.mediaUrl || "/placeholder.svg"} alt={section.title || "Apercu section"} className="w-full rounded-lg shadow-lg" />
          )}
        </section>
      )
    }
    return null
  }

  return (
    <AdminLayout title="Gestion Blogs">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contenus existants</CardTitle>
            <CardDescription>Modifier un contenu ou en ajouter un nouveau</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onNew} className="w-full bg-orange-600 hover:bg-orange-700">
              + Nouveau contenu
            </Button>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelect(post.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === post.id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge>{post.type.toUpperCase()}</Badge>
                    {!post.isActive && <Badge variant="outline">Inactif</Badge>}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{post.date}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedId ? "Modifier le contenu" : "Ajouter un contenu"}</CardTitle>
            <CardDescription>Ces données alimentent la section blogs du site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date (texte)</Label>
                <Input id="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backLinkLabel">Texte bouton retour</Label>
                <Input
                  id="backLinkLabel"
                  value={form.backLinkLabel || ""}
                  onChange={(e) => setForm({ ...form, backLinkLabel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backLinkHref">Lien bouton retour</Label>
                <Input
                  id="backLinkHref"
                  value={form.backLinkHref || ""}
                  onChange={(e) => setForm({ ...form, backLinkHref: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" value="Blog" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Statut</Label>
                <Select
                  value={form.isActive ? "active" : "inactive"}
                  onValueChange={(value) => setForm({ ...form, isActive: value === "active" })}
                >
                  <SelectTrigger id="isActive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Résumé</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={5}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mediaUrl">Media (URL ou chemin)</Label>
                <Input
                  id="mediaUrl"
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="/uploads/blog-media/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="href">Lien de destination</Label>
                <Input id="href" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaUpload">Uploader une image ou une video (1 fichier max)</Label>
              <Input
                id="mediaUpload"
                type="file"
                accept="image/*,video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setIsUploading(true)
                    setError("")
                    setMessage("")
                    const uploadData = new FormData()
                    uploadData.append("media", file)
                    const response = await fetch("/api/blog-media", {
                      method: "POST",
                      body: uploadData,
                    })
                    const result = await response.json()
                    if (!result.success) throw new Error(result.error || "Upload impossible")
                    setForm((prev) => ({
                      ...prev,
                      mediaUrl: result.data.mediaUrl,
                      mediaType: result.data.mediaType,
                    }))
                    setMessage("Media televerse avec succes")
                  } catch (err: any) {
                    setError(err?.message || "Erreur lors de l'upload")
                  } finally {
                    setIsUploading(false)
                    e.target.value = ""
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptes: image/* ou video/*. Le nouveau fichier remplace le media courant.
              </p>
            </div>

            {form.mediaUrl && (
              <div className="space-y-2">
                <Label>Apercu du media</Label>
                {form.mediaType === "video" ? (
                  <video src={form.mediaUrl} controls className="w-full max-h-64 rounded border object-cover" />
                ) : (
                  <img src={form.mediaUrl} alt="Apercu media" className="w-full max-h-64 rounded border object-cover" />
                )}
              </div>
            )}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label>Sections du blog (structure complete)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => addSection("heading2")}>+ H2</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("heading3")}>+ H3</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("paragraph")}>+ Paragraphe</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("bullet_list")}>+ Liste</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("numbered_list")}>+ Liste num.</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("media")}>+ Media</Button>
                  <Button type="button" variant="outline" onClick={() => addSection("highlight")}>+ Encadre</Button>
                </div>
              </div>

              <div className="space-y-4">
                {form.sections.map((section, index) => (
                  <div key={section.id} className="rounded border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Section {index + 1} - {section.type}</p>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => moveSection(section.id, "up")} disabled={index === 0}>
                          Monter
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => moveSection(section.id, "down")}
                          disabled={index === form.sections.length - 1}
                        >
                          Descendre
                        </Button>
                        <Button type="button" variant="destructive" onClick={() => removeSection(section.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Titre de section (optionnel)"
                      value={section.title || ""}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    />
                    {(section.type === "paragraph" || section.type === "highlight") && (
                      <Textarea
                        rows={4}
                        placeholder="Texte"
                        value={section.text || ""}
                        onChange={(e) => updateSection(section.id, { text: e.target.value })}
                      />
                    )}
                    {(section.type === "heading2" || section.type === "heading3") && (
                      <Input
                        placeholder="Texte du titre"
                        value={section.text || ""}
                        onChange={(e) => updateSection(section.id, { text: e.target.value })}
                      />
                    )}
                    {(section.type === "bullet_list" || section.type === "numbered_list") && (
                      <Textarea
                        rows={5}
                        placeholder="Une ligne = un point de liste"
                        value={(section.items || []).join("\n")}
                        onChange={(e) =>
                          updateSection(section.id, {
                            items: e.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    )}
                    {section.type === "media" && (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          placeholder="/uploads/blog-media/..."
                          value={section.mediaUrl || ""}
                          onChange={(e) => updateSection(section.id, { mediaUrl: e.target.value })}
                        />
                        <Select
                          value={section.mediaType || "image"}
                          onValueChange={(value: "image" | "video") => updateSection(section.id, { mediaType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <div className="flex flex-wrap gap-3">
              <Button onClick={onSave} disabled={isSaving || isUploading} className="bg-orange-600 hover:bg-orange-700">
                {isSaving ? "Enregistrement..." : isUploading ? "Upload en cours..." : "Enregistrer"}
              </Button>
              {selectedId && (
                <Button onClick={onDelete} variant="destructive" disabled={isSaving}>
                  Supprimer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Previsualisation en direct</CardTitle>
          <CardDescription>Rendu de l'article tel qu'il apparaitra sur la page blog</CardDescription>
        </CardHeader>
        <CardContent>
          <article className="prose prose-lg max-w-none">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-serif text-amber-700 mb-4 leading-tight">{form.title || "Titre de l'article"}</h1>
              <p className="text-gray-600 text-sm">{form.date || "Date"}</p>
            </header>

            {form.mediaUrl && (
              <div className="mb-8">
                {form.mediaType === "video" ? (
                  <video src={form.mediaUrl} controls className="w-full rounded-lg shadow-lg" />
                ) : (
                  <img src={form.mediaUrl} alt={form.title || "Media principal"} className="w-full rounded-lg shadow-lg" />
                )}
              </div>
            )}

            {form.excerpt && (
              <div className="mb-8">
                <p className="text-lg text-gray-700 leading-relaxed">{form.excerpt}</p>
              </div>
            )}

            {form.sections.map((section) => (
              <div key={`preview-${section.id}`}>{renderSectionPreview(section)}</div>
            ))}
          </article>
          <div className="mt-12 text-center">
            <a
              href={form.backLinkHref || "/blog"}
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {form.backLinkLabel || "← Retour au blog"}
            </a>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
