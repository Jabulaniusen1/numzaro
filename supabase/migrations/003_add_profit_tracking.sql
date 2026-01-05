-- Add profit tracking fields to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS cost_rate DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5, 2) DEFAULT 30.00;

-- Update existing services: set cost_rate to current rate
UPDATE public.services 
SET cost_rate = rate 
WHERE cost_rate IS NULL;

-- Add profit tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_charge DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS api_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2);

-- Update existing orders: calculate profit from charge
UPDATE public.orders 
SET customer_charge = charge,
    api_cost = charge / 1.30, -- Approximate if we assume 30% markup was used
    profit = charge - (charge / 1.30)
WHERE customer_charge IS NULL;

-- Create admin settings table for global markup control
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default markup setting
INSERT INTO public.admin_settings (key, value, description)
VALUES ('default_markup_percentage', '30.00', 'Default profit markup percentage for all services')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update settings (admin check done in API)
CREATE POLICY "Authenticated users can manage admin settings"
  ON public.admin_settings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create index for profit queries
CREATE INDEX IF NOT EXISTS idx_orders_profit ON public.orders(profit);
CREATE INDEX IF NOT EXISTS idx_orders_customer_charge ON public.orders(customer_charge);

