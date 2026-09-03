begin;

-- L'application accède aux données métier via des routes serveur contrôlées.
-- Les rôles PostgREST anon/authenticated ne doivent donc avoir aucun accès
-- direct aux tables publiques, même lorsqu'une policy historique existe.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'customers',
    'containers',
    'orders',
    'tracking_events',
    'inventory',
    'packages',
    'invoices',
    'order_history',
    'blog_media',
    'employees',
    'employee_activities',
    'message_logs',
    'articles',
    'article_revisions',
    'media_library',
    'customer_payments',
    'invoice_sequences',
    'users'
  ] loop
    -- Certains environnements historiques ne possèdent pas les deux dernières
    -- tables : la migration reste donc reproductible partout.
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);

    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;

    execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end
$$;

commit;
