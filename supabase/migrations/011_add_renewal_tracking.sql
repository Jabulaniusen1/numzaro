-- Add renewal reminder tracking and restricted status

-- Add renewal_reminder_sent column
ALTER TABLE public.virtual_numbers
ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN DEFAULT false;

-- Update status check to include 'restricted'
ALTER TABLE public.virtual_numbers
DROP CONSTRAINT IF EXISTS virtual_numbers_status_check;

ALTER TABLE public.virtual_numbers
ADD CONSTRAINT virtual_numbers_status_check 
CHECK (status IN ('active', 'suspended', 'cancelled', 'restricted'));

-- Create index for renewal queries
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_expires_at ON public.virtual_numbers(expires_at);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_status_expires ON public.virtual_numbers(status, expires_at);
