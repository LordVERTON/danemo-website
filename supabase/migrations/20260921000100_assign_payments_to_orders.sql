begin;

-- Les paiements existants sont conservés : seuls les nouveaux règlements doivent
-- obligatoirement préciser une commande via l'API. Les anciennes lignes sans
-- imputation restent donc auditables, sans être réparties arbitrairement.
alter table public.customer_payments
  add column if not exists order_id uuid references public.orders(id) on delete cascade;

create index if not exists customer_payments_order_paid_at_idx
  on public.customer_payments (order_id, paid_at desc, created_at desc);

create or replace function public.sync_order_invoice_payment_status(target_order_id uuid)
returns void
language plpgsql
as $$
declare
  received_amount numeric(12, 2);
  latest_payment_date date;
begin
  if target_order_id is null then
    return;
  end if;

  select coalesce(sum(amount), 0), max(paid_at)
    into received_amount, latest_payment_date
  from public.customer_payments
  where order_id = target_order_id;

  update public.invoices
  set
    status = case
      when status = 'cancelled' then 'cancelled'
      when total_amount > 0 and received_amount >= total_amount then 'paid'
      when status = 'paid' then 'sent'
      else status
    end,
    payment_date = case
      when total_amount > 0 and received_amount >= total_amount then latest_payment_date
      else null
    end
  where order_id = target_order_id;
end;
$$;

create or replace function public.sync_invoice_status_after_payment()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_order_invoice_payment_status(
    case when tg_op = 'DELETE' then old.order_id else new.order_id end
  );
  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
    perform public.sync_order_invoice_payment_status(old.order_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_payments_sync_invoice_status on public.customer_payments;
create trigger customer_payments_sync_invoice_status
  after insert or update or delete on public.customer_payments
  for each row execute function public.sync_invoice_status_after_payment();

create or replace function public.sync_invoice_status_after_invoice_change()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_order_invoice_payment_status(new.order_id);
  return new;
end;
$$;

drop trigger if exists invoices_sync_payment_status on public.invoices;
create trigger invoices_sync_payment_status
  after insert or update of order_id, total_amount on public.invoices
  for each row execute function public.sync_invoice_status_after_invoice_change();

commit;
