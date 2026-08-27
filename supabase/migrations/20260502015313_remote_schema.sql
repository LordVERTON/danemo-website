drop extension if exists "pg_net";

create extension if not exists "pg_trgm" with schema "public";

drop trigger if exists "update_inventory_updated_at" on "public"."inventory";

drop trigger if exists "order_changes_trigger" on "public"."orders";

drop trigger if exists "update_packages_updated_at" on "public"."packages";

drop policy "Blog media deletable by authenticated users" on "public"."blog_media";

drop policy "Blog media insertable by authenticated users" on "public"."blog_media";

drop policy "Blog media readable by authenticated users" on "public"."blog_media";

drop policy "Blog media updatable by authenticated users" on "public"."blog_media";

drop policy "Containers are deletable by authenticated users" on "public"."containers";

drop policy "Containers are insertable by authenticated users" on "public"."containers";

drop policy "Containers are updatable by authenticated users" on "public"."containers";

drop policy "Containers are viewable by everyone" on "public"."containers";

drop policy "Inventory is deletable by authenticated users" on "public"."inventory";

drop policy "Inventory is insertable by authenticated users" on "public"."inventory";

drop policy "Inventory is updatable by authenticated users" on "public"."inventory";

drop policy "Inventory is viewable by everyone" on "public"."inventory";

drop policy "Order history insertable by authenticated users" on "public"."order_history";

drop policy "Order history readable by authenticated users" on "public"."order_history";

drop policy "Packages are deletable by authenticated users" on "public"."packages";

drop policy "Packages are insertable by authenticated users" on "public"."packages";

drop policy "Packages are updatable by authenticated users" on "public"."packages";

drop policy "Packages are viewable by everyone" on "public"."packages";

revoke delete on table "public"."order_history" from "anon";

revoke insert on table "public"."order_history" from "anon";

revoke references on table "public"."order_history" from "anon";

revoke select on table "public"."order_history" from "anon";

revoke trigger on table "public"."order_history" from "anon";

revoke truncate on table "public"."order_history" from "anon";

revoke update on table "public"."order_history" from "anon";

revoke delete on table "public"."order_history" from "authenticated";

revoke insert on table "public"."order_history" from "authenticated";

revoke references on table "public"."order_history" from "authenticated";

revoke select on table "public"."order_history" from "authenticated";

revoke trigger on table "public"."order_history" from "authenticated";

revoke truncate on table "public"."order_history" from "authenticated";

revoke update on table "public"."order_history" from "authenticated";

revoke delete on table "public"."order_history" from "service_role";

revoke insert on table "public"."order_history" from "service_role";

revoke references on table "public"."order_history" from "service_role";

revoke select on table "public"."order_history" from "service_role";

revoke trigger on table "public"."order_history" from "service_role";

revoke truncate on table "public"."order_history" from "service_role";

revoke update on table "public"."order_history" from "service_role";

revoke delete on table "public"."packages" from "anon";

revoke insert on table "public"."packages" from "anon";

revoke references on table "public"."packages" from "anon";

revoke select on table "public"."packages" from "anon";

revoke trigger on table "public"."packages" from "anon";

revoke truncate on table "public"."packages" from "anon";

revoke update on table "public"."packages" from "anon";

revoke delete on table "public"."packages" from "authenticated";

revoke insert on table "public"."packages" from "authenticated";

revoke references on table "public"."packages" from "authenticated";

revoke select on table "public"."packages" from "authenticated";

revoke trigger on table "public"."packages" from "authenticated";

revoke truncate on table "public"."packages" from "authenticated";

revoke update on table "public"."packages" from "authenticated";

revoke delete on table "public"."packages" from "service_role";

revoke insert on table "public"."packages" from "service_role";

revoke references on table "public"."packages" from "service_role";

revoke select on table "public"."packages" from "service_role";

revoke trigger on table "public"."packages" from "service_role";

revoke truncate on table "public"."packages" from "service_role";

revoke update on table "public"."packages" from "service_role";

alter table "public"."containers" drop constraint "containers_client_id_fkey";

alter table "public"."inventory" drop constraint "inventory_container_id_fkey";

alter table "public"."inventory" drop constraint "inventory_reference_key";

alter table "public"."order_history" drop constraint "order_history_order_id_fkey";

alter table "public"."order_history" drop constraint "order_history_user_id_fkey";

alter table "public"."packages" drop constraint "packages_client_id_fkey";

alter table "public"."packages" drop constraint "packages_container_id_fkey";

alter table "public"."packages" drop constraint "packages_qr_code_key";

alter table "public"."packages" drop constraint "packages_status_check";

alter table "public"."inventory" drop constraint "inventory_status_check";

alter table "public"."inventory" drop constraint "inventory_type_check";

drop function if exists "public"."track_order_changes"();

alter table "public"."order_history" drop constraint "order_history_pkey";

alter table "public"."packages" drop constraint "packages_pkey";

drop index if exists "public"."idx_inventory_client";

drop index if exists "public"."idx_inventory_container_id";

drop index if exists "public"."idx_inventory_date_ajout";

drop index if exists "public"."idx_inventory_status";

drop index if exists "public"."idx_inventory_type";

drop index if exists "public"."idx_order_history_created_at";

drop index if exists "public"."idx_order_history_order_id";

drop index if exists "public"."idx_packages_client_id";

drop index if exists "public"."idx_packages_container_id";

drop index if exists "public"."idx_packages_qr_code";

drop index if exists "public"."inventory_reference_key";

drop index if exists "public"."order_history_pkey";

drop index if exists "public"."packages_pkey";

drop index if exists "public"."packages_qr_code_key";

drop table "public"."order_history";

drop table "public"."packages";


  create table "public"."invoice_sequences" (
    "year" integer not null,
    "customer_code" character varying(6) not null,
    "last_seq" integer not null default 0
      );


alter table "public"."invoice_sequences" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" character varying(255) not null,
    "password_hash" text not null,
    "name" character varying(255),
    "role" character varying(50) not null default ''::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

alter table "public"."containers" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."customers" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."inventory" drop column "container_id";

alter table "public"."inventory" drop column "date_ajout";

alter table "public"."inventory" drop column "updated_at";

alter table "public"."inventory" alter column "client" set data type text using "client"::text;

alter table "public"."inventory" alter column "created_at" set not null;

alter table "public"."inventory" alter column "dimensions" set data type text using "dimensions"::text;

alter table "public"."inventory" alter column "location" set data type text using "location"::text;

alter table "public"."inventory" alter column "poids" set data type text using "poids"::text;

alter table "public"."inventory" alter column "reference" set data type text using "reference"::text;

alter table "public"."inventory" alter column "status" set data type text using "status"::text;

alter table "public"."inventory" alter column "type" set data type text using "type"::text;

alter table "public"."inventory" alter column "valeur" set data type text using "valeur"::text;

alter table "public"."invoices" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."orders" drop column "container_status";

alter table "public"."orders" alter column "client_city" set data type text using "client_city"::text;

alter table "public"."orders" alter column "client_country" set data type text using "client_country"::text;

alter table "public"."orders" alter column "client_postal_code" set data type text using "client_postal_code"::text;

alter table "public"."orders" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."tracking_events" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."tracking_events" alter column "order_id" drop not null;

CREATE UNIQUE INDEX admin_users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX admin_users_pkey ON public.users USING btree (id);

CREATE INDEX inventory_client_trgm_idx ON public.inventory USING gin (client public.gin_trgm_ops);

CREATE INDEX inventory_created_at_idx ON public.inventory USING btree (created_at DESC);

CREATE INDEX inventory_description_trgm_idx ON public.inventory USING gin (description public.gin_trgm_ops);

CREATE INDEX inventory_reference_trgm_idx ON public.inventory USING gin (reference public.gin_trgm_ops);

CREATE INDEX inventory_status_idx ON public.inventory USING btree (status);

CREATE INDEX inventory_type_idx ON public.inventory USING btree (type);

CREATE UNIQUE INDEX invoice_sequences_pkey ON public.invoice_sequences USING btree (year, customer_code);

alter table "public"."invoice_sequences" add constraint "invoice_sequences_pkey" PRIMARY KEY using index "invoice_sequences_pkey";

alter table "public"."users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."users" add constraint "admin_users_email_key" UNIQUE using index "admin_users_email_key";

alter table "public"."inventory" add constraint "inventory_status_check" CHECK ((status = ANY (ARRAY['en_stock'::text, 'en_transit'::text, 'livre'::text, 'en_attente'::text]))) not valid;

alter table "public"."inventory" validate constraint "inventory_status_check";

alter table "public"."inventory" add constraint "inventory_type_check" CHECK ((type = ANY (ARRAY['colis'::text, 'vehicule'::text, 'marchandise'::text]))) not valid;

alter table "public"."inventory" validate constraint "inventory_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.reserve_next_invoice_number(p_customer_id uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_year INT;
  v_customer_code VARCHAR(6);
  v_seq INT;
  v_result TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::INT;
  
  IF p_customer_id IS NULL THEN
    -- Fallback: format INV-YYYY-000001 (séquence globale par année)
    INSERT INTO invoice_sequences (year, customer_code, last_seq)
    VALUES (v_year, '__GLOB__', 1)
    ON CONFLICT (year, customer_code)
    DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
    RETURNING last_seq INTO v_seq;
    v_result := 'INV-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 6, '0');
    RETURN v_result;
  END IF;

  v_customer_code := UPPER(SUBSTR(REPLACE(p_customer_id::TEXT, '-', ''), 1, 6));

  INSERT INTO invoice_sequences (year, customer_code, last_seq)
  VALUES (v_year, v_customer_code, 1)
  ON CONFLICT (year, customer_code)
  DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_result := FORMAT('INV-%s-%s-%s', v_year, v_customer_code, LPAD(v_seq::TEXT, 4, '0'));
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_invoice_total()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Calculer le montant de la TVA
  NEW.tax_amount := NEW.subtotal * (NEW.tax_rate / 100);
  
  -- Calculer le total
  NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_year INT;
  v_customer_code VARCHAR(6);
  v_seq INT;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::INT;

  IF NEW.customer_id IS NULL THEN
    -- Fallback ancien format INV-YYYY-000001
    INSERT INTO invoice_sequences (year, customer_code, last_seq)
    VALUES (v_year, '__GLOB__', 1)
    ON CONFLICT (year, customer_code)
    DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
    RETURNING last_seq INTO v_seq;
    NEW.invoice_number := 'INV-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 6, '0');
    RETURN NEW;
  END IF;

  v_customer_code := UPPER(SUBSTR(REPLACE(NEW.customer_id::TEXT, '-', ''), 1, 6));

  INSERT INTO invoice_sequences (year, customer_code, last_seq)
  VALUES (v_year, v_customer_code, 1)
  ON CONFLICT (year, customer_code)
  DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  NEW.invoice_number := FORMAT('INV-%s-%s-%s', v_year, v_customer_code, LPAD(v_seq::TEXT, 4, '0'));
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_order_qr_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  generated_qr_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate QR code: ORD-{timestamp}-{random 6 chars}
    generated_qr_code := 'ORD-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM9999999999') || '-' || 
               SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 6);
    
    -- Check if this QR code already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE orders.qr_code = generated_qr_code) INTO exists_check;
    
    -- If it doesn't exist, we can use it
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN generated_qr_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_extract_number(input_text text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_order_qr_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only set QR code if it's not already provided
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_order_qr_code();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_order_container_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND payment_date IS NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."invoice_sequences" to "anon";

grant insert on table "public"."invoice_sequences" to "anon";

grant references on table "public"."invoice_sequences" to "anon";

grant select on table "public"."invoice_sequences" to "anon";

grant trigger on table "public"."invoice_sequences" to "anon";

grant truncate on table "public"."invoice_sequences" to "anon";

grant update on table "public"."invoice_sequences" to "anon";

grant delete on table "public"."invoice_sequences" to "authenticated";

grant insert on table "public"."invoice_sequences" to "authenticated";

grant references on table "public"."invoice_sequences" to "authenticated";

grant select on table "public"."invoice_sequences" to "authenticated";

grant trigger on table "public"."invoice_sequences" to "authenticated";

grant truncate on table "public"."invoice_sequences" to "authenticated";

grant update on table "public"."invoice_sequences" to "authenticated";

grant delete on table "public"."invoice_sequences" to "service_role";

grant insert on table "public"."invoice_sequences" to "service_role";

grant references on table "public"."invoice_sequences" to "service_role";

grant select on table "public"."invoice_sequences" to "service_role";

grant trigger on table "public"."invoice_sequences" to "service_role";

grant truncate on table "public"."invoice_sequences" to "service_role";

grant update on table "public"."invoice_sequences" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Inventory deletable by authenticated users"
  on "public"."inventory"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Inventory insertable by authenticated users"
  on "public"."inventory"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Inventory readable by everyone"
  on "public"."inventory"
  as permissive
  for select
  to public
using (true);



  create policy "Inventory updatable by authenticated users"
  on "public"."inventory"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admin users are viewable by authenticated users"
  on "public"."users"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


