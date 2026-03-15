-- Add product fields used by various SMS providers (5sim, smspva, smspool)
ALTER TABLE public.virtual_numbers
ADD COLUMN IF NOT EXISTS product TEXT,
ADD COLUMN IF NOT EXISTS product_code TEXT;

COMMENT ON COLUMN public.virtual_numbers.product IS 'Provider product/service name (e.g., facebook, telegram)';
COMMENT ON COLUMN public.virtual_numbers.product_code IS 'Provider-specific product code (legacy for smspva/textverified)';
