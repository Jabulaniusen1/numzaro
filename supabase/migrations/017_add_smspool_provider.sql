-- Migration: Add SMSPool provider support and rental_code column

-- Add smspva and smspool to provider constraint
ALTER TABLE virtual_numbers DROP CONSTRAINT IF EXISTS virtual_numbers_provider_check;
ALTER TABLE virtual_numbers ADD CONSTRAINT virtual_numbers_provider_check
  CHECK (provider IN ('hero-sms', '5sim', 'textverified', 'smspva', 'smspool'));

-- Add rental_code for SMSPool rentals (used to extend/get messages)
ALTER TABLE virtual_numbers ADD COLUMN IF NOT EXISTS rental_code TEXT;

-- Index for fast renewal queries by provider + type
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_provider_type
  ON virtual_numbers(provider, number_type, status, expires_at);

COMMENT ON COLUMN virtual_numbers.rental_code IS 'SMSPool rental_code, used for extendRental and getRentalMessages';
