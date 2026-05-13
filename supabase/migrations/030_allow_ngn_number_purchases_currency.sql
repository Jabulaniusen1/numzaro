ALTER TABLE public.number_purchases
DROP CONSTRAINT IF EXISTS number_purchases_currency_check;

ALTER TABLE public.number_purchases
ADD CONSTRAINT number_purchases_currency_check
CHECK (currency IN ('USD', 'RUB', 'EUR', 'GBP', 'NGN'));

COMMENT ON COLUMN public.number_purchases.currency IS
'Currency of the purchase: USD, RUB, EUR, GBP, or NGN.';
