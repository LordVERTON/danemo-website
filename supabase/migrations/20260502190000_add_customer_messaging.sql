ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS opted_in_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opted_in_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_e164 text;

CREATE TABLE IF NOT EXISTS public.message_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  channel text NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  body text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  phone text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  twilio_sid text,
  error text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_opted_in_sms ON public.customers (opted_in_sms);
CREATE INDEX IF NOT EXISTS idx_customers_opted_in_whatsapp ON public.customers (opted_in_whatsapp);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_customer_id ON public.message_logs (customer_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_target ON public.message_logs (target_type, target_id);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Message logs readable by authenticated users" ON public.message_logs;
CREATE POLICY "Message logs readable by authenticated users"
  ON public.message_logs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Message logs insertable by authenticated users" ON public.message_logs;
CREATE POLICY "Message logs insertable by authenticated users"
  ON public.message_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
