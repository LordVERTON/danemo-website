-- DANEMO initial schema (consolidated from legacy root SQL scripts)
-- Structure only: tables, constraints, indexes, functions, triggers, RLS.

SET search_path = public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- customers (email optional — cutover from legacy optional-email migration)
-- ---------------------------------------------------------------------------
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  company VARCHAR(255),
  tax_id VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON public.customers (email);
CREATE INDEX idx_customers_status ON public.customers (status);
CREATE INDEX idx_customers_created_at ON public.customers (created_at);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- containers
-- ---------------------------------------------------------------------------
CREATE TABLE public.containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  vessel VARCHAR(255),
  departure_port VARCHAR(255),
  arrival_port VARCHAR(255),
  etd TIMESTAMPTZ,
  eta TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'departed', 'in_transit', 'arrived', 'delivered', 'delayed')),
  client_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_containers_code ON public.containers (code);
CREATE INDEX idx_containers_status ON public.containers (status);
CREATE INDEX idx_containers_client_id ON public.containers (client_id);

CREATE TRIGGER update_containers_updated_at
  BEFORE UPDATE ON public.containers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- orders (all additive columns merged)
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_address TEXT,
  client_city VARCHAR(255),
  client_postal_code VARCHAR(20),
  client_country VARCHAR(100),
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  recipient_city TEXT,
  recipient_postal_code TEXT,
  recipient_country TEXT,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  weight DECIMAL(10, 2),
  value DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  estimated_delivery DATE,
  qr_code VARCHAR(255) UNIQUE,
  parcels_count INTEGER DEFAULT 1,
  container_id UUID REFERENCES public.containers (id) ON DELETE SET NULL,
  container_code VARCHAR(50),
  container_status VARCHAR(50),
  customer_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_client_email ON public.orders (client_email);
CREATE INDEX idx_orders_created_at ON public.orders (created_at);
CREATE INDEX idx_orders_container_id ON public.orders (container_id);
CREATE INDEX idx_orders_container_code ON public.orders (container_code);
CREATE INDEX idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX idx_orders_qr_code ON public.orders (qr_code);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- QR generation (fixed: qualify orders.qr_code in EXISTS — see fix-qr-code-ambiguous-error.sql)
CREATE OR REPLACE FUNCTION public.generate_order_qr_code()
RETURNS TEXT AS $$
DECLARE
  generated_qr_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    generated_qr_code := 'ORD-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM9999999999') || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6);
    SELECT EXISTS (SELECT 1 FROM public.orders o WHERE o.qr_code = generated_qr_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN generated_qr_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_order_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := public.generate_order_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_qr_code ON public.orders;
CREATE TRIGGER trigger_set_order_qr_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_qr_code();

-- Mirror container code from containers.container_id
CREATE OR REPLACE FUNCTION public.update_order_container_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.container_id IS NOT NULL THEN
    SELECT c.code INTO NEW.container_code
    FROM public.containers c
    WHERE c.id = NEW.container_id;
  ELSE
    NEW.container_code := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_container_code ON public.orders;
CREATE TRIGGER trigger_update_order_container_code
  BEFORE INSERT OR UPDATE OF container_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_container_code();

-- ---------------------------------------------------------------------------
-- tracking_events
-- ---------------------------------------------------------------------------
CREATE TABLE public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  operator VARCHAR(255),
  event_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_order_id ON public.tracking_events (order_id);
CREATE INDEX idx_tracking_events_event_date ON public.tracking_events (event_date);

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('colis', 'vehicule', 'marchandise')),
  reference VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  client VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('en_stock', 'en_transit', 'livre', 'en_attente')),
  location VARCHAR(255) NOT NULL,
  poids VARCHAR(100),
  dimensions VARCHAR(255),
  valeur VARCHAR(100) NOT NULL,
  container_id UUID REFERENCES public.containers (id) ON DELETE SET NULL,
  date_ajout DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_type ON public.inventory (type);
CREATE INDEX idx_inventory_status ON public.inventory (status);
CREATE INDEX idx_inventory_client ON public.inventory (client);
CREATE INDEX idx_inventory_date_ajout ON public.inventory (date_ajout);
CREATE INDEX idx_inventory_container_id ON public.inventory (container_id);

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- packages (colis / QR) — client_id points to customers (legacy column name)
-- ---------------------------------------------------------------------------
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code TEXT NOT NULL UNIQUE,
  reference TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  container_id UUID REFERENCES public.containers (id) ON DELETE SET NULL,
  weight DECIMAL(10, 2),
  value DECIMAL(10, 2),
  status VARCHAR(50) NOT NULL CHECK (status IN ('preparation', 'expedie', 'en_transit', 'arrive_port', 'dedouane', 'livre')),
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_qr_code ON public.packages (qr_code);
CREATE INDEX idx_packages_client_id ON public.packages (client_id);
CREATE INDEX idx_packages_container_id ON public.packages (container_id);

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- invoices (functions merged from create-customers-table + fix-invoice-number)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.safe_extract_number(input_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN 0;
  END IF;
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

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(50),
  payment_date DATE,
  notes TEXT,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer_id ON public.invoices (customer_id);
CREATE INDEX idx_invoices_order_id ON public.invoices (order_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices (invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices (status);
CREATE INDEX idx_invoices_issue_date ON public.invoices (issue_date);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
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
  SELECT COALESCE(
    MAX(
      public.safe_extract_number(
        REGEXP_REPLACE(invoice_number, '^INV-' || year_prefix || '-', '', 'g')
      )
    ),
    0
  ) INTO last_number
  FROM public.invoices
  WHERE invoice_number LIKE pattern;
  new_number := 'INV-' || year_prefix || '-' || LPAD((last_number + 1)::TEXT, 6, '0');
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := new_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON public.invoices;
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();

CREATE OR REPLACE FUNCTION public.calculate_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tax_amount := NEW.subtotal * (NEW.tax_rate / 100);
  NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_invoice_total_trigger ON public.invoices;
CREATE TRIGGER calculate_invoice_total_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_invoice_total();

CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND payment_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- order_history + audit trigger (jsonb empty check fixed vs legacy jsonb_object_keys misuse)
-- ---------------------------------------------------------------------------
CREATE TABLE public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL DEFAULT 'update',
  description TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_history_order_id ON public.order_history (order_id);
CREATE INDEX idx_order_history_created_at ON public.order_history (created_at);

CREATE OR REPLACE FUNCTION public.track_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.client_name IS DISTINCT FROM NEW.client_name THEN
      changes := changes || JSONB_BUILD_OBJECT('client_name', JSONB_BUILD_OBJECT('old', OLD.client_name, 'new', NEW.client_name));
    END IF;
    IF OLD.client_email IS DISTINCT FROM NEW.client_email THEN
      changes := changes || JSONB_BUILD_OBJECT('client_email', JSONB_BUILD_OBJECT('old', OLD.client_email, 'new', NEW.client_email));
    END IF;
    IF OLD.client_phone IS DISTINCT FROM NEW.client_phone THEN
      changes := changes || JSONB_BUILD_OBJECT('client_phone', JSONB_BUILD_OBJECT('old', OLD.client_phone, 'new', NEW.client_phone));
    END IF;
    IF OLD.service_type IS DISTINCT FROM NEW.service_type THEN
      changes := changes || JSONB_BUILD_OBJECT('service_type', JSONB_BUILD_OBJECT('old', OLD.service_type, 'new', NEW.service_type));
    END IF;
    IF OLD.origin IS DISTINCT FROM NEW.origin THEN
      changes := changes || JSONB_BUILD_OBJECT('origin', JSONB_BUILD_OBJECT('old', OLD.origin, 'new', NEW.origin));
    END IF;
    IF OLD.destination IS DISTINCT FROM NEW.destination THEN
      changes := changes || JSONB_BUILD_OBJECT('destination', JSONB_BUILD_OBJECT('old', OLD.destination, 'new', NEW.destination));
    END IF;
    IF OLD.weight IS DISTINCT FROM NEW.weight THEN
      changes := changes || JSONB_BUILD_OBJECT('weight', JSONB_BUILD_OBJECT('old', OLD.weight, 'new', NEW.weight));
    END IF;
    IF OLD.value IS DISTINCT FROM NEW.value THEN
      changes := changes || JSONB_BUILD_OBJECT('value', JSONB_BUILD_OBJECT('old', OLD.value, 'new', NEW.value));
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changes := changes || JSONB_BUILD_OBJECT('status', JSONB_BUILD_OBJECT('old', OLD.status, 'new', NEW.status));
    END IF;
    IF OLD.estimated_delivery IS DISTINCT FROM NEW.estimated_delivery THEN
      changes := changes || JSONB_BUILD_OBJECT('estimated_delivery', JSONB_BUILD_OBJECT('old', OLD.estimated_delivery, 'new', NEW.estimated_delivery));
    END IF;
    IF changes <> '{}'::JSONB THEN
      INSERT INTO public.order_history (order_id, action, description, changes)
      VALUES (NEW.id, 'update', 'Modification de la commande', changes);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_changes_trigger ON public.orders;
CREATE TRIGGER order_changes_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_order_changes();

-- ---------------------------------------------------------------------------
-- blog_media metadata + storage bucket for uploads (used by /api/blog-media)
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'blog-media',
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_media_created_at ON public.blog_media (created_at DESC);
CREATE INDEX idx_blog_media_media_type ON public.blog_media (media_type);

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- employees (requires Supabase Auth users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  salary DECIMAL(10, 2) NOT NULL,
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.employee_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'order_created', 'order_updated', 'inventory_updated', 'tracking_updated')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX employees_user_id_idx ON public.employees (user_id);
CREATE INDEX employees_role_idx ON public.employees (role);
CREATE INDEX employees_is_active_idx ON public.employees (is_active);
CREATE INDEX employees_email_idx ON public.employees (email);
CREATE INDEX employee_activities_employee_id_idx ON public.employee_activities (employee_id);
CREATE INDEX employee_activities_created_at_idx ON public.employee_activities (created_at DESC);
CREATE INDEX employee_activities_type_idx ON public.employee_activities (activity_type);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive dev-friendly policies; tighten for production)
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;
CREATE POLICY "Orders are viewable by everyone" ON public.orders FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Orders are insertable by authenticated users" ON public.orders;
CREATE POLICY "Orders are insertable by authenticated users" ON public.orders FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Orders are updatable by authenticated users" ON public.orders;
CREATE POLICY "Orders are updatable by authenticated users" ON public.orders FOR UPDATE USING (TRUE);

DROP POLICY IF EXISTS "Tracking events are viewable by everyone" ON public.tracking_events;
CREATE POLICY "Tracking events are viewable by everyone" ON public.tracking_events FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Tracking events are insertable by authenticated users" ON public.tracking_events;
CREATE POLICY "Tracking events are insertable by authenticated users" ON public.tracking_events FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON public.inventory;
CREATE POLICY "Inventory is viewable by everyone" ON public.inventory FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Inventory is insertable by authenticated users" ON public.inventory;
CREATE POLICY "Inventory is insertable by authenticated users" ON public.inventory FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Inventory is updatable by authenticated users" ON public.inventory;
CREATE POLICY "Inventory is updatable by authenticated users" ON public.inventory FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Inventory is deletable by authenticated users" ON public.inventory;
CREATE POLICY "Inventory is deletable by authenticated users" ON public.inventory FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "Customers are viewable by authenticated users" ON public.customers;
CREATE POLICY "Customers are viewable by authenticated users" ON public.customers FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Customers are insertable by authenticated users" ON public.customers;
CREATE POLICY "Customers are insertable by authenticated users" ON public.customers FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Customers are updatable by authenticated users" ON public.customers;
CREATE POLICY "Customers are updatable by authenticated users" ON public.customers FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Customers are deletable by authenticated users" ON public.customers;
CREATE POLICY "Customers are deletable by authenticated users" ON public.customers FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "Invoices are viewable by authenticated users" ON public.invoices;
CREATE POLICY "Invoices are viewable by authenticated users" ON public.invoices FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Invoices are insertable by authenticated users" ON public.invoices;
CREATE POLICY "Invoices are insertable by authenticated users" ON public.invoices FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Invoices are updatable by authenticated users" ON public.invoices;
CREATE POLICY "Invoices are updatable by authenticated users" ON public.invoices FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Invoices are deletable by authenticated users" ON public.invoices;
CREATE POLICY "Invoices are deletable by authenticated users" ON public.invoices FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "Containers are viewable by everyone" ON public.containers;
CREATE POLICY "Containers are viewable by everyone" ON public.containers FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Containers are insertable by authenticated users" ON public.containers;
CREATE POLICY "Containers are insertable by authenticated users" ON public.containers FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Containers are updatable by authenticated users" ON public.containers;
CREATE POLICY "Containers are updatable by authenticated users" ON public.containers FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Containers are deletable by authenticated users" ON public.containers;
CREATE POLICY "Containers are deletable by authenticated users" ON public.containers FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.packages;
CREATE POLICY "Packages are viewable by everyone" ON public.packages FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Packages are insertable by authenticated users" ON public.packages;
CREATE POLICY "Packages are insertable by authenticated users" ON public.packages FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Packages are updatable by authenticated users" ON public.packages;
CREATE POLICY "Packages are updatable by authenticated users" ON public.packages FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Packages are deletable by authenticated users" ON public.packages;
CREATE POLICY "Packages are deletable by authenticated users" ON public.packages FOR DELETE USING (TRUE);

DROP POLICY IF EXISTS "Order history readable by authenticated users" ON public.order_history;
CREATE POLICY "Order history readable by authenticated users" ON public.order_history
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Order history insertable by authenticated users" ON public.order_history;
CREATE POLICY "Order history insertable by authenticated users" ON public.order_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Blog media readable by authenticated users" ON public.blog_media;
CREATE POLICY "Blog media readable by authenticated users" ON public.blog_media FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Blog media insertable by authenticated users" ON public.blog_media;
CREATE POLICY "Blog media insertable by authenticated users" ON public.blog_media FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Blog media updatable by authenticated users" ON public.blog_media;
CREATE POLICY "Blog media updatable by authenticated users" ON public.blog_media FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Blog media deletable by authenticated users" ON public.blog_media;
CREATE POLICY "Blog media deletable by authenticated users" ON public.blog_media FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Employees readable by authenticated users" ON public.employees;
CREATE POLICY "Employees readable by authenticated users" ON public.employees FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Employees insertable by authenticated users" ON public.employees;
CREATE POLICY "Employees insertable by authenticated users" ON public.employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Employees updatable by authenticated users" ON public.employees;
CREATE POLICY "Employees updatable by authenticated users" ON public.employees FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Employees deletable by authenticated users" ON public.employees;
CREATE POLICY "Employees deletable by authenticated users" ON public.employees FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Employee activities readable by authenticated users" ON public.employee_activities;
CREATE POLICY "Employee activities readable by authenticated users" ON public.employee_activities FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Employee activities insertable by authenticated users" ON public.employee_activities;
CREATE POLICY "Employee activities insertable by authenticated users" ON public.employee_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
