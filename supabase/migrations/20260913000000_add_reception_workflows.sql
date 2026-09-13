begin;

create table if not exists public.reception_workflows (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  status varchar(20) not null default 'in_progress'
    check (status in ('in_progress', 'blocked', 'completed')),
  current_step smallint not null default 1 check (current_step between 1 and 8),
  draft jsonb not null default '{}'::jsonb,
  created_by text,
  created_by_email text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists reception_workflows_updated_at_idx
  on public.reception_workflows (updated_at desc);
create index if not exists reception_workflows_status_idx
  on public.reception_workflows (status, updated_at desc);

create table if not exists public.reception_step_events (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.reception_workflows(id) on delete cascade,
  step smallint not null check (step between 1 and 8),
  state varchar(12) not null check (state in ('todo', 'done', 'blocked')),
  operator_id text,
  operator_email text,
  note text,
  occurred_at timestamptz not null default now()
);

create index if not exists reception_step_events_workflow_idx
  on public.reception_step_events (workflow_id, occurred_at asc);

create table if not exists public.reception_incidents (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null unique references public.reception_workflows(id) on delete cascade,
  status varchar(16) not null default 'reported'
    check (status in ('reported', 'acknowledged', 'resolved')),
  description text not null,
  reported_by text,
  reported_at timestamptz not null default now(),
  resolution text,
  resolved_by text,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists reception_incidents_status_idx
  on public.reception_incidents (status, updated_at desc);

drop trigger if exists update_reception_workflows_updated_at on public.reception_workflows;
create trigger update_reception_workflows_updated_at
  before update on public.reception_workflows
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_reception_incidents_updated_at on public.reception_incidents;
create trigger update_reception_incidents_updated_at
  before update on public.reception_incidents
  for each row execute function public.update_updated_at_column();

alter table public.reception_workflows enable row level security;
alter table public.reception_step_events enable row level security;
alter table public.reception_incidents enable row level security;

revoke all on table public.reception_workflows, public.reception_step_events, public.reception_incidents from anon, authenticated;
grant select, insert, update, delete on table public.reception_workflows, public.reception_step_events, public.reception_incidents to service_role;

commit;
