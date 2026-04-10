-- Allow Proxnum as a virtual number provider
ALTER TABLE virtual_numbers DROP CONSTRAINT IF EXISTS virtual_numbers_provider_check;
ALTER TABLE virtual_numbers ADD CONSTRAINT virtual_numbers_provider_check
  CHECK (provider IN ('hero-sms', '5sim', 'textverified', 'smspva', 'smspool', 'grizzly', 'proxnum'));
