BEGIN;

-- public.employees.role is the source of truth for back-office authorization.
UPDATE auth.users AS auth_user
SET
  raw_app_meta_data = jsonb_set(
    COALESCE(auth_user.raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(employee.role),
    true
  ),
  updated_at = NOW()
FROM public.employees AS employee
WHERE employee.user_id = auth_user.id
  AND employee.role IN ('admin', 'operator')
  AND auth_user.raw_app_meta_data ->> 'role' IS DISTINCT FROM employee.role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.employees AS employee
    INNER JOIN auth.users AS auth_user ON auth_user.id = employee.user_id
    WHERE employee.role IN ('admin', 'operator')
      AND auth_user.raw_app_meta_data ->> 'role' IS DISTINCT FROM employee.role
  ) THEN
    RAISE EXCEPTION 'Auth roles are not synchronized with employee roles';
  END IF;
END $$;

COMMIT;
