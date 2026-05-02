-- Minimal coherent test data for local development (no production or sensitive data).
-- Foreign keys: customers → containers → orders; optional packages / inventory / tracking.

-- ---------------------------------------------------------------------------
-- Auth + employees (admin / operators) — mêmes identifiants que /api/admin/seed-users
-- Mots de passe : admin123 (admin), operator123 (opérateurs). Uniquement pour le dev local.
-- ---------------------------------------------------------------------------
-- pgcrypto est déjà créé dans les migrations ; fonctions typiquement dans le schéma extensions.
DO $$
DECLARE
  v_admin_id   UUID := 'e1111111-1111-4111-8111-111111111101';
  v_op1_id     UUID := 'e2222222-2222-4222-8222-222222222202';
  v_op2_id     UUID := 'e3333333-3333-4333-8333-333333333303';
  v_pw_admin   TEXT := extensions.crypt('admin123', extensions.gen_salt('bf'));
  v_pw_oper    TEXT := extensions.crypt('operator123', extensions.gen_salt('bf'));
BEGIN
  -- Admin
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@danemo.be',
    v_pw_admin,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_admin_id,
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@danemo.be'),
    'email',
    v_admin_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Opérateur 1
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_op1_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operator@danemo.be',
    v_pw_oper,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"operator"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_op1_id,
    v_op1_id,
    jsonb_build_object('sub', v_op1_id::text, 'email', 'operator@danemo.be'),
    'email',
    v_op1_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Opérateur 2
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_op2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operator2@danemo.be',
    v_pw_oper,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"operator"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_op2_id,
    v_op2_id,
    jsonb_build_object('sub', v_op2_id::text, 'email', 'operator2@danemo.be'),
    'email',
    v_op2_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

INSERT INTO public.employees (user_id, name, email, role, salary, position, hire_date, is_active)
VALUES
  ('e1111111-1111-4111-8111-111111111101', 'Administrateur démo', 'admin@danemo.be', 'admin', 5000.00, 'Administrateur', DATE '2024-01-15', TRUE),
  ('e2222222-2222-4222-8222-222222222202', 'Opérateur démo', 'operator@danemo.be', 'operator', 3200.00, 'Opérateur logistique', DATE '2024-01-15', TRUE),
  ('e3333333-3333-4333-8333-333333333303', 'Opérateur démo 2', 'operator2@danemo.be', 'operator', 3100.00, 'Opérateur logistique', DATE '2024-03-01', TRUE);

INSERT INTO public.customers (
  name,
  email,
  phone,
  phone_e164,
  address,
  city,
  postal_code,
  country,
  company,
  status,
  opted_in_sms,
  opted_in_whatsapp
)
VALUES
  ('Client Démo Alpha', 'demo.alpha@example.com', '+32000000001', '+32000000001', 'Rue de la Loi 1', 'Bruxelles', '1000', 'Belgique', 'Alpha Demo SPRL', 'active', TRUE, FALSE),
  ('Client Démo Beta', 'demo.beta@example.com', '+32000000002', '+32000000002', 'Meir 10', 'Anvers', '2000', 'Belgique', NULL, 'active', TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.containers (code, vessel, departure_port, arrival_port, status, client_id)
SELECT
  'DEMOMSKU01',
  'MV Demo Ship',
  'Port d''Anvers, Belgique',
  'Port de Douala, Cameroun',
  'planned',
  c.id
FROM public.customers c
WHERE c.email = 'demo.alpha@example.com'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.containers (code, vessel, departure_port, arrival_port, status)
VALUES
  ('DEMOTCLU02', 'MV Demo Express', 'Rotterdam', 'Lagos', 'departed')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.orders (
  order_number,
  client_name,
  client_email,
  client_phone,
  service_type,
  origin,
  destination,
  weight,
  value,
  status,
  parcels_count,
  customer_id,
  container_id
)
SELECT
  'DEMO-ORD-000001',
  c.name,
  c.email,
  c.phone,
  'fret_maritime',
  'Bruxelles, Belgique',
  'Douala, Cameroun',
  1250.50,
  15000.00,
  'confirmed',
  2,
  c.id,
  ct.id
FROM public.customers c
JOIN public.containers ct ON ct.code = 'DEMOMSKU01'
WHERE c.email = 'demo.alpha@example.com'
LIMIT 1
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.orders (
  order_number,
  client_name,
  client_email,
  service_type,
  origin,
  destination,
  weight,
  value,
  status,
  customer_id,
  container_id
)
SELECT
  'DEMO-ORD-000002',
  c.name,
  c.email,
  'colis',
  'Anvers, Belgique',
  'Lagos, Nigeria',
  42.00,
  350.00,
  'pending',
  c.id,
  NULL
FROM public.customers c
WHERE c.email = 'demo.beta@example.com'
LIMIT 1
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.tracking_events (order_id, status, location, description)
SELECT o.id, 'confirmed', 'Bruxelles', 'Seed: prise en charge'
FROM public.orders o
WHERE o.order_number = 'DEMO-ORD-000001'
LIMIT 1;

INSERT INTO public.inventory (
  type,
  reference,
  description,
  client,
  status,
  location,
  poids,
  valeur
)
SELECT
  'colis',
  'INV-DEMO-0001',
  'Colis de démonstration — inventaire',
  'Client Démo Alpha',
  'en_stock',
  'Entrepôt principal',
  '12 kg',
  '250'
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory WHERE reference = 'INV-DEMO-0001'
);

INSERT INTO public.invoices (
  customer_id,
  order_id,
  issue_date,
  status,
  subtotal,
  tax_rate
)
SELECT
  c.id,
  o.id,
  CURRENT_DATE,
  'draft',
  500.00,
  21.00
FROM public.customers c
JOIN public.orders o ON o.customer_id = c.id AND o.order_number = 'DEMO-ORD-000001'
WHERE c.email = 'demo.alpha@example.com'
LIMIT 1;
