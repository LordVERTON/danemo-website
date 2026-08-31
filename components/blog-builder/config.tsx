import type { Config, Data } from "@measured/puck"
import Link from "next/link"
import { FilePickerField } from "@/components/blog-builder/fields/FilePickerField"
import { GalleryField } from "@/components/blog-builder/fields/GalleryField"
import { MediaPickerField } from "@/components/blog-builder/fields/MediaPickerField"
import { MediaSizeField } from "@/components/blog-builder/fields/MediaSizeField"
import { RichTextField } from "@/components/blog-builder/fields/RichTextField"

type Align = "left" | "center" | "right"
type SpaceSize = "small" | "medium" | "large"

export type BlogPuckProps = {
  RichText: { content: string }
  ImageBlock: { src: string; alt: string; caption: string; width: number }
  GalleryBlock: { title: string; images: string[] }
  VideoBlock: { src: string; title: string; caption: string; width: number }
  TwoColumnsBlock: { left: string; right: string }
  ThreeColumnsBlock: { left: string; center: string; right: string }
  ButtonBlock: { label: string; href: string; align: Align }
  FaqBlock: { question: string; answer: string }
  ContactBlock: { title: string; content: string; buttonLabel: string; buttonHref: string }
  NewsletterBlock: { title: string; content: string; buttonLabel: string; buttonHref: string }
  RecentArticlesBlock: { title: string; count: number }
  HtmlBlock: { html: string }
  DividerBlock: { tone: "light" | "orange" | "dark" }
  SpacerBlock: { size: SpaceSize }
  FileBlock: { label: string; url: string; description: string }
}

export type BlogPuckData = Data<BlogPuckProps>

export const emptyBlogPuckData: BlogPuckData = {
  root: {},
  content: [],
}

function alignClass(align: Align) {
  if (align === "left") return "text-left"
  if (align === "right") return "text-right"
  return "text-center"
}

function dividerClass(tone: BlogPuckProps["DividerBlock"]["tone"]) {
  if (tone === "dark") return "border-slate-300"
  if (tone === "orange") return "border-orange-200"
  return "border-slate-100"
}

function spacerClass(size: SpaceSize) {
  if (size === "small") return "h-6"
  if (size === "large") return "h-20"
  return "h-12"
}

function mediaWidth(width?: number) {
  return Math.min(100, Math.max(30, Number(width || 100)))
}

function RichTextRender({ html }: { html: string }) {
  return (
    <div
      className="prose prose-lg max-w-none text-slate-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export const blogPuckConfig: Config<BlogPuckProps> = {
  categories: {
    Contenu: {
      components: ["RichText", "ImageBlock", "GalleryBlock", "VideoBlock", "FileBlock"],
    },
    Structure: {
      components: ["TwoColumnsBlock", "ThreeColumnsBlock", "DividerBlock", "SpacerBlock", "HtmlBlock"],
    },
    Conversion: {
      components: ["ButtonBlock", "FaqBlock", "ContactBlock", "NewsletterBlock", "RecentArticlesBlock"],
    },
  },
  components: {
    RichText: {
      label: "Texte riche",
      fields: {
        content: {
          type: "custom",
          label: "Contenu",
          render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} />,
        },
      },
      defaultProps: { content: "<p>Nouveau paragraphe...</p>" },
      render: ({ content }) => <RichTextRender html={content} />,
    },
    ImageBlock: {
      label: "Image",
      fields: {
        src: {
          type: "custom",
          label: "Media",
          render: ({ value, onChange }) => <MediaPickerField value={value} onChange={onChange} />,
        },
        alt: { type: "text", label: "Texte alternatif" },
        caption: { type: "text", label: "Legende" },
        width: {
          type: "custom",
          label: "Taille",
          render: ({ value, onChange }) => <MediaSizeField value={value} onChange={onChange} />,
        },
      },
      defaultProps: { src: "", alt: "", caption: "", width: 100 },
      render: ({ src, alt, caption, width }) => (
        <figure className="mx-auto my-8" style={{ width: `${mediaWidth(width)}%` }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt || ""} className="w-full rounded-md object-cover shadow-lg" />
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed bg-slate-50 text-slate-500">
              Image non selectionnee
            </div>
          )}
          {caption ? <figcaption className="mt-2 text-center text-sm text-slate-500">{caption}</figcaption> : null}
        </figure>
      ),
    },
    GalleryBlock: {
      label: "Galerie photo",
      fields: {
        title: { type: "text", label: "Titre" },
        images: {
          type: "custom",
          label: "Images",
          render: ({ value, onChange }) => <GalleryField value={value} onChange={onChange} />,
        },
      },
      defaultProps: { title: "Galerie photos", images: [] },
      render: ({ title, images }) => (
        <section className="my-8">
          {title ? <h2 className="mb-4 font-serif text-2xl text-amber-700">{title}</h2> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {(images || []).map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${image}-${index}`} src={image} alt="" className="h-64 w-full rounded-md object-cover shadow-lg" />
            ))}
          </div>
        </section>
      ),
    },
    VideoBlock: {
      label: "Video",
      fields: {
        title: { type: "text", label: "Titre" },
        src: {
          type: "custom",
          label: "Video",
          render: ({ value, onChange }) => <MediaPickerField value={value} onChange={onChange} />,
        },
        caption: { type: "text", label: "Legende" },
        width: {
          type: "custom",
          label: "Taille",
          render: ({ value, onChange }) => <MediaSizeField value={value} onChange={onChange} />,
        },
      },
      defaultProps: { title: "", src: "", caption: "", width: 100 },
      render: ({ title, src, caption, width }) => (
        <section className="my-8">
          {title ? <h2 className="mb-4 font-serif text-2xl text-amber-700">{title}</h2> : null}
          <div className="mx-auto" style={{ width: `${mediaWidth(width)}%` }}>
            {src ? (
              <video src={src} controls className="w-full rounded-md shadow-lg" />
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed bg-slate-50 text-slate-500">
                Video non selectionnee
              </div>
            )}
          </div>
          {caption ? <p className="mt-2 text-center text-sm text-slate-500">{caption}</p> : null}
        </section>
      ),
    },
    TwoColumnsBlock: {
      label: "Deux colonnes",
      fields: {
        left: { type: "custom", label: "Colonne gauche", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
        right: { type: "custom", label: "Colonne droite", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
      },
      defaultProps: { left: "<p>Colonne gauche</p>", right: "<p>Colonne droite</p>" },
      render: ({ left, right }) => (
        <div className="my-8 grid gap-8 md:grid-cols-2">
          <RichTextRender html={left} />
          <RichTextRender html={right} />
        </div>
      ),
    },
    ThreeColumnsBlock: {
      label: "Trois colonnes",
      fields: {
        left: { type: "custom", label: "Colonne gauche", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
        center: { type: "custom", label: "Colonne centre", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
        right: { type: "custom", label: "Colonne droite", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
      },
      defaultProps: { left: "<p>Colonne gauche</p>", center: "<p>Colonne centre</p>", right: "<p>Colonne droite</p>" },
      render: ({ left, center, right }) => (
        <div className="my-8 grid gap-6 md:grid-cols-3">
          <RichTextRender html={left} />
          <RichTextRender html={center} />
          <RichTextRender html={right} />
        </div>
      ),
    },
    ButtonBlock: {
      label: "Bouton",
      fields: {
        label: { type: "text", label: "Texte du bouton" },
        href: { type: "text", label: "Lien" },
        align: {
          type: "select",
          label: "Alignement",
          options: [
            { label: "Gauche", value: "left" },
            { label: "Centre", value: "center" },
            { label: "Droite", value: "right" },
          ],
        },
      },
      defaultProps: { label: "Contactez-nous", href: "/contactez-nous", align: "center" },
      render: ({ label, href, align }) => (
        <div className={`my-8 ${alignClass(align)}`}>
          <a href={href || "/contactez-nous"} className="inline-flex rounded-md bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600">
            {label || "Contactez-nous"}
          </a>
        </div>
      ),
    },
    FaqBlock: {
      label: "FAQ",
      fields: {
        question: { type: "text", label: "Question" },
        answer: {
          type: "custom",
          label: "Reponse",
          render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} />,
        },
      },
      defaultProps: { question: "Question frequente", answer: "<p>Reponse...</p>" },
      render: ({ question, answer }) => (
        <div className="my-6 rounded-md border border-orange-100 bg-orange-50 p-6">
          <h3 className="mb-3 text-xl font-semibold text-slate-900">{question}</h3>
          <RichTextRender html={answer} />
        </div>
      ),
    },
    ContactBlock: {
      label: "Contact",
      fields: {
        title: { type: "text", label: "Titre" },
        content: { type: "custom", label: "Contenu", render: ({ value, onChange }) => <RichTextField value={value} onChange={onChange} /> },
        buttonLabel: { type: "text", label: "Texte du bouton" },
        buttonHref: { type: "text", label: "Lien du bouton" },
      },
      defaultProps: {
        title: "Contactez Danemo",
        content: "<p>WhatsApp : +32 488 64 51 83<br>Entrepot : Avenue du Port 108-110, 1000 Bruxelles</p>",
        buttonLabel: "Nous contacter",
        buttonHref: "/contactez-nous",
      },
      render: ({ title, content, buttonLabel, buttonHref }) => (
        <section className="my-8 rounded-md bg-slate-900 p-6 text-white">
          <h2 className="mb-3 font-serif text-2xl text-orange-100">{title}</h2>
          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          <a href={buttonHref || "/contactez-nous"} className="mt-5 inline-flex rounded-md bg-orange-500 px-5 py-2.5 font-medium text-white hover:bg-orange-600">
            {buttonLabel || "Nous contacter"}
          </a>
        </section>
      ),
    },
    NewsletterBlock: {
      label: "Newsletter",
      fields: {
        title: { type: "text", label: "Titre" },
        content: { type: "text", label: "Description" },
        buttonLabel: { type: "text", label: "Texte du bouton" },
        buttonHref: { type: "text", label: "Lien" },
      },
      defaultProps: {
        title: "Recevoir les conseils Danemo",
        content: "Suivez nos prochains conseils transport et logistique.",
        buttonLabel: "S'inscrire",
        buttonHref: "/contactez-nous",
      },
      render: ({ title, content, buttonLabel, buttonHref }) => (
        <section className="my-8 rounded-md border border-orange-100 bg-orange-50 p-6 text-center">
          <h2 className="font-serif text-2xl text-amber-700">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-700">{content}</p>
          <a href={buttonHref || "/contactez-nous"} className="mt-5 inline-flex rounded-md bg-orange-500 px-5 py-2.5 font-medium text-white hover:bg-orange-600">
            {buttonLabel || "S'inscrire"}
          </a>
        </section>
      ),
    },
    RecentArticlesBlock: {
      label: "Articles recents",
      fields: {
        title: { type: "text", label: "Titre" },
        count: { type: "number", label: "Nombre", min: 1, max: 6 },
      },
      defaultProps: { title: "Articles recents", count: 3 },
      render: ({ title, count }) => (
        <section className="my-8 rounded-md border border-orange-100 p-6">
          <h2 className="font-serif text-2xl text-amber-700">{title}</h2>
          <p className="mt-3 text-slate-600">
            Bloc articles recents ({count}). Le rendu dynamique complet sera branche avec les donnees publiques du blog.
          </p>
          <Link href="/blog" className="mt-4 inline-flex font-medium text-orange-600 hover:text-orange-700">
            Voir le blog
          </Link>
        </section>
      ),
    },
    HtmlBlock: {
      label: "HTML",
      fields: {
        html: { type: "textarea", label: "HTML" },
      },
      defaultProps: { html: "<div>Contenu HTML</div>" },
      render: ({ html }) => <section className="my-8" dangerouslySetInnerHTML={{ __html: html }} />,
    },
    DividerBlock: {
      label: "Ligne",
      fields: {
        tone: {
          type: "select",
          label: "Style",
          options: [
            { label: "Clair", value: "light" },
            { label: "Orange", value: "orange" },
            { label: "Sombre", value: "dark" },
          ],
        },
      },
      defaultProps: { tone: "orange" },
      render: ({ tone }) => <hr className={`my-10 ${dividerClass(tone)}`} />,
    },
    SpacerBlock: {
      label: "Espace",
      fields: {
        size: {
          type: "select",
          label: "Taille",
          options: [
            { label: "Petit", value: "small" },
            { label: "Moyen", value: "medium" },
            { label: "Grand", value: "large" },
          ],
        },
      },
      defaultProps: { size: "medium" },
      render: ({ size }) => <div className={spacerClass(size)} />,
    },
    FileBlock: {
      label: "Fichier",
      fields: {
        label: { type: "text", label: "Libelle" },
        url: {
          type: "custom",
          label: "Fichier",
          render: ({ value, onChange }) => <FilePickerField value={value} onChange={onChange} />,
        },
        description: { type: "text", label: "Description" },
      },
      defaultProps: { label: "Telecharger le fichier", url: "", description: "" },
      render: ({ label, url, description }) => (
        <section className="my-8 rounded-md border border-slate-200 p-5">
          {description ? <p className="mb-3 text-slate-600">{description}</p> : null}
          <a href={url || "#"} target="_blank" rel="noreferrer" className="inline-flex rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-800">
            {label || "Telecharger le fichier"}
          </a>
        </section>
      ),
    },
  },
}
