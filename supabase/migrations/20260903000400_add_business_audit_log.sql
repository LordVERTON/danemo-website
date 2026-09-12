begin;

create table if not exists public.business_audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id text,
  actor_email text,
  actor_role text not null check (actor_role in ('admin', 'operator')),
  action text not null check (action in ('create', 'update', 'delete')),
  entity_type text not null check (entity_type in ('customer', 'order', 'payment', 'container', 'content')),
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists business_audit_log_occurred_at_idx
  on public.business_audit_log (occurred_at desc);

create index if not exists business_audit_log_entity_idx
  on public.business_audit_log (entity_type, entity_id, occurred_at desc);

alter table public.business_audit_log enable row level security;
revoke all on table public.business_audit_log from anon, authenticated;
grant select, insert on table public.business_audit_log to service_role;

commit;
