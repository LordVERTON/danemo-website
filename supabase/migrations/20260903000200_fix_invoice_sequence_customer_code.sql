begin;

-- reserve_next_invoice_number utilise le code global explicite `__GLOB__`
-- (8 caractères) lorsqu'une facture n'est pas liée à un client.
alter table public.invoice_sequences
  alter column customer_code type varchar(8);

commit;
