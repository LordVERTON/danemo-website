-- Ajouter la colonne container_code à la table orders
-- Cette colonne sera remplie depuis la table containers via la clé étrangère container_id

-- Étape 1: Ajouter la colonne container_code si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'container_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN container_code VARCHAR(50);
    
    -- Ajouter un index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_orders_container_code ON orders(container_code);
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN orders.container_code IS 'Code du conteneur associé, récupéré depuis la table containers via container_id';
  END IF;
END $$;

-- Étape 2: Mettre à jour toutes les commandes existantes avec le code du conteneur
UPDATE orders o
SET container_code = c.code
FROM containers c
WHERE o.container_id = c.id
  AND o.container_id IS NOT NULL
  AND o.container_code IS NULL;

-- Étape 3: Créer une fonction pour mettre à jour automatiquement container_code
CREATE OR REPLACE FUNCTION update_order_container_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Si container_id est défini, récupérer le code depuis la table containers
  IF NEW.container_id IS NOT NULL THEN
    SELECT code INTO NEW.container_code
    FROM containers
    WHERE id = NEW.container_id;
  ELSE
    -- Si container_id est NULL, mettre container_code à NULL
    NEW.container_code := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 4: Créer un trigger pour maintenir container_code à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_order_container_code ON orders;

CREATE TRIGGER trigger_update_order_container_code
  BEFORE INSERT OR UPDATE OF container_id ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_container_code();

-- Étape 5: Afficher un résumé
DO $$
DECLARE
  total_orders INTEGER;
  orders_with_container INTEGER;
  orders_with_code INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM orders;
  SELECT COUNT(*) INTO orders_with_container FROM orders WHERE container_id IS NOT NULL;
  SELECT COUNT(*) INTO orders_with_code FROM orders WHERE container_code IS NOT NULL;
  
  RAISE NOTICE 'Migration terminée:';
  RAISE NOTICE '  - Total de commandes: %', total_orders;
  RAISE NOTICE '  - Commandes avec container_id: %', orders_with_container;
  RAISE NOTICE '  - Commandes avec container_code: %', orders_with_code;
END $$;

