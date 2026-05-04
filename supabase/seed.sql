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
  description,
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
  'Colis de démonstration - lot maritime',
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
  description,
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
  'Colis de démonstration - petit envoi',
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

WITH tariff_orders (
  order_number,
  customer_email,
  item_label,
  price,
  destination,
  order_status
) AS (
  VALUES
    ('DEMO-ORD-TARIF-001', 'demo.alpha@example.com', 'Canapé 2 places à partir de', 250.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-002', 'demo.beta@example.com', 'Canapé 3 places à partir de', 350.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-003', 'demo.alpha@example.com', 'Canapé d''angle à partir de', 350.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-004', 'demo.beta@example.com', 'Cantine 100 cm', 140.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-005', 'demo.alpha@example.com', 'Cantine 80/90 cm', 125.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-006', 'demo.beta@example.com', 'Carreaux (prix par palette)', 700.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-007', 'demo.alpha@example.com', 'Congélateur + de 500 litres, à partir de', 550.00, 'Douala, Cameroun', 'in_progress'),
    ('DEMO-ORD-TARIF-008', 'demo.beta@example.com', 'Congélateur 150 - 250 litres à partir de', 275.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-009', 'demo.alpha@example.com', 'Congélateur 251 - 490 litres à partir de', 350.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-010', 'demo.beta@example.com', 'Cuisinière + de 4 foyers, à partir de', 175.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-011', 'demo.alpha@example.com', 'Cuisinière - de 4 foyers, à partir de', 160.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-012', 'demo.beta@example.com', 'Fût Orange: prix de vente vide', 30.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-013', 'demo.alpha@example.com', 'Fût Orange 220 L', 170.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-014', 'demo.beta@example.com', 'Groupe électrogène, à partir de', 220.00, 'Lagos, Nigeria', 'in_progress'),
    ('DEMO-ORD-TARIF-015', 'demo.alpha@example.com', 'Lave - linge - de 10 kg', 180.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-016', 'demo.beta@example.com', 'Lave - linge 6 - 10 kg', 165.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-017', 'demo.alpha@example.com', 'Matelas, à partir de', 100.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-018', 'demo.beta@example.com', 'Micro-ondes standard', 40.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-019', 'demo.alpha@example.com', 'Moteur véhicule, à partir de', 400.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-020', 'demo.beta@example.com', 'Réfrigérateur 140 cm, à partir de', 220.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-021', 'demo.alpha@example.com', 'Réfrigérateur 170 cm, à partir de', 280.00, 'Douala, Cameroun', 'in_progress'),
    ('DEMO-ORD-TARIF-022', 'demo.beta@example.com', 'Réfrigérateur 190 cm, à partir de', 310.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-023', 'demo.alpha@example.com', 'Réfrigérateur Américain, à partir de', 400.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-024', 'demo.beta@example.com', 'Réfrigérateur de chambre, à partir de', 120.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-025', 'demo.alpha@example.com', 'Salon complet (canapé 2/3 places et table basse)', 800.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-026', 'demo.beta@example.com', 'Téléviseur jusqu''à 30 pouces', 100.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-027', 'demo.alpha@example.com', 'Téléviseur jusqu''à 40 pouces', 150.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-028', 'demo.beta@example.com', 'Téléviseur 50 pouces et +, à partir de', 300.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-029', 'demo.alpha@example.com', 'Vélo adulte', 75.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-030', 'demo.beta@example.com', 'Vélo enfant', 35.00, 'Lagos, Nigeria', 'pending')
)
INSERT INTO public.orders (
  order_number,
  client_name,
  client_email,
  client_phone,
  client_address,
  client_city,
  client_postal_code,
  client_country,
  recipient_name,
  recipient_email,
  recipient_phone,
  service_type,
  description,
  origin,
  destination,
  weight,
  value,
  status,
  parcels_count,
  customer_id
)
SELECT
  t.order_number,
  c.name,
  c.email,
  c.phone,
  c.address,
  c.city,
  c.postal_code,
  c.country,
  c.name,
  c.email,
  c.phone,
  'fret_maritime',
  t.item_label,
  CASE WHEN t.customer_email = 'demo.alpha@example.com' THEN 'Bruxelles, Belgique' ELSE 'Anvers, Belgique' END,
  t.destination,
  NULL,
  t.price,
  t.order_status,
  1,
  c.id
FROM tariff_orders t
JOIN public.customers c ON c.email = t.customer_email
ON CONFLICT (order_number) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  client_email = EXCLUDED.client_email,
  client_phone = EXCLUDED.client_phone,
  client_address = EXCLUDED.client_address,
  client_city = EXCLUDED.client_city,
  client_postal_code = EXCLUDED.client_postal_code,
  client_country = EXCLUDED.client_country,
  recipient_name = EXCLUDED.recipient_name,
  recipient_email = EXCLUDED.recipient_email,
  recipient_phone = EXCLUDED.recipient_phone,
  service_type = EXCLUDED.service_type,
  description = EXCLUDED.description,
  origin = EXCLUDED.origin,
  destination = EXCLUDED.destination,
  weight = EXCLUDED.weight,
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  parcels_count = EXCLUDED.parcels_count,
  customer_id = EXCLUDED.customer_id;

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

INSERT INTO public.articles (
  title,
  slug,
  excerpt,
  status,
  cover_image_url,
  seo_title,
  seo_description,
  legacy_content,
  puck_content,
  published_at,
  created_by,
  updated_by
)
VALUES (
  'Préparer un envoi maritime avec Danemo',
  'preparer-un-envoi-maritime-avec-danemo',
  'Un guide court pour regrouper vos articles, estimer votre budget et suivre vos commandes entre la Belgique et l''Afrique.',
  'published',
  '/blogs/envoi-colis-afrique/hero.png',
  'Préparer un envoi maritime avec Danemo',
  'Conseils pratiques pour préparer un envoi maritime, organiser les articles et suivre les commandes avec Danemo.',
  jsonb_build_object(
    'date', '04/05/2026',
    'mediaUrl', '/blogs/envoi-colis-afrique/hero.png',
    'mediaType', 'image',
    'image', '/blogs/envoi-colis-afrique/hero.png',
    'backLinkLabel', 'Retour au blog',
    'backLinkHref', '/blog',
    'sections', jsonb_build_array(
      jsonb_build_object(
        'id', 'seed-blog-section-1',
        'type', 'paragraph',
        'title', 'Centraliser avant d''expédier',
        'text', 'La meilleure préparation consiste à regrouper les articles par famille, vérifier les dimensions utiles et associer chaque commande au bon client dès l''arrivée à l''entrepôt.'
      ),
      jsonb_build_object(
        'id', 'seed-blog-section-2',
        'type', 'bullet_list',
        'title', 'Points à contrôler',
        'items', jsonb_build_array(
          'Nom du client et destination finale',
          'Prix de transport aligné sur la grille tarifaire',
          'Statut de la commande et conteneur prévu',
          'Coordonnées de contact pour les notifications'
        )
      ),
      jsonb_build_object(
        'id', 'seed-blog-section-3',
        'type', 'highlight',
        'title', 'Astuce Danemo',
        'text', 'Pour les lots mixtes, créez une ligne par article important. Les équipes peuvent ainsi suivre les prix, les volumes et les priorités sans perdre le détail.'
      )
    )
  ),
  '{"root": {}, "content": []}'::jsonb,
  TIMESTAMPTZ '2026-05-04 09:00:00+02',
  'seed@danemo.be',
  'seed@danemo.be'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  status = EXCLUDED.status,
  cover_image_url = EXCLUDED.cover_image_url,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  legacy_content = EXCLUDED.legacy_content,
  puck_content = EXCLUDED.puck_content,
  published_at = EXCLUDED.published_at,
  updated_by = EXCLUDED.updated_by;
