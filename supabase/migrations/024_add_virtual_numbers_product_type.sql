-- Add product_type column used by Proxnum and other activation providers
ALTER TABLE public.virtual_numbers
ADD COLUMN IF NOT EXISTS product_type TEXT;

COMMENT ON COLUMN public.virtual_numbers.product_type IS 'Activation type (e.g., activation, rental)';
