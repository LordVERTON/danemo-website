import Link from "next/link"
import { getArticleById } from "@/lib/articles"
import { BlogPuckEditor } from "@/components/blog-builder/BlogPuckEditor"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogWithPuckPage({ params }: PageProps) {
  const { id } = await params
  const article = await getArticleById(id)

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-3">
        <Link href="/admin/blogs" className="text-sm font-medium text-slate-300 hover:text-white">
          Retour aux articles
        </Link>
      </div>
      <BlogPuckEditor
        articleId={article.id}
        articleTitle={article.title}
        initialData={article.puck_content}
      />
    </div>
  )
}
