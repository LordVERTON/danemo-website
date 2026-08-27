UPDATE public.orders AS o
SET description = COALESCE(
  NULLIF(BTRIM(o.description), ''),
  NULLIF(BTRIM(o.origin), ''),
  NULLIF(BTRIM(o.service_type), '')
)
WHERE (
    LOWER(o.client_email) = 'vertondan@gmail.com'
    OR EXISTS (
      SELECT 1
      FROM public.customers AS c
      WHERE c.id = o.customer_id
        AND LOWER(c.email) = 'vertondan@gmail.com'
    )
  )
  AND NULLIF(BTRIM(o.description), '') IS NULL;
