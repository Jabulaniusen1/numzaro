-- Allow SMSPool-specific values in number_type
ALTER TABLE public.virtual_numbers
DROP CONSTRAINT IF EXISTS virtual_numbers_number_type_check;

ALTER TABLE public.virtual_numbers
ADD CONSTRAINT virtual_numbers_number_type_check
CHECK (number_type IN ('subscription', 'one_time_otp', 'activation', 'rental'));
