-- Seed orders, customers, and containers with sample data
-- This script creates customers, containers, and orders with proper relationships

-- Step 1: Create sample customers if they don't exist
INSERT INTO customers (name, email, phone, address, city, postal_code, country, company, status)
VALUES
  ('Jean Dupont', 'jean.dupont@example.com', '+33 6 12 34 56 78', '123 Rue de la Paix', 'Paris', '75001', 'France', 'Dupont & Co', 'active'),
  ('Marie Martin', 'marie.martin@example.com', '+33 6 23 45 67 89', '456 Avenue des Champs', 'Lyon', '69001', 'France', 'Martin Transport', 'active'),
  ('Pierre Dubois', 'pierre.dubois@example.com', '+33 6 34 56 78 90', '789 Boulevard Saint-Michel', 'Marseille', '13001', 'France', NULL, 'active'),
  ('Sophie Bernard', 'sophie.bernard@example.com', '+33 6 45 67 89 01', '321 Rue de la République', 'Toulouse', '31000', 'France', 'Bernard Logistics', 'active'),
  ('Ahmed Hassan', 'ahmed.hassan@example.com', '+212 6 12 34 56 78', '15 Avenue Mohammed V', 'Casablanca', '20000', 'Maroc', 'Hassan Import Export', 'active'),
  ('Fatou Diallo', 'fatou.diallo@example.com', '+221 7 12 34 56 78', '22 Rue de la Corniche', 'Dakar', '10000', 'Sénégal', 'Diallo Trading', 'active'),
  ('Koffi Kouassi', 'koffi.kouassi@example.com', '+225 07 12 34 56 78', '45 Boulevard de la République', 'Abidjan', '01 BP 1234', 'Côte d''Ivoire', 'Kouassi Group', 'active'),
  ('Amina Ouedraogo', 'amina.ouedraogo@example.com', '+226 70 12 34 56', '78 Avenue Kwame Nkrumah', 'Ouagadougou', '01 BP 5432', 'Burkina Faso', NULL, 'active'),
  ('Youssef Benali', 'youssef.benali@example.com', '+213 5 12 34 56 78', '12 Rue Didouche Mourad', 'Alger', '16000', 'Algérie', 'Benali Shipping', 'active'),
  ('Chinwe Okonkwo', 'chinwe.okonkwo@example.com', '+234 803 123 4567', '89 Victoria Island', 'Lagos', '101001', 'Nigeria', 'Okonkwo Logistics Ltd', 'active')
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create additional containers if needed
INSERT INTO containers (code, vessel, departure_port, arrival_port, etd, eta, status)
VALUES
  ('MSKU9876543', 'MSC OSCAR', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', 
   NOW() + INTERVAL '10 days', NOW() + INTERVAL '35 days', 'planned'),
  ('TCLU1112223', 'CMA CGM MARCO POLO', 'Port de Rotterdam, Pays-Bas', 'Port de Lagos, Nigeria', 
   NOW() + INTERVAL '8 days', NOW() + INTERVAL '28 days', 'planned'),
  ('GESU4445556', 'EVERGREEN EVER ACE', 'Port du Havre, France', 'Port d''Abidjan, Côte d''Ivoire', 
   NOW() + INTERVAL '12 days', NOW() + INTERVAL '32 days', 'planned'),
  ('APLU7778889', 'COSCO SHIPPING UNIVERSE', 'Port d''Hambourg, Allemagne', 'Port de Tema, Ghana', 
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'departed'),
  ('OOCU2223334', 'OOCL HONG KONG', 'Port de Felixstowe, Royaume-Uni', 'Port de Dakar, Sénégal', 
   NOW() - INTERVAL '4 days', NOW() + INTERVAL '22 days', 'in_transit')
ON CONFLICT (code) DO NOTHING;

-- Step 3: Get customer and container IDs for linking
DO $$
DECLARE
  customer_jean UUID;
  customer_marie UUID;
  customer_pierre UUID;
  customer_sophie UUID;
  customer_ahmed UUID;
  customer_fatou UUID;
  customer_koffi UUID;
  customer_amina UUID;
  customer_youssef UUID;
  customer_chinwe UUID;
  
  container_msku UUID;
  container_tclu UUID;
  container_gesu UUID;
  container_aplu UUID;
  container_oocu UUID;
  
  order_num VARCHAR(50);
BEGIN
  -- Get customer IDs
  SELECT id INTO customer_jean FROM customers WHERE email = 'jean.dupont@example.com';
  SELECT id INTO customer_marie FROM customers WHERE email = 'marie.martin@example.com';
  SELECT id INTO customer_pierre FROM customers WHERE email = 'pierre.dubois@example.com';
  SELECT id INTO customer_sophie FROM customers WHERE email = 'sophie.bernard@example.com';
  SELECT id INTO customer_ahmed FROM customers WHERE email = 'ahmed.hassan@example.com';
  SELECT id INTO customer_fatou FROM customers WHERE email = 'fatou.diallo@example.com';
  SELECT id INTO customer_koffi FROM customers WHERE email = 'koffi.kouassi@example.com';
  SELECT id INTO customer_amina FROM customers WHERE email = 'amina.ouedraogo@example.com';
  SELECT id INTO customer_youssef FROM customers WHERE email = 'youssef.benali@example.com';
  SELECT id INTO customer_chinwe FROM customers WHERE email = 'chinwe.okonkwo@example.com';
  
  -- Get container IDs
  SELECT id INTO container_msku FROM containers WHERE code = 'MSKU9876543';
  SELECT id INTO container_tclu FROM containers WHERE code = 'TCLU1112223';
  SELECT id INTO container_gesu FROM containers WHERE code = 'GESU4445556';
  SELECT id INTO container_aplu FROM containers WHERE code = 'APLU7778889';
  SELECT id INTO container_oocu FROM containers WHERE code = 'OOCU2223334';
  
  -- Step 4: Create orders linked to customers and containers
  -- Generate unique order numbers and insert orders
  
  -- Orders for Jean Dupont
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('1'::TEXT, 6, '0'), 
     'Jean Dupont', 'jean.dupont@example.com', '+33 6 12 34 56 78', 
     'fret_maritime', 'Paris, France', 'Douala, Cameroun', 2500.00, 15000.00, 
     'in_progress', NOW() + INTERVAL '40 days', customer_jean, container_msku)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Marie Martin
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('2'::TEXT, 6, '0'), 
     'Marie Martin', 'marie.martin@example.com', '+33 6 23 45 67 89', 
     'fret_maritime', 'Lyon, France', 'Lagos, Nigeria', 3200.00, 22000.00, 
     'confirmed', NOW() + INTERVAL '35 days', customer_marie, container_tclu),
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('3'::TEXT, 6, '0'), 
     'Marie Martin', 'marie.martin@example.com', '+33 6 23 45 67 89', 
     'demenagement', 'Lyon, France', 'Dakar, Sénégal', 1800.00, 12000.00, 
     'pending', NOW() + INTERVAL '30 days', customer_marie, container_oocu)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Pierre Dubois
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('4'::TEXT, 6, '0'), 
     'Pierre Dubois', 'pierre.dubois@example.com', '+33 6 34 56 78 90', 
     'fret_maritime', 'Marseille, France', 'Abidjan, Côte d''Ivoire', 2800.00, 18000.00, 
     'in_progress', NOW() + INTERVAL '38 days', customer_pierre, container_gesu)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Sophie Bernard
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('5'::TEXT, 6, '0'), 
     'Sophie Bernard', 'sophie.bernard@example.com', '+33 6 45 67 89 01', 
     'fret_maritime', 'Toulouse, France', 'Tema, Ghana', 3500.00, 25000.00, 
     'confirmed', NOW() + INTERVAL '25 days', customer_sophie, container_aplu),
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('6'::TEXT, 6, '0'), 
     'Sophie Bernard', 'sophie.bernard@example.com', '+33 6 45 67 89 01', 
     'colis', 'Toulouse, France', 'Casablanca, Maroc', 150.00, 800.00, 
     'completed', NOW() - INTERVAL '5 days', customer_sophie, NULL)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Ahmed Hassan
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('7'::TEXT, 6, '0'), 
     'Ahmed Hassan', 'ahmed.hassan@example.com', '+212 6 12 34 56 78', 
     'fret_maritime', 'Casablanca, Maroc', 'Lagos, Nigeria', 4200.00, 30000.00, 
     'in_progress', NOW() + INTERVAL '32 days', customer_ahmed, container_tclu)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Fatou Diallo
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('8'::TEXT, 6, '0'), 
     'Fatou Diallo', 'fatou.diallo@example.com', '+221 7 12 34 56 78', 
     'demenagement', 'Dakar, Sénégal', 'Paris, France', 2000.00, 15000.00, 
     'pending', NOW() + INTERVAL '28 days', customer_fatou, container_oocu)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Koffi Kouassi
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('9'::TEXT, 6, '0'), 
     'Koffi Kouassi', 'koffi.kouassi@example.com', '+225 07 12 34 56 78', 
     'fret_maritime', 'Abidjan, Côte d''Ivoire', 'Marseille, France', 3800.00, 28000.00, 
     'confirmed', NOW() + INTERVAL '35 days', customer_koffi, container_gesu),
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('10'::TEXT, 6, '0'), 
     'Koffi Kouassi', 'koffi.kouassi@example.com', '+225 07 12 34 56 78', 
     'fret_aerien', 'Abidjan, Côte d''Ivoire', 'Paris, France', 500.00, 3500.00, 
     'completed', NOW() - INTERVAL '10 days', customer_koffi, NULL)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Amina Ouedraogo
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('11'::TEXT, 6, '0'), 
     'Amina Ouedraogo', 'amina.ouedraogo@example.com', '+226 70 12 34 56', 
     'fret_maritime', 'Ouagadougou, Burkina Faso', 'Rotterdam, Pays-Bas', 2900.00, 20000.00, 
     'in_progress', NOW() + INTERVAL '30 days', customer_amina, container_aplu)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Youssef Benali
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('12'::TEXT, 6, '0'), 
     'Youssef Benali', 'youssef.benali@example.com', '+213 5 12 34 56 78', 
     'fret_maritime', 'Alger, Algérie', 'Anvers, Belgique', 4100.00, 32000.00, 
     'confirmed', NOW() + INTERVAL '28 days', customer_youssef, container_msku)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Orders for Chinwe Okonkwo
  INSERT INTO orders (order_number, client_name, client_email, client_phone, service_type, origin, destination, weight, value, status, estimated_delivery, customer_id, container_id)
  VALUES
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('13'::TEXT, 6, '0'), 
     'Chinwe Okonkwo', 'chinwe.okonkwo@example.com', '+234 803 123 4567', 
     'fret_maritime', 'Lagos, Nigeria', 'Hambourg, Allemagne', 4500.00, 35000.00, 
     'in_progress', NOW() + INTERVAL '26 days', customer_chinwe, container_tclu),
    ('ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD('14'::TEXT, 6, '0'), 
     'Chinwe Okonkwo', 'chinwe.okonkwo@example.com', '+234 803 123 4567', 
     'demenagement', 'Lagos, Nigeria', 'Lyon, France', 2200.00, 18000.00, 
     'pending', NOW() + INTERVAL '30 days', customer_chinwe, NULL)
  ON CONFLICT (order_number) DO NOTHING;
  
  -- Display summary
  RAISE NOTICE 'Seed completed: Orders, customers, and containers have been created and linked';
END $$;

-- Display final counts
DO $$
DECLARE
  customer_count INTEGER;
  container_count INTEGER;
  order_count INTEGER;
  linked_orders_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO container_count FROM containers;
  SELECT COUNT(*) INTO order_count FROM orders;
  SELECT COUNT(*) INTO linked_orders_count FROM orders WHERE customer_id IS NOT NULL AND container_id IS NOT NULL;
  
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - % customers in database', customer_count;
  RAISE NOTICE '  - % containers in database', container_count;
  RAISE NOTICE '  - % orders in database', order_count;
  RAISE NOTICE '  - % orders linked to both customers and containers', linked_orders_count;
END $$;

