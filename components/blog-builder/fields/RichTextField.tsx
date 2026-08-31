"use client"

import { useCallback, useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import { Bold, Heading2, Heading3, ImageIcon, Italic, LinkIcon, List, ListOrdered, Pilcrow } from "lucide-react"

type RichTextFieldProps = {
  value?: string
  onChange?: (value: string) => void
}

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-md text-slate-100 transition hover:bg-slate-700 ${
        active ? "bg-slate-700 text-white" : ""
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextField({ value = "", onChange }: RichTextFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TiptapImage.configure({
        allowBase64: false,
      }),
    ],
    content: value || "<p></p>",
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none prose prose-invert max-w-none",
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    const current = editor.getHTML()
    const next = value || "<p></p>"
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL du lien", previousUrl || "https://")

    if (url === null) return
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("URL de l'image", "https://")
    if (!url?.trim()) return
    editor.chain().focus().setImage({ src: url.trim() }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className="rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
        Chargement de l'editeur...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-700 bg-slate-900 p-2 shadow-sm">
        <ToolbarButton title="Paragraphe" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-700" />
        <ToolbarButton title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-700" />
        <ToolbarButton title="Liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Liste numerotee" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-700" />
        <ToolbarButton title="Lien" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={addImage}>
          <ImageIcon className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
