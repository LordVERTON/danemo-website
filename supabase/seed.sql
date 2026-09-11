-- Minimal coherent test data for local development (no production or sensitive data).
-- Foreign keys: customers → containers → orders; optional packages / inventory / tracking.

-- ---------------------------------------------------------------------------
-- Auth + employees (admin / operators) — comptes synthétiques réservés au développement local.
-- Les mots de passe ci-dessous sont volontairement connus pour faciliter les tests locaux :
-- admin@danemo.be / admin123
-- operator@danemo.be et operator2@danemo.be / operator123
-- Ne jamais réutiliser ces comptes ni ces mots de passe en production.
-- ---------------------------------------------------------------------------
-- pgcrypto est déjà créé dans les migrations ; fonctions typiquement dans le schéma extensions.
-- Accès local en lecture seule nécessaire à la homepage de développement.
-- Cette policy reste dans le seed et n'est donc pas déployée en production.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT (id, code, vessel, departure_port, arrival_port, etd, eta, status)
  ON public.containers TO anon;
DROP POLICY IF EXISTS "Local public upcoming departures" ON public.containers;
CREATE POLICY "Local public upcoming departures"
  ON public.containers
  FOR SELECT
  TO anon
  USING (status = 'planned' AND etd IS NOT NULL);

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
    email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@danemo.be',
    v_pw_admin,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
    '{"name":"Administrateur démo","role":"admin"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    aud = EXCLUDED.aud,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    confirmation_token = EXCLUDED.confirmation_token,
    recovery_token = EXCLUDED.recovery_token,
    email_change_token_new = EXCLUDED.email_change_token_new,
    email_change = EXCLUDED.email_change,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

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
    email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_op1_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operator@danemo.be',
    v_pw_oper,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"role":"operator"}'::jsonb,
    '{"name":"Opérateur démo","role":"operator"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    aud = EXCLUDED.aud,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    confirmation_token = EXCLUDED.confirmation_token,
    recovery_token = EXCLUDED.recovery_token,
    email_change_token_new = EXCLUDED.email_change_token_new,
    email_change = EXCLUDED.email_change,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

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
    email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_op2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operator2@danemo.be',
    v_pw_oper,
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"],"role":"operator"}'::jsonb,
    '{"name":"Opérateur démo 2","role":"operator"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    aud = EXCLUDED.aud,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    confirmation_token = EXCLUDED.confirmation_token,
    recovery_token = EXCLUDED.recovery_token,
    email_change_token_new = EXCLUDED.email_change_token_new,
    email_change = EXCLUDED.email_change,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

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

/* Legacy logistics demo retired in favour of the deterministic five-customer scenario below.
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

INSERT INTO public.containers (code, vessel, departure_port, arrival_port, etd, eta, status, client_id)
SELECT
  'DEMOMSKU01',
  'MV Demo Ship',
  'Port d''Anvers, Belgique',
  'Port de Douala, Cameroun',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '44 days',
  'planned',
  c.id
FROM public.customers c
WHERE c.email = 'demo.alpha@example.com'
LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.containers (code, vessel, departure_port, arrival_port, etd, eta, status)
VALUES
  ('DEMOTCLU02', 'MV Demo Express', 'Rotterdam', 'Lagos', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '23 days', 'departed')
ON CONFLICT (code) DO NOTHING;

-- Conteneur local planifié pour tester le bloc « Prochain départ » de la homepage.
INSERT INTO public.containers (code, vessel, departure_port, arrival_port, etd, eta, status)
VALUES
  (
    'DEMOFUTURE03',
    'MV Future Test',
    'Port d''Anvers, Belgique',
    'Port de Douala, Cameroun',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '37 days',
    'planned'
  )
ON CONFLICT (code) DO UPDATE SET
  vessel = EXCLUDED.vessel,
  departure_port = EXCLUDED.departure_port,
  arrival_port = EXCLUDED.arrival_port,
  etd = EXCLUDED.etd,
  eta = EXCLUDED.eta,
  status = EXCLUDED.status;

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
    ('DEMO-ORD-TARIF-001', 'demo.alpha@example.com', 'Canapé 2 places', 250.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-002', 'demo.beta@example.com', 'Canapé 3 places', 350.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-003', 'demo.alpha@example.com', 'Canapé d''angle', 350.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-004', 'demo.beta@example.com', 'Cantine 100 cm', 140.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-005', 'demo.alpha@example.com', 'Cantine 80/90 cm', 125.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-006', 'demo.beta@example.com', 'Carreaux (prix par palette)', 700.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-007', 'demo.alpha@example.com', 'Congélateur + de 500 litres', 550.00, 'Douala, Cameroun', 'in_progress'),
    ('DEMO-ORD-TARIF-008', 'demo.beta@example.com', 'Congélateur 150 - 250 litres', 275.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-009', 'demo.alpha@example.com', 'Congélateur 251 - 490 litres', 350.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-010', 'demo.beta@example.com', 'Cuisinière + de 4 foyers', 175.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-011', 'demo.alpha@example.com', 'Cuisinière - de 4 foyers', 160.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-012', 'demo.beta@example.com', 'Fût Orange: prix de vente vide', 30.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-013', 'demo.alpha@example.com', 'Fût Orange 220 L', 170.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-014', 'demo.beta@example.com', 'Groupe électrogène', 220.00, 'Lagos, Nigeria', 'in_progress'),
    ('DEMO-ORD-TARIF-015', 'demo.alpha@example.com', 'Lave - linge - de 10 kg', 180.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-016', 'demo.beta@example.com', 'Lave - linge 6 - 10 kg', 165.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-017', 'demo.alpha@example.com', 'Matelas', 100.00, 'Douala, Cameroun', 'pending'),
    ('DEMO-ORD-TARIF-018', 'demo.beta@example.com', 'Micro-ondes standard', 40.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-019', 'demo.alpha@example.com', 'Moteur véhicule', 400.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-020', 'demo.beta@example.com', 'Réfrigérateur 140 cm', 220.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-021', 'demo.alpha@example.com', 'Réfrigérateur 170 cm', 280.00, 'Douala, Cameroun', 'in_progress'),
    ('DEMO-ORD-TARIF-022', 'demo.beta@example.com', 'Réfrigérateur 190 cm', 310.00, 'Lagos, Nigeria', 'confirmed'),
    ('DEMO-ORD-TARIF-023', 'demo.alpha@example.com', 'Réfrigérateur Américain', 400.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-024', 'demo.beta@example.com', 'Réfrigérateur de chambre', 120.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-025', 'demo.alpha@example.com', 'Salon complet (canapé 2/3 places et table basse)', 800.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-026', 'demo.beta@example.com', 'Téléviseur jusqu''à 30 pouces', 100.00, 'Lagos, Nigeria', 'pending'),
    ('DEMO-ORD-TARIF-027', 'demo.alpha@example.com', 'Téléviseur jusqu''à 40 pouces', 150.00, 'Douala, Cameroun', 'confirmed'),
    ('DEMO-ORD-TARIF-028', 'demo.beta@example.com', 'Téléviseur 50 pouces et +', 300.00, 'Lagos, Nigeria', 'confirmed'),
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

*/

-- ---------------------------------------------------------------------------
-- Deterministic logistics scenario: exactly five customers, 15 orders and
-- three containers. Addresses are static fixtures prepared with
-- AddressGenerator; no business fixture is generated at reset time.
-- ---------------------------------------------------------------------------

-- Remove only the obsolete logistics demo rows before seeding this scenario.
-- The deletions also make re-running seed.sql idempotent.
DELETE FROM public.tracking_events
WHERE order_id IN (
  SELECT id FROM public.orders
  WHERE order_number LIKE 'DEMO-ORD-%'
     OR order_number LIKE 'DEMO-%-DLA-%'
     OR order_number LIKE 'DEMO-%-YDE-%'
     OR order_number LIKE 'DEMO-%-BDA-%'
);

DELETE FROM public.invoices WHERE invoice_number LIKE 'INV-DEMO-%';
DELETE FROM public.orders
WHERE order_number LIKE 'DEMO-ORD-%'
   OR order_number LIKE 'DEMO-%-DLA-%'
   OR order_number LIKE 'DEMO-%-YDE-%'
   OR order_number LIKE 'DEMO-%-BDA-%';
DELETE FROM public.containers
WHERE code IN ('DEMOMSKU01', 'DEMOTCLU02', 'DEMOFUTURE03', 'DEMO-DLA-01', 'DEMO-YDE-02', 'DEMO-BDA-03');
DELETE FROM public.inventory
WHERE reference = 'INV-DEMO-0001' OR reference LIKE 'INV-DEMO-%';
DELETE FROM public.customers
WHERE email IN ('demo.alpha@example.com', 'demo.beta@example.com')
   OR email LIKE '%@danemo.invalid';

-- Telephone fixtures are explicit, static values supplied for this DEV dataset.
INSERT INTO public.customers (
  name, email, phone, phone_e164, address, city, postal_code, country,
  company, status, opted_in_sms, opted_in_whatsapp
)
VALUES
  ('Camille Delaunay', 'camille.delaunay@danemo.invalid', '+33199000001', '+33199000001', '14 Avenue des Flandres', 'Bordeaux', '33000', 'France', 'Atelier Delaunay SARL', 'active', FALSE, FALSE),
  ('Léa Schmit', 'lea.schmit@danemo.invalid', '+352628000001', '+352628000001', '18 Rue des Cerisiers', 'Luxembourg', 'L-2449', 'Luxembourg', 'Schmit Conseil Sàrl', 'active', FALSE, FALSE),
  ('Noémie Van Acker', 'noemie.vanacker@danemo.invalid', '+3276000001', '+3276000001', '27 Lindenlaan', 'Gent', '9000', 'Belgique', 'Van Acker Atelier BV', 'active', FALSE, FALSE),
  ('Jeroen de Vries', 'jeroen.devries@danemo.invalid', '+31200000001', '+31200000001', '42 Waterkersstraat', 'Utrecht', '3511 AB', 'Pays-Bas', 'De Vries Interieur BV', 'active', FALSE, FALSE),
  ('Klara Neumann', 'klara.neumann@danemo.invalid', '+493023125123', '+493023125123', '8 Am Birkenweg', 'Köln', '50667', 'Allemagne', 'Neumann Handel GmbH', 'active', FALSE, FALSE)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  phone_e164 = EXCLUDED.phone_e164,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  country = EXCLUDED.country,
  company = EXCLUDED.company,
  status = EXCLUDED.status,
  opted_in_sms = EXCLUDED.opted_in_sms,
  opted_in_whatsapp = EXCLUDED.opted_in_whatsapp;

-- Douala is the maritime arrival port for all three routes. Yaoundé and
-- Bamenda remain final inland destinations on their associated orders.
INSERT INTO public.containers (code, vessel, departure_port, arrival_port, etd, eta, status)
VALUES
  ('DEMO-DLA-01', 'MV Danemo Horizon', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '5 days', 'arrived'),
  ('DEMO-YDE-02', 'MV Danemo Atlas', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 'in_transit'),
  ('DEMO-BDA-03', 'MV Danemo Pioneer', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '45 days', 'planned')
ON CONFLICT (code) DO UPDATE SET
  vessel = EXCLUDED.vessel,
  departure_port = EXCLUDED.departure_port,
  arrival_port = EXCLUDED.arrival_port,
  etd = EXCLUDED.etd,
  eta = EXCLUDED.eta,
  status = EXCLUDED.status;

WITH fixtures (
  order_number, customer_email, destination_code, recipient_name, recipient_email,
  recipient_address, recipient_city, recipient_postal_code, description, weight,
  value, parcels_count, status, created_offset, delivery_offset
) AS (
  VALUES
    ('DEMO-FR-DLA-001', 'camille.delaunay@danemo.invalid', 'DLA', 'Martine Ndzié', 'martine.ndzie@danemo.invalid', '6123 Summer Close', 'Douala', '00231', 'Salon modulable et table basse', 318.50, 980.00, 3, 'completed', -52, -2),
    ('DEMO-FR-YDE-001', 'camille.delaunay@danemo.invalid', 'YDE', 'Éric Ndzié', 'eric.ndzie@danemo.invalid', '949 Castle Drive', 'Yaounde', '00237', 'Réfrigérateur familial', 96.00, 640.00, 1, 'in_progress', -18, 22),
    ('DEMO-FR-BDA-001', 'camille.delaunay@danemo.invalid', 'BDA', 'Sophie Nfor', 'sophie.nfor@danemo.invalid', '7069 Spring Drive', 'Bamenda', '00101', 'Machine à coudre et accessoires', 44.75, 310.00, 2, 'confirmed', -4, 49),
    ('DEMO-LU-DLA-001', 'lea.schmit@danemo.invalid', 'DLA', 'Luc Mbarga', 'luc.mbarga@danemo.invalid', '4855 King Drive', 'Douala', '00232', 'Lot de vaisselle et ustensiles', 68.20, 420.00, 4, 'completed', -51, -2),
    ('DEMO-LU-YDE-001', 'lea.schmit@danemo.invalid', 'YDE', 'Nadine Fokou', 'nadine.fokou@danemo.invalid', '6187 Central Way', 'Yaounde', '00239', 'Bureau démontable et chaise', 82.40, 515.00, 2, 'in_progress', -17, 22),
    ('DEMO-LU-BDA-001', 'lea.schmit@danemo.invalid', 'BDA', 'Franck Tabe', 'franck.tabe@danemo.invalid', '957 Queen Boulevard', 'Bamenda', '00100', 'Groupe électrogène compact', 117.00, 890.00, 1, 'confirmed', -3, 49),
    ('DEMO-BE-DLA-001', 'noemie.vanacker@danemo.invalid', 'DLA', 'Aline Ndzié', 'aline.ndzie@danemo.invalid', '9352 Cambridge Crescent', 'Douala', '00230', 'Lave-linge 8 kg', 74.00, 570.00, 1, 'completed', -50, -2),
    ('DEMO-BE-YDE-001', 'noemie.vanacker@danemo.invalid', 'YDE', 'Paul Ndzié', 'paul.ndzie@danemo.invalid', '1231 Rose Drive', 'Yaounde', '00237', 'Vélo adulte et casque', 21.60, 230.00, 2, 'in_progress', -16, 22),
    ('DEMO-BE-BDA-001', 'noemie.vanacker@danemo.invalid', 'BDA', 'Mireille Fon', 'mireille.fon@danemo.invalid', '4772 York Lane', 'Bamenda', '00101', 'Matelas mousse haute densité', 36.80, 265.00, 1, 'confirmed', -3, 49),
    ('DEMO-NL-DLA-001', 'jeroen.devries@danemo.invalid', 'DLA', 'Hervé Ekotto', 'herve.ekotto@danemo.invalid', '2522 William Avenue', 'Douala', '00232', 'Carreaux de sol, une palette', 462.00, 760.00, 5, 'completed', -49, -2),
    ('DEMO-NL-YDE-001', 'jeroen.devries@danemo.invalid', 'YDE', 'Clarisse Mvondo', 'clarisse.mvondo@danemo.invalid', '6653 Garden Drive', 'Yaounde', '00239', 'Téléviseur 55 pouces', 28.30, 540.00, 1, 'in_progress', -15, 22),
    ('DEMO-NL-BDA-001', 'jeroen.devries@danemo.invalid', 'BDA', 'Samuel Ngu', 'samuel.ngu@danemo.invalid', '1217 River Road', 'Bamenda', '00101', 'Cantine métallique 100 cm', 39.50, 185.00, 1, 'confirmed', -2, 49),
    ('DEMO-DE-DLA-001', 'klara.neumann@danemo.invalid', 'DLA', 'Chantal Etoa', 'chantal.etoa@danemo.invalid', '5116 William Street', 'Douala', '00232', 'Congélateur coffre 300 L', 79.00, 690.00, 1, 'completed', -48, -2),
    ('DEMO-DE-YDE-001', 'klara.neumann@danemo.invalid', 'YDE', 'Thomas Meyo', 'thomas.meyo@danemo.invalid', '1228 Church Street', 'Yaounde', '00237', 'Étagère de rangement en bois', 55.25, 370.00, 3, 'in_progress', -14, 22),
    ('DEMO-DE-BDA-001', 'klara.neumann@danemo.invalid', 'BDA', 'Roseline Njam', 'roseline.njam@danemo.invalid', '2755 George Road', 'Bamenda', '00101', 'Kit de panneaux solaires', 63.40, 1120.00, 2, 'confirmed', -1, 49)
)
INSERT INTO public.orders (
  order_number, qr_code, client_name, client_email, client_phone, client_address,
  client_city, client_postal_code, client_country, recipient_name, recipient_email,
  recipient_phone, recipient_address, recipient_city, recipient_postal_code,
  recipient_country, service_type, description, origin, destination, weight,
  value, status, estimated_delivery, parcels_count, customer_id, container_id, created_at
)
SELECT
  f.order_number,
  'QR-' || f.order_number,
  c.name, c.email, c.phone, c.address, c.city, c.postal_code, c.country,
  f.recipient_name, f.recipient_email, '+23700000000', f.recipient_address, f.recipient_city,
  f.recipient_postal_code, 'Cameroon', 'fret_maritime', f.description,
  c.city || ', ' || c.country,
  f.recipient_address || ', ' || f.recipient_city || ', ' ||
    CASE f.destination_code WHEN 'YDE' THEN 'CE' WHEN 'DLA' THEN 'LT' ELSE 'NW' END ||
    ' ' || f.recipient_postal_code || ', Cameroon',
  f.weight, f.value, f.status, CURRENT_DATE + f.delivery_offset, f.parcels_count,
  c.id, ct.id, CURRENT_DATE + f.created_offset
FROM fixtures f
JOIN public.customers c ON c.email = f.customer_email
JOIN public.containers ct ON ct.code = 'DEMO-' || f.destination_code || '-' ||
  CASE f.destination_code WHEN 'DLA' THEN '01' WHEN 'YDE' THEN '02' ELSE '03' END
ON CONFLICT (order_number) DO UPDATE SET
  qr_code = EXCLUDED.qr_code,
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
  recipient_address = EXCLUDED.recipient_address,
  recipient_city = EXCLUDED.recipient_city,
  recipient_postal_code = EXCLUDED.recipient_postal_code,
  recipient_country = EXCLUDED.recipient_country,
  service_type = EXCLUDED.service_type,
  description = EXCLUDED.description,
  origin = EXCLUDED.origin,
  destination = EXCLUDED.destination,
  weight = EXCLUDED.weight,
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  estimated_delivery = EXCLUDED.estimated_delivery,
  parcels_count = EXCLUDED.parcels_count,
  customer_id = EXCLUDED.customer_id,
  container_id = EXCLUDED.container_id,
  created_at = EXCLUDED.created_at;

INSERT INTO public.inventory (type, reference, description, client, status, location, poids, dimensions, valeur)
SELECT
  CASE WHEN o.weight > 100 THEN 'marchandise' ELSE 'colis' END,
  'INV-' || o.order_number,
  o.description,
  o.client_name,
  CASE o.status WHEN 'completed' THEN 'livre' WHEN 'in_progress' THEN 'en_transit' ELSE 'en_attente' END,
  CASE o.status WHEN 'completed' THEN 'Douala - livré' WHEN 'in_progress' THEN 'En mer vers Douala' ELSE 'Entrepôt Anvers' END,
  o.weight::text || ' kg',
  o.parcels_count::text || ' colis',
  o.value::text || ' EUR'
FROM public.orders o
WHERE o.order_number LIKE 'DEMO-%-DLA-%'
   OR o.order_number LIKE 'DEMO-%-YDE-%'
   OR o.order_number LIKE 'DEMO-%-BDA-%'
;

INSERT INTO public.invoices (
  invoice_number, customer_id, order_id, issue_date, due_date, status,
  subtotal, tax_rate, currency, payment_method, payment_date, notes
)
SELECT
  'INV-' || o.order_number,
  o.customer_id,
  o.id,
  CURRENT_DATE - CASE o.status WHEN 'completed' THEN 45 WHEN 'in_progress' THEN 14 ELSE 2 END,
  CURRENT_DATE + CASE o.status WHEN 'completed' THEN -15 WHEN 'in_progress' THEN 16 ELSE 28 END,
  CASE o.status WHEN 'completed' THEN 'paid' WHEN 'in_progress' THEN 'sent' ELSE 'draft' END,
  o.value,
  21.00,
  'EUR',
  CASE WHEN o.status = 'completed' THEN 'bank_transfer' ELSE NULL END,
  CASE WHEN o.status = 'completed' THEN CURRENT_DATE - INTERVAL '12 days' ELSE NULL END,
  'Facture de démonstration liée à ' || o.order_number
FROM public.orders o
WHERE o.order_number LIKE 'DEMO-%-DLA-%'
   OR o.order_number LIKE 'DEMO-%-YDE-%'
   OR o.order_number LIKE 'DEMO-%-BDA-%'
ON CONFLICT (invoice_number) DO UPDATE SET
  customer_id = EXCLUDED.customer_id,
  order_id = EXCLUDED.order_id,
  issue_date = EXCLUDED.issue_date,
  due_date = EXCLUDED.due_date,
  status = EXCLUDED.status,
  subtotal = EXCLUDED.subtotal,
  tax_rate = EXCLUDED.tax_rate,
  currency = EXCLUDED.currency,
  payment_method = EXCLUDED.payment_method,
  payment_date = EXCLUDED.payment_date,
  notes = EXCLUDED.notes;

WITH origin_steps (origin_city, event_offset, status, location, description) AS (
  VALUES
    -- Bordeaux → Paris (environ 6 h) → Lille (environ 2 h 30) → Bruxelles → Anvers.
    ('Bordeaux', INTERVAL '9 hours', 'confirmed', 'Bordeaux, France', 'Commande confirmée et enlèvement planifié à Bordeaux.'),
    ('Bordeaux', INTERVAL '1 day 8 hours', 'preparation', 'Bordeaux, France', 'Colis pris en charge et préparé pour le transport routier.'),
    ('Bordeaux', INTERVAL '1 day 17 hours', 'in_progress', 'Paris, France', 'Arrivée à l''agence de transit de Paris après le trajet routier depuis Bordeaux.'),
    ('Bordeaux', INTERVAL '2 days 9 hours', 'in_progress', 'Lille, France', 'Passage par le hub de Lille avant le départ vers la Belgique.'),
    ('Bordeaux', INTERVAL '3 days 9 hours', 'preparation', 'Entrepôt Bruxelles, Belgique', 'Colis réceptionné, contrôlé et regroupé à l''entrepôt de Bruxelles.'),
    ('Bordeaux', INTERVAL '3 days 17 hours', 'arrive_port', 'Port d''Anvers, Belgique', 'Colis transféré de Bruxelles au port d''Anvers pour le chargement maritime.'),

    -- Luxembourg → entrepôt Bruxelles (environ 3 h) → port d'Anvers (environ 1 h).
    ('Luxembourg', INTERVAL '9 hours', 'confirmed', 'Luxembourg, Luxembourg', 'Commande confirmée et enlèvement planifié au Luxembourg.'),
    ('Luxembourg', INTERVAL '1 day 8 hours', 'preparation', 'Luxembourg, Luxembourg', 'Colis pris en charge et préparé pour le départ routier.'),
    ('Luxembourg', INTERVAL '1 day 11 hours', 'in_progress', 'Luxembourg, Luxembourg', 'Transport routier démarré vers l''entrepôt de Bruxelles.'),
    ('Luxembourg', INTERVAL '1 day 16 hours', 'preparation', 'Entrepôt Bruxelles, Belgique', 'Colis réceptionné et regroupé à l''entrepôt de Bruxelles.'),
    ('Luxembourg', INTERVAL '2 days 9 hours', 'arrive_port', 'Port d''Anvers, Belgique', 'Colis transféré de Bruxelles au port d''Anvers pour embarquement.'),

    -- Gent et Köln rejoignent Bruxelles ; Utrecht suit l'axe Breda → Anvers, sans détour par Bruxelles.
    ('Gent', INTERVAL '9 hours', 'confirmed', 'Gent, Belgique', 'Commande confirmée et enlèvement planifié à Gent.'),
    ('Gent', INTERVAL '1 day 8 hours', 'preparation', 'Gent, Belgique', 'Colis pris en charge et préparé pour le transport.'),
    ('Gent', INTERVAL '1 day 10 hours', 'in_progress', 'En route vers Bruxelles, Belgique', 'Transport routier en cours vers l''entrepôt de Bruxelles.'),
    ('Gent', INTERVAL '1 day 13 hours', 'preparation', 'Entrepôt Bruxelles, Belgique', 'Colis réceptionné et regroupé à l''entrepôt de Bruxelles.'),
    ('Gent', INTERVAL '1 day 17 hours', 'arrive_port', 'Port d''Anvers, Belgique', 'Colis transféré de Bruxelles au port d''Anvers.'),
    ('Utrecht', INTERVAL '9 hours', 'confirmed', 'Utrecht, Pays-Bas', 'Commande confirmée et enlèvement planifié à Utrecht.'),
    ('Utrecht', INTERVAL '1 day 8 hours', 'preparation', 'Utrecht, Pays-Bas', 'Colis pris en charge et préparé pour le transport.'),
    ('Utrecht', INTERVAL '1 day 10 hours', 'in_progress', 'Breda, Pays-Bas', 'Passage par Breda sur l''axe direct entre Utrecht et Anvers.'),
    ('Utrecht', INTERVAL '1 day 14 hours', 'arrive_port', 'Port d''Anvers, Belgique', 'Colis arrivé directement au port d''Anvers depuis Breda, sans détour par Bruxelles.'),
    ('Köln', INTERVAL '9 hours', 'confirmed', 'Köln, Allemagne', 'Commande confirmée et enlèvement planifié à Köln.'),
    ('Köln', INTERVAL '1 day 8 hours', 'preparation', 'Köln, Allemagne', 'Colis pris en charge et préparé pour le transport.'),
    ('Köln', INTERVAL '1 day 10 hours', 'in_progress', 'Maastricht, Pays-Bas', 'Passage par Maastricht avant l''entrée en Belgique.'),
    ('Köln', INTERVAL '1 day 15 hours', 'preparation', 'Entrepôt Bruxelles, Belgique', 'Colis réceptionné et regroupé à l''entrepôt de Bruxelles après le passage par Maastricht.'),
    ('Köln', INTERVAL '2 days 9 hours', 'arrive_port', 'Port d''Anvers, Belgique', 'Colis transféré de Bruxelles au port d''Anvers.')
  ),
  container_steps (destination_code, event_offset, status, location, description) AS (
    VALUES
      ('DLA', INTERVAL '-41 days 16 hours', 'preparation', 'Port d''Anvers, Belgique', 'Colis chargé dans le conteneur DEMO-DLA-01 après regroupement à Bruxelles.'),
      ('DLA', INTERVAL '-40 days 8 hours', 'in_progress', 'Port d''Anvers, Belgique', 'Conteneur DEMO-DLA-01 parti d''Anvers à destination de Douala.'),
      ('DLA', INTERVAL '-22 days', 'in_progress', 'En mer vers Douala', 'Transport maritime en cours vers le Cameroun.'),
      ('DLA', INTERVAL '-5 days 9 hours', 'arrive_port', 'Port de Douala, Cameroun', 'Conteneur arrivé au port de Douala.'),
      ('DLA', INTERVAL '-4 days 10 hours', 'dedouane', 'Port de Douala, Cameroun', 'Colis dégroupé et formalités douanières terminées à Douala.'),
      ('DLA', INTERVAL '-2 days 14 hours', 'completed', 'Douala, Cameroun', 'Livraison finale effectuée à destination.'),

      ('YDE', INTERVAL '-11 days 16 hours', 'preparation', 'Port d''Anvers, Belgique', 'Colis chargé dans le conteneur DEMO-YDE-02 après regroupement à Bruxelles.'),
      ('YDE', INTERVAL '-10 days 8 hours', 'in_progress', 'Port d''Anvers, Belgique', 'Conteneur DEMO-YDE-02 parti d''Anvers à destination de Douala.'),
      ('YDE', INTERVAL '-3 days', 'in_progress', 'En mer vers Douala', 'Transport maritime en cours ; arrivée au port de Douala prévue dans 20 jours.'),
      ('YDE', INTERVAL '20 days 9 hours', 'arrive_port', 'Port de Douala, Cameroun', 'Étape prévue : arrivée du conteneur au port de Douala.'),
      ('YDE', INTERVAL '21 days 10 hours', 'dedouane', 'Port de Douala, Cameroun', 'Étape prévue : dégroupage et formalités douanières à Douala.'),
      ('YDE', INTERVAL '22 days 15 hours', 'completed', 'Yaoundé, Cameroun', 'Étape prévue : livraison finale à Yaoundé après transport routier depuis Douala.'),

      ('BDA', INTERVAL '10 days 8 hours', 'in_progress', 'Port d''Anvers, Belgique', 'Étape prévue : départ du conteneur DEMO-BDA-03 depuis Anvers.'),
      ('BDA', INTERVAL '45 days 9 hours', 'arrive_port', 'Port de Douala, Cameroun', 'Étape prévue : arrivée du conteneur au port de Douala.'),
      ('BDA', INTERVAL '46 days 10 hours', 'dedouane', 'Port de Douala, Cameroun', 'Étape prévue : dégroupage et formalités douanières à Douala.'),
      ('BDA', INTERVAL '48 days 10 hours', 'in_progress', 'Bafoussam, Cameroun', 'Étape prévue : transit routier par Bafoussam avant la dernière étape vers Bamenda.'),
      ('BDA', INTERVAL '49 days 15 hours', 'completed', 'Bamenda, Cameroun', 'Étape prévue : livraison finale à Bamenda.')
  ),
  event_steps (order_id, status, location, description, event_date) AS (
    SELECT
      o.id,
      s.status,
      s.location,
      s.description,
      o.created_at + s.event_offset
    FROM public.orders o
    JOIN origin_steps s ON s.origin_city = o.client_city
    WHERE (o.order_number LIKE 'DEMO-%-DLA-%'
       OR o.order_number LIKE 'DEMO-%-YDE-%'
       OR o.order_number LIKE 'DEMO-%-BDA-%')
      -- L'historique local ne contient pas des collectes routières qui ne se sont pas encore produites.
      AND o.created_at + s.event_offset <= CURRENT_TIMESTAMP

    UNION ALL

    SELECT
      o.id,
      s.status,
      s.location,
      s.description,
      CURRENT_DATE + s.event_offset
    FROM public.orders o
    JOIN container_steps s ON o.order_number LIKE 'DEMO-%-' || s.destination_code || '-%'
  )
INSERT INTO public.tracking_events (order_id, status, location, description, operator, event_date)
SELECT
  e.order_id,
  e.status,
  e.location,
  e.description,
  'Seed Danemo',
  e.event_date
FROM event_steps e;

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
