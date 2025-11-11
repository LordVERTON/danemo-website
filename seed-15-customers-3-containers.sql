-- Seed with 15 customers, each with 1-5 orders, and 3 containers
-- This script creates a fresh dataset with the specified requirements

-- Step 1: Create 3 containers
INSERT INTO containers (code, vessel, departure_port, arrival_port, etd, eta, status)
VALUES
  ('MSKU1234567', 'MSC OSCAR', 'Port d''Anvers, Belgique', 'Port de Douala, Cameroun', 
   NOW() + INTERVAL '10 days', NOW() + INTERVAL '35 days', 'planned'),
  ('TCLU7654321', 'CMA CGM MARCO POLO', 'Port de Rotterdam, Pays-Bas', 'Port de Lagos, Nigeria', 
   NOW() + INTERVAL '8 days', NOW() + INTERVAL '28 days', 'departed'),
  ('GESU9876543', 'EVERGREEN EVER ACE', 'Port du Havre, France', 'Port d''Abidjan, Côte d''Ivoire', 
   NOW() + INTERVAL '12 days', NOW() + INTERVAL '32 days', 'in_transit')
ON CONFLICT (code) DO NOTHING;

-- Step 2: Create 15 customers
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
  ('Chinwe Okonkwo', 'chinwe.okonkwo@example.com', '+234 803 123 4567', '89 Victoria Island', 'Lagos', '101001', 'Nigeria', 'Okonkwo Logistics Ltd', 'active'),
  ('Amadou Traoré', 'amadou.traore@example.com', '+223 20 12 34 56', '34 Rue de Bamako', 'Bamako', 'BP 123', 'Mali', 'Traoré Transport', 'active'),
  ('Zainab Ibrahim', 'zainab.ibrahim@example.com', '+234 802 234 5678', '56 Wuse 2', 'Abuja', '900001', 'Nigeria', 'Ibrahim Freight', 'active'),
  ('Mohamed Diop', 'mohamed.diop@example.com', '+221 77 123 4567', '12 Avenue Léopold Sédar Senghor', 'Dakar', '10000', 'Sénégal', 'Diop Shipping', 'active'),
  ('Aissatou Ba', 'aissatou.ba@example.com', '+221 78 234 5678', '45 Corniche Ouest', 'Dakar', '10000', 'Sénégal', NULL, 'active'),
  ('Ibrahim Sall', 'ibrahim.sall@example.com', '+221 76 345 6789', '78 Route de l''Aéroport', 'Dakar', '10000', 'Sénégal', 'Sall Logistics', 'active')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Create orders for each customer (1-5 orders per customer)
DO $$
DECLARE
  customer_ids UUID[];
  container_ids UUID[];
  customer_record RECORD;
  container_record RECORD;
  order_num INTEGER := 1;
  num_orders INTEGER;
  i INTEGER;
  selected_container_id UUID;
  order_status TEXT;
  service_types TEXT[] := ARRAY['fret_maritime', 'fret_aerien', 'demenagement', 'colis'];
  statuses TEXT[] := ARRAY['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
BEGIN
  -- Get all customer IDs
  SELECT ARRAY_AGG(id) INTO customer_ids FROM customers;
  
  -- Get all container IDs
  SELECT ARRAY_AGG(id) INTO container_ids FROM containers;
  
  -- Create orders for each customer
  FOR customer_record IN SELECT * FROM customers ORDER BY created_at LOOP
    -- Random number of orders between 1 and 5
    num_orders := 1 + (RANDOM() * 4)::INTEGER;
    
    FOR i IN 1..num_orders LOOP
      -- Select a random container (or NULL for some orders)
      IF RANDOM() > 0.3 THEN  -- 70% chance of having a container
        selected_container_id := container_ids[1 + (RANDOM() * (ARRAY_LENGTH(container_ids, 1) - 1))::INTEGER];
      ELSE
        selected_container_id := NULL;
      END IF;
      
      -- Random status
      order_status := statuses[1 + (RANDOM() * (ARRAY_LENGTH(statuses, 1) - 1))::INTEGER];
      
      -- Insert order
      INSERT INTO orders (
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
        estimated_delivery,
        customer_id,
        container_id
      )
      VALUES (
        'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(order_num::TEXT, 6, '0'),
        customer_record.name,
        customer_record.email,
        customer_record.phone,
        service_types[1 + (RANDOM() * (ARRAY_LENGTH(service_types, 1) - 1))::INTEGER],
        customer_record.city || ', ' || customer_record.country,
        CASE 
          WHEN RANDOM() > 0.5 THEN 'Paris, France'
          WHEN RANDOM() > 0.5 THEN 'Lagos, Nigeria'
          WHEN RANDOM() > 0.5 THEN 'Dakar, Sénégal'
          WHEN RANDOM() > 0.5 THEN 'Abidjan, Côte d''Ivoire'
          ELSE 'Douala, Cameroun'
        END,
        (1000 + (RANDOM() * 4000))::DECIMAL(10,2),
        (5000 + (RANDOM() * 30000))::DECIMAL(10,2),
        order_status,
        NOW() + (RANDOM() * 60)::INTEGER * INTERVAL '1 day',
        customer_record.id,
        selected_container_id
      )
      ON CONFLICT (order_number) DO NOTHING;
      
      order_num := order_num + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Seed completed: 15 customers, 3 containers, and orders created';
END $$;

-- Display final summary
DO $$
DECLARE
  customer_count INTEGER;
  container_count INTEGER;
  order_count INTEGER;
  orders_per_customer NUMERIC;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO container_count FROM containers;
  SELECT COUNT(*) INTO order_count FROM orders;
  SELECT ROUND(AVG(order_count_per_customer), 2) INTO orders_per_customer
  FROM (
    SELECT customer_id, COUNT(*) as order_count_per_customer
    FROM orders
    WHERE customer_id IS NOT NULL
    GROUP BY customer_id
  ) subquery;
  
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - % customers created', customer_count;
  RAISE NOTICE '  - % containers created', container_count;
  RAISE NOTICE '  - % orders created', order_count;
  RAISE NOTICE '  - Average orders per customer: %', orders_per_customer;
END $$;

