begin;

-- Conserver le statut propre des commandes : le changement de conteneur est
-- un événement de suivi supplémentaire, visible depuis chaque commande liée.
create or replace function public.record_container_status_tracking_events()
returns trigger
language plpgsql
as $$
begin
  insert into public.tracking_events (
    order_id,
    status,
    location,
    description,
    operator,
    event_date
  )
  select
    orders.id,
    new.status,
    case
      when new.status in ('planned', 'departed', 'in_transit') then new.departure_port
      when new.status in ('arrived', 'delivered') then new.arrival_port
      else null
    end,
    format(
      'Statut du conteneur %s modifié : %s → %s.',
      coalesce(new.code, 'sans code'),
      coalesce(old.status, 'non défini'),
      new.status
    ),
    'Système — conteneur',
    now()
  from public.orders as orders
  where orders.container_id = new.id;

  return new;
end;
$$;

drop trigger if exists trigger_record_container_status_tracking_events on public.containers;

create trigger trigger_record_container_status_tracking_events
  after update of status on public.containers
  for each row
  when (old.status is distinct from new.status and new.status is not null)
  execute function public.record_container_status_tracking_events();

commit;
