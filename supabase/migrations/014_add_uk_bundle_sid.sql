-- Migration: Add UK Address SID Configuration
-- Sets default Address SID for United Kingdom

-- Insert UK Address SID
INSERT INTO public.admin_settings (key, value, description)
VALUES ('twilio_bundle_sid_GB', 'AD7d556b57d32d8d2cbbca2a388187fbf0', 'Twilio Address SID for United Kingdom (GB) - for numbers requiring address verification')
ON CONFLICT (key) DO UPDATE SET value = 'AD7d556b57d32d8d2cbbca2a388187fbf0';

