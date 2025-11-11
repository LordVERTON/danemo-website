-- Fix the generate_invoice_number() function to handle different invoice number formats
-- This script replaces the existing function with a more robust version

-- Drop the existing functions if they exist
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS safe_extract_number(TEXT) CASCADE;

-- Fonction helper pour extraire un nombre d'une chaîne de manière sûre
CREATE OR REPLACE FUNCTION safe_extract_number(input_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN 0;
  END IF;
  
  -- Extraire seulement les chiffres
  cleaned := REGEXP_REPLACE(input_text, '[^0-9]', '', 'g');
  
  IF cleaned ~ '^[0-9]+$' AND LENGTH(cleaned) > 0 THEN
    BEGIN
      RETURN CAST(cleaned AS INTEGER);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 0;
    END;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the function with improved logic
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix VARCHAR(4);
  last_number INTEGER;
  new_number VARCHAR(50);
  pattern VARCHAR(20);
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YYYY');
  pattern := 'INV-' || year_prefix || '-%';
  last_number := 0;
  
  -- Récupérer le dernier numéro de facture pour cette année
  -- Extraire seulement les chiffres après le préfixe INV-YYYY-
  SELECT COALESCE(
    MAX(
      safe_extract_number(
        REGEXP_REPLACE(invoice_number, '^INV-' || year_prefix || '-', '', 'g')
      )
    ),
    0
  ) INTO last_number
  FROM invoices
  WHERE invoice_number LIKE pattern;
  
  -- Générer le nouveau numéro (format: INV-YYYY-000001)
  new_number := 'INV-' || year_prefix || '-' || LPAD((last_number + 1)::TEXT, 6, '0');
  
  -- Si le numéro n'a pas été fourni, le générer automatiquement
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Display confirmation
DO $$
BEGIN
  RAISE NOTICE 'Function generate_invoice_number() has been fixed and recreated';
END $$;

