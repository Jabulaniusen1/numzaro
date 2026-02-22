-- Add profit tracking to number_purchases table
ALTER TABLE public.number_purchases 
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2);

-- Update existing purchases: calculate profit based on actual cost
-- actual_cost should be set when purchasing from 5sim API (the price returned by API)
-- profit = amount (what user paid) - actual_cost (what we paid to 5sim)
-- For existing records without actual_cost, we assume no profit was being made
-- This is only for migration of old records - new purchases will have accurate actual_cost
UPDATE public.number_purchases 
SET 
  actual_cost = amount,  -- Assume we were charging cost price (no markup)
  profit = 0             -- No profit on old records
WHERE actual_cost IS NULL;

-- NOTE: The 0% margin above is only for backfilling old records (assuming no profit was made)
-- For new purchases, actual_cost should be set from the 5sim API response price
-- and profit should be calculated as: amount - actual_cost
-- This allows dynamic margins based on actual provider costs

-- Create index for profit queries
CREATE INDEX IF NOT EXISTS idx_number_purchases_profit ON public.number_purchases(profit);
CREATE INDEX IF NOT EXISTS idx_number_purchases_actual_cost ON public.number_purchases(actual_cost);
