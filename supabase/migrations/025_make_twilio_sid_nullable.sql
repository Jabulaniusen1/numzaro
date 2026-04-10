-- twilio_sid is Twilio-specific; non-Twilio providers (SMSPool, Proxnum, etc.) don't have one
ALTER TABLE public.virtual_numbers
ALTER COLUMN twilio_sid DROP NOT NULL;
