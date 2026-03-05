
-- Migration: Add textverified to provider constraints
ALTER TABLE virtual_numbers DROP CONSTRAINT IF EXISTS virtual_numbers_provider_check;
ALTER TABLE virtual_numbers ADD CONSTRAINT virtual_numbers_provider_check CHECK (provider IN ('hero-sms', '5sim', 'textverified'));

-- Add Textverified specific field
ALTER TABLE virtual_numbers ADD COLUMN IF NOT EXISTS textverified_id TEXT;

-- Update currency check list
ALTER TABLE number_purchases DROP CONSTRAINT IF EXISTS number_purchases_currency_check;
ALTER TABLE number_purchases ADD CONSTRAINT number_purchases_currency_check CHECK (currency IN ('USD', 'RUB', 'EUR', 'GBP'));

COMMENT ON COLUMN virtual_numbers.textverified_id IS 'Textverified Verification or Rental ID';
