-- Table de persistance des medias blogs
CREATE TABLE IF NOT EXISTS public.blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'blog-media',
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_media_created_at ON public.blog_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_media_media_type ON public.blog_media(media_type);
