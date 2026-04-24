-- Final cutover to a single customer table (`customers`)
-- Run this script once the application is deployed with `customers`-only code.
-- It migrates residual references from `clients` to `customers`, then drops `clients`.

begin;

-- 1) If legacy table exists, merge rows into `customers`.
do $$
begin
  if to_regclass('public.clients') is not null then
    insert into customers (
      name,
      email,
      phone,
      address,
      company,
      status,
      created_at,
      updated_at
    )
    select
      c.name,
      nullif(lower(trim(c.email)), ''),
      c.phone,
      c.address,
      c.company,
      'active',
      coalesce(c.created_at, now()),
      now()
    from clients c
    where not exists (
      select 1
      from customers cu
      where (
        nullif(lower(trim(cu.email)), '') is not null
        and nullif(lower(trim(cu.email)), '') = nullif(lower(trim(c.email)), '')
      )
      or (
        cu.name = c.name
        and coalesce(cu.phone, '') = coalesce(c.phone, '')
      )
    );
  end if;
end $$;

-- 2) Rewire packages.client_id to customers ids (if packages and clients tables exist).
do $$
begin
  if to_regclass('public.packages') is not null
     and to_regclass('public.clients') is not null then
    update packages p
    set client_id = map.customer_id
    from (
      select
        c.id as legacy_client_id,
        cu.id as customer_id
      from clients c
      join customers cu
        on (
          nullif(lower(trim(cu.email)), '') is not null
          and nullif(lower(trim(cu.email)), '') = nullif(lower(trim(c.email)), '')
        )
        or (
          cu.name = c.name
          and coalesce(cu.phone, '') = coalesce(c.phone, '')
        )
    ) as map
    where p.client_id = map.legacy_client_id;
  end if;
end $$;

-- 3) Rewire orders.customer_id in case some rows still reference legacy clients ids.
do $$
begin
  if to_regclass('public.orders') is not null
     and to_regclass('public.clients') is not null then
    update orders o
    set customer_id = map.customer_id
    from (
      select
        c.id as legacy_client_id,
        cu.id as customer_id
      from clients c
      join customers cu
        on (
          nullif(lower(trim(cu.email)), '') is not null
          and nullif(lower(trim(cu.email)), '') = nullif(lower(trim(c.email)), '')
        )
        or (
          cu.name = c.name
          and coalesce(cu.phone, '') = coalesce(c.phone, '')
        )
    ) as map
    where o.customer_id = map.legacy_client_id;
  end if;
end $$;

-- 4) Drop legacy table.
drop table if exists clients;

commit;
