-- Create customers table and related tables (invoices)
-- This migration creates a comprehensive customer management system

-- Table des clients (customers)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  company VARCHAR(255),
  tax_id VARCHAR(100), -- Numéro de TVA / SIRET
  notes TEXT, -- Notes additionnelles sur le client
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures (invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Facture liée à une commande (optionnel)
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0, -- Taux de TVA en pourcentage
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(50), -- virement, chèque, espèces, etc.
  payment_date DATE,
  notes TEXT,
  pdf_path TEXT, -- Chemin vers le PDF de la facture si stocké
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter customer_id à la table orders si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Fonction pour générer automatiquement un numéro de facture unique
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

-- Trigger pour générer automatiquement le numéro de facture
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Fonction pour calculer automatiquement le total de la facture
CREATE OR REPLACE FUNCTION calculate_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le montant de la TVA
  NEW.tax_amount := NEW.subtotal * (NEW.tax_rate / 100);
  
  -- Calculer le total
  NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le total
CREATE TRIGGER calculate_invoice_total_trigger
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_total();

-- Fonction pour mettre à jour automatiquement le statut "overdue" des factures
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND payment_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documenter les tables
COMMENT ON TABLE customers IS 'Table principale des clients avec leurs informations de contact et entreprise';
COMMENT ON TABLE invoices IS 'Table des factures liées aux clients et commandes';
COMMENT ON COLUMN customers.tax_id IS 'Numéro de TVA intracommunautaire ou SIRET pour les entreprises';
COMMENT ON COLUMN invoices.order_id IS 'Référence optionnelle à une commande spécifique';
COMMENT ON COLUMN invoices.pdf_path IS 'Chemin vers le fichier PDF de la facture si stocké sur le serveur';

-- RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour customers
CREATE POLICY "Customers are viewable by authenticated users" ON customers 
  FOR SELECT USING (true);

CREATE POLICY "Customers are insertable by authenticated users" ON customers 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers are updatable by authenticated users" ON customers 
  FOR UPDATE USING (true);

CREATE POLICY "Customers are deletable by authenticated users" ON customers 
  FOR DELETE USING (true);

-- Politiques RLS pour invoices
CREATE POLICY "Invoices are viewable by authenticated users" ON invoices 
  FOR SELECT USING (true);

CREATE POLICY "Invoices are insertable by authenticated users" ON invoices 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Invoices are updatable by authenticated users" ON invoices 
  FOR UPDATE USING (true);

CREATE POLICY "Invoices are deletable by authenticated users" ON invoices 
  FOR DELETE USING (true);

