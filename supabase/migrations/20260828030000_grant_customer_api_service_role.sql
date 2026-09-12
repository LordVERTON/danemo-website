begin;

grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.customers to service_role;
grant select on table public.invoices to service_role;

commit;
