-- Migration: Add One-Time OTP Number Support
-- Adds number_type field and one-time OTP pricing settings

-- 1. Make monthly_cost and expires_at nullable for one-time OTP numbers
ALTER TABLE public.virtual_numbers
ALTER COLUMN monthly_cost DROP NOT NULL;

ALTER TABLE public.virtual_numbers
ALTER COLUMN expires_at DROP NOT NULL;

-- 2. Add number_type column to virtual_numbers table
ALTER TABLE public.virtual_numbers
ADD COLUMN IF NOT EXISTS number_type VARCHAR(20) DEFAULT 'subscription' 
CHECK (number_type IN ('subscription', 'one_time_otp'));

-- Update existing records to have subscription type
UPDATE public.virtual_numbers
SET number_type = 'subscription'
WHERE number_type IS NULL;

-- Create index for querying by type
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_number_type ON public.virtual_numbers(number_type);

-- 2. Add one-time OTP pricing settings to admin_settings
-- Option 1: Percentage of monthly cost (default: 20% = 0.20)
INSERT INTO public.admin_settings (key, value, description)
VALUES ('one_time_otp_pricing_type', 'percentage', 'Pricing type for one-time OTP numbers: "percentage" or "fixed"')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value, description)
VALUES ('one_time_otp_pricing_percentage', '20.00', 'Percentage of monthly cost for one-time OTP numbers (e.g., 20.00 = 20%)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value, description)
VALUES ('one_time_otp_pricing_fixed', '1.00', 'Fixed price in USD for one-time OTP numbers (used when pricing_type is "fixed")')
ON CONFLICT (key) DO NOTHING;

