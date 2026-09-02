begin;

grant select, insert, update, delete on table public.containers to service_role;

commit;
