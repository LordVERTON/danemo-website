BEGIN;

-- Si l'utilisateur admin existe déjà, on force son rôle applicatif à "admin".
-- Lors d'un `supabase db reset`, il peut ne pas encore exister :
-- seed.sql sera exécuté après les migrations et le créera avec le bon rôle.
UPDATE auth.users
SET
  raw_app_meta_data =
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb,
      true
    ),
  updated_at = NOW()
WHERE lower(email) = lower('admin@danemo.be');

COMMIT;