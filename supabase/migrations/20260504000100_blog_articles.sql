CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  cover_image_url TEXT,
  cover_image_public_id TEXT,

  seo_title TEXT,
  seo_description TEXT,

  legacy_content JSONB,
  puck_content JSONB NOT NULL DEFAULT '{"root": {}, "content": []}'::jsonb,

  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX articles_status_idx ON public.articles(status);
CREATE INDEX articles_slug_idx ON public.articles(slug);
CREATE INDEX articles_published_at_idx ON public.articles(published_at DESC);

CREATE TABLE public.article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_public_id TEXT,
  seo_title TEXT,
  seo_description TEXT,
  puck_content JSONB NOT NULL,
  legacy_content JSONB,

  revision_note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX article_revisions_article_id_idx
ON public.article_revisions(article_id);

CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  provider TEXT NOT NULL DEFAULT 'cloudinary'
    CHECK (provider IN ('cloudinary', 'supabase')),

  media_type TEXT NOT NULL
    CHECK (media_type IN ('image', 'video', 'file')),

  original_name TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,

  public_url TEXT NOT NULL,
  secure_url TEXT,

  cloudinary_public_id TEXT,
  cloudinary_resource_type TEXT,
  cloudinary_format TEXT,
  width INTEGER,
  height INTEGER,

  storage_bucket TEXT,
  storage_path TEXT,

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX media_library_provider_idx ON public.media_library(provider);
CREATE INDEX media_library_media_type_idx ON public.media_library(media_type);
CREATE INDEX media_library_created_at_idx ON public.media_library(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
