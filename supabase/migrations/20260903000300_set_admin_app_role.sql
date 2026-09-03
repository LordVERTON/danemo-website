BEGIN;

UPDATE auth.users
SET
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE email = 'admin@danemo.be';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = 'admin@danemo.be'
      AND raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin role assignment failed for the configured account';
  END IF;
END $$;

COMMIT;
