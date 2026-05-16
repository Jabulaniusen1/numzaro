-- Nullify rows from deprecated providers before tightening the constraint
UPDATE virtual_numbers
SET provider = NULL
WHERE provider NOT IN ('textverified', 'smspool', 'pvadeals')
  AND provider IS NOT NULL;

ALTER TABLE virtual_numbers DROP CONSTRAINT IF EXISTS virtual_numbers_provider_check;
ALTER TABLE virtual_numbers ADD CONSTRAINT virtual_numbers_provider_check
  CHECK (provider IN ('textverified', 'smspool', 'pvadeals'));
