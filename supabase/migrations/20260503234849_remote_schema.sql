DO $$
BEGIN
  IF to_regclass('public.article_revisions') IS NOT NULL THEN
    ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.articles') IS NOT NULL THEN
    ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
  END IF;

  IF to_regclass('public.media_library') IS NOT NULL THEN
    ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

