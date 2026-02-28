-- Migration: Increase country_code size for 5Sim
ALTER TABLE public.virtual_numbers 
ALTER COLUMN country_code TYPE VARCHAR(50);
