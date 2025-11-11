-- Delete all data from orders, customers, and containers tables
-- This script removes all existing data to prepare for fresh seeds

-- Delete orders first (due to foreign key constraints)
DELETE FROM orders;

-- Delete customers
DELETE FROM customers;

-- Delete containers
DELETE FROM containers;

-- Display summary
DO $$
DECLARE
  customer_count INTEGER;
  container_count INTEGER;
  order_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO container_count FROM containers;
  SELECT COUNT(*) INTO order_count FROM orders;
  
  RAISE NOTICE 'Deletion completed:';
  RAISE NOTICE '  - % customers remaining', customer_count;
  RAISE NOTICE '  - % containers remaining', container_count;
  RAISE NOTICE '  - % orders remaining', order_count;
END $$;

