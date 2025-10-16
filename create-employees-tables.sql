-- Créer les tables pour la gestion des employés dans Supabase

-- Table des employés
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator')),
  salary DECIMAL(10,2) NOT NULL,
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des activités des employés
CREATE TABLE IF NOT EXISTS public.employee_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'order_created', 'order_updated', 'inventory_updated', 'tracking_updated')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS employees_user_id_idx ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS employees_role_idx ON public.employees(role);
CREATE INDEX IF NOT EXISTS employees_is_active_idx ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS employees_email_idx ON public.employees(email);
CREATE INDEX IF NOT EXISTS employee_activities_employee_id_idx ON public.employee_activities(employee_id);
CREATE INDEX IF NOT EXISTS employee_activities_created_at_idx ON public.employee_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS employee_activities_type_idx ON public.employee_activities(activity_type);

-- Activer RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Employees readable by authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Employees insertable by authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Employees updatable by authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Employees deletable by authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Employee activities readable by authenticated users" ON public.employee_activities;
DROP POLICY IF EXISTS "Employee activities insertable by authenticated users" ON public.employee_activities;

-- Politiques RLS pour les employés
CREATE POLICY "Employees readable by authenticated users" 
  ON public.employees FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Employees insertable by authenticated users" 
  ON public.employees FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Employees updatable by authenticated users" 
  ON public.employees FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Employees deletable by authenticated users" 
  ON public.employees FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Politiques RLS pour les activités
CREATE POLICY "Employee activities readable by authenticated users" 
  ON public.employee_activities FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Employee activities insertable by authenticated users" 
  ON public.employee_activities FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at sur la table employees
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON public.employees 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer les employés par défaut (admin et operator)
-- Note: Ces insertions nécessitent que les utilisateurs existent déjà dans auth.users
-- Vous pouvez les exécuter après avoir créé les comptes via l'API /api/admin/seed-users

-- Exemple d'insertion (à adapter selon vos user_id réels):
/*
INSERT INTO public.employees (user_id, name, email, role, salary, position, hire_date) 
VALUES 
  ('user_id_admin', 'Administrateur', 'admin@danemo.be', 'admin', 5000.00, 'Administrateur', '2024-01-01'),
  ('user_id_operator', 'Opérateur', 'operator@danemo.be', 'operator', 3000.00, 'Opérateur', '2024-01-01');
*/
