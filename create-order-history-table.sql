-- Créer la table order_history pour tracker les modifications des commandes
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL DEFAULT 'update',
  description TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON public.order_history(created_at);

-- Activer RLS
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
DROP POLICY IF EXISTS "Order history readable by authenticated users" ON public.order_history;
CREATE POLICY "Order history readable by authenticated users" ON public.order_history
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Order history insertable by authenticated users" ON public.order_history;
CREATE POLICY "Order history insertable by authenticated users" ON public.order_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fonction pour créer automatiquement un historique lors de la modification d'une commande
CREATE OR REPLACE FUNCTION public.track_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}';
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Vérifier si c'est une mise à jour
  IF TG_OP = 'UPDATE' THEN
    -- Comparer chaque champ et enregistrer les changements
    IF OLD.client_name IS DISTINCT FROM NEW.client_name THEN
      changes := changes || jsonb_build_object('client_name', jsonb_build_object('old', OLD.client_name, 'new', NEW.client_name));
    END IF;
    
    IF OLD.client_email IS DISTINCT FROM NEW.client_email THEN
      changes := changes || jsonb_build_object('client_email', jsonb_build_object('old', OLD.client_email, 'new', NEW.client_email));
    END IF;
    
    IF OLD.client_phone IS DISTINCT FROM NEW.client_phone THEN
      changes := changes || jsonb_build_object('client_phone', jsonb_build_object('old', OLD.client_phone, 'new', NEW.client_phone));
    END IF;
    
    IF OLD.service_type IS DISTINCT FROM NEW.service_type THEN
      changes := changes || jsonb_build_object('service_type', jsonb_build_object('old', OLD.service_type, 'new', NEW.service_type));
    END IF;
    
    IF OLD.origin IS DISTINCT FROM NEW.origin THEN
      changes := changes || jsonb_build_object('origin', jsonb_build_object('old', OLD.origin, 'new', NEW.origin));
    END IF;
    
    IF OLD.destination IS DISTINCT FROM NEW.destination THEN
      changes := changes || jsonb_build_object('destination', jsonb_build_object('old', OLD.destination, 'new', NEW.destination));
    END IF;
    
    IF OLD.weight IS DISTINCT FROM NEW.weight THEN
      changes := changes || jsonb_build_object('weight', jsonb_build_object('old', OLD.weight, 'new', NEW.weight));
    END IF;
    
    IF OLD.value IS DISTINCT FROM NEW.value THEN
      changes := changes || jsonb_build_object('value', jsonb_build_object('old', OLD.value, 'new', NEW.value));
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changes := changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    
    IF OLD.estimated_delivery IS DISTINCT FROM NEW.estimated_delivery THEN
      changes := changes || jsonb_build_object('estimated_delivery', jsonb_build_object('old', OLD.estimated_delivery, 'new', NEW.estimated_delivery));
    END IF;
    
    -- Insérer l'historique seulement s'il y a des changements
    IF jsonb_object_keys(changes) IS NOT NULL THEN
      INSERT INTO public.order_history (order_id, action, description, changes)
      VALUES (
        NEW.id,
        'update',
        'Modification de la commande',
        changes
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS order_changes_trigger ON public.orders;
CREATE TRIGGER order_changes_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_order_changes();
