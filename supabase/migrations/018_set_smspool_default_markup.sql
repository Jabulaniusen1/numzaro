-- Set default markup to 50% (users pay 1.5× API cost)
-- Previous default was 400% (Twilio era). SMSPool prices are much lower so 50% is reasonable.
INSERT INTO public.admin_settings (key, value, description)
VALUES ('phone_numbers_markup_percentage', '50', 'Markup % added on top of SMSPool API cost. 50 = users pay 1.5× the API price.')
ON CONFLICT (key) DO UPDATE SET value = '50', description = EXCLUDED.description;
