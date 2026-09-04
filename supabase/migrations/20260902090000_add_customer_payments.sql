begin;
create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency varchar(3) not null default 'EUR' check (currency = upper(currency)),
  paid_at date not null default current_date,
  payment_method varchar(20) not null default 'bank_transfer'
    check (payment_method in ('bank_transfer', 'cash', 'card', 'mobile', 'other')),
  reference varchar(120),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_payments_customer_paid_at_idx
  on public.customer_payments (customer_id, paid_at desc, created_at desc);
alter table public.customer_payments enable row level security;
revoke all on table public.customer_payments from anon, authenticated;
grant select, insert on table public.customer_payments to service_role;
drop trigger if exists update_customer_payments_updated_at on public.customer_payments;
create trigger update_customer_payments_updated_at
  before update on public.customer_payments
  for each row execute function public.update_updated_at_column();
commit;
