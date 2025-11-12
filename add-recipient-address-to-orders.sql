-- Ajoute des champs d'adresse pour le destinataire d'une commande
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recipient_address text,
  ADD COLUMN IF NOT EXISTS recipient_city text,
  ADD COLUMN IF NOT EXISTS recipient_postal_code text,
  ADD COLUMN IF NOT EXISTS recipient_country text;

-- Valeurs initiales par défaut (laissent NULL si aucune information n'existe)
UPDATE public.orders
SET recipient_address = COALESCE(recipient_address, destination),
    recipient_city = COALESCE(recipient_city, NULL),
    recipient_postal_code = COALESCE(recipient_postal_code, NULL),
    recipient_country = COALESCE(recipient_country, NULL)
WHERE recipient_name IS NOT NULL;

