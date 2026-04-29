-- Add country and phone fields for user onboarding
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS country_name TEXT,
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(8),
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

-- Optional uniqueness for fully-qualified phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_e164_unique
ON public.users(phone_e164)
WHERE phone_e164 IS NOT NULL;
