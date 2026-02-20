-- Add parcels count (nombre de colis) to orders table
-- Permet de suivre le nombre de colis par commande, utile pour regrouper les commandes vers la même ville

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parcels_count INTEGER DEFAULT 1;

COMMENT ON COLUMN public.orders.parcels_count IS 'Nombre de colis pour cette commande. Utilisé pour le récapitulatif des commandes vers la même ville.';
