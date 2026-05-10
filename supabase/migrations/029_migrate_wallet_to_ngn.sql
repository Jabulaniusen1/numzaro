-- Migrate wallet ledger units from USD-based values to NGN-based values.
-- This runs once and marks completion in admin_settings.

DO $$
DECLARE
  v_done TEXT;
  v_rate NUMERIC := 1500;
BEGIN
  SELECT value INTO v_done
  FROM public.admin_settings
  WHERE key = 'wallet_currency_migrated_to_ngn'
  LIMIT 1;

  IF COALESCE(v_done, 'false') = 'true' THEN
    RETURN;
  END IF;

  SELECT NULLIF(value, '')::NUMERIC INTO v_rate
  FROM public.admin_settings
  WHERE key = 'usd_to_ngn_rate'
  LIMIT 1;

  v_rate := COALESCE(v_rate, 1500);

  UPDATE public.users
  SET wallet_balance = ROUND(COALESCE(wallet_balance, 0) * v_rate, 2);

  UPDATE public.wallet_transactions
  SET
    amount = ROUND(COALESCE(amount, 0) * v_rate, 2),
    balance_before = ROUND(COALESCE(balance_before, 0) * v_rate, 2),
    balance_after = ROUND(COALESCE(balance_after, 0) * v_rate, 2);

  INSERT INTO public.admin_settings (key, value, description)
  VALUES (
    'wallet_currency_migrated_to_ngn',
    'true',
    'Set by migration 029 after converting wallet balances/ledger from USD units to NGN units.'
  )
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();
END $$;

