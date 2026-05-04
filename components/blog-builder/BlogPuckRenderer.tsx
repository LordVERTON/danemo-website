import { Render } from "@measured/puck"
import { blogPuckConfig, emptyBlogPuckData, type BlogPuckData } from "@/components/blog-builder/config"

type BlogPuckRendererProps = {
  data: unknown
}

function isPuckData(data: unknown): data is BlogPuckData {
  return Boolean(data && typeof data === "object" && Array.isArray((data as BlogPuckData).content))
}

export function hasPuckContent(data: unknown) {
  return isPuckData(data) && data.content.length > 0
}

export function BlogPuckRenderer({ data }: BlogPuckRendererProps) {
  return <Render config={blogPuckConfig} data={isPuckData(data) ? data : emptyBlogPuckData} />
}
