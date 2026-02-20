-- Rendre l'email optionnel pour les clients
ALTER TABLE public.customers
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.customers.email IS 'Email du client (optionnel)';
