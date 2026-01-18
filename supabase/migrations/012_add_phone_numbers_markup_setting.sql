-- Migration: Add Phone Numbers Markup Setting
-- Adds default markup setting for virtual phone numbers

-- Insert default phone numbers markup setting (400% = 5x cost)
INSERT INTO public.admin_settings (key, value, description)
VALUES ('phone_numbers_markup_percentage', '400.00', 'Profit markup percentage for virtual phone numbers')
ON CONFLICT (key) DO NOTHING;

