-- Ajoute les colonnes liées au destinataire sur la table orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS recipient_phone text;

-- Copie les informations de l'expéditeur pour initialiser le destinataire lorsqu'il est vide
UPDATE public.orders
SET recipient_name = COALESCE(recipient_name, client_name),
    recipient_email = COALESCE(recipient_email, client_email),
    recipient_phone = COALESCE(recipient_phone, client_phone);

