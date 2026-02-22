-- Add 5sim.net support to virtual_numbers table
ALTER TABLE virtual_numbers 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'hero-sms' CHECK (provider IN ('hero-sms', '5sim')),
ADD COLUMN IF NOT EXISTS fivsim_order_id TEXT,
ADD COLUMN IF NOT EXISTS operator TEXT,
ADD COLUMN IF NOT EXISTS product_type TEXT CHECK (product_type IN ('activation', 'hosting', 'rental'));

-- Add index on provider for faster queries
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_provider ON virtual_numbers(provider);

-- Add index on fivsim_order_id for 5sim.net orders
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_fivsim_order_id ON virtual_numbers(fivsim_order_id) WHERE fivsim_order_id IS NOT NULL;

-- Update existing records to have hero-sms as provider
UPDATE virtual_numbers 
SET provider = 'hero-sms' 
WHERE provider IS NULL;

-- Add comment to document the new fields
COMMENT ON COLUMN virtual_numbers.provider IS 'SMS provider: hero-sms or 5sim';
COMMENT ON COLUMN virtual_numbers.fivsim_order_id IS '5sim.net order ID (null for hero-sms)';
COMMENT ON COLUMN virtual_numbers.operator IS 'Mobile operator (e.g., any, vodafone, orange)';
COMMENT ON COLUMN virtual_numbers.product_type IS 'Product type: activation, hosting, or rental';

-- Add currency support to number_purchases table
ALTER TABLE number_purchases 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'RUB', 'EUR'));

-- Update existing records to have USD as currency (hero-sms default)
UPDATE number_purchases 
SET currency = 'USD' 
WHERE currency IS NULL;

COMMENT ON COLUMN number_purchases.currency IS 'Currency of the purchase: USD, RUB, or EUR';
