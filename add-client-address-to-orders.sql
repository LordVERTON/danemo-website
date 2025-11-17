-- Add sender address metadata to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_address TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_city TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_postal_code TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_country TEXT;

-- Backfill sender data from linked customers when possible
UPDATE public.orders AS o
SET
  client_address = COALESCE(o.client_address, c.address),
  client_city = COALESCE(o.client_city, c.city),
  client_postal_code = COALESCE(o.client_postal_code, c.postal_code),
  client_country = COALESCE(o.client_country, c.country)
FROM public.customers AS c
WHERE
  o.customer_id = c.id
  AND (
    o.client_address IS DISTINCT FROM c.address
    OR o.client_city IS DISTINCT FROM c.city
    OR o.client_postal_code IS DISTINCT FROM c.postal_code
    OR o.client_country IS DISTINCT FROM c.country
  );

COMMENT ON COLUMN public.orders.client_address IS 'Adresse complète déclarée par l''expéditeur';
COMMENT ON COLUMN public.orders.client_city IS 'Ville de l''expéditeur';
COMMENT ON COLUMN public.orders.client_postal_code IS 'Code postal de l''expéditeur';
COMMENT ON COLUMN public.orders.client_country IS 'Pays de l''expéditeur';

