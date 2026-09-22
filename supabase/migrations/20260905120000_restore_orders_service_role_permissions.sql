begin;

grant select, insert, update, delete on table public.orders to service_role;

commit;
