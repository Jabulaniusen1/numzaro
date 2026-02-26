-- Add 5Sim-specific fields to virtual_numbers table
ALTER TABLE public.virtual_numbers 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'twilio',
ADD COLUMN IF NOT EXISTS fivsim_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS number_type VARCHAR(50) DEFAULT 'one_time_otp';

-- Add index for 5sim order lookups
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_fivsim_order_id ON public.virtual_numbers(fivsim_order_id);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_provider ON public.virtual_numbers(provider);
