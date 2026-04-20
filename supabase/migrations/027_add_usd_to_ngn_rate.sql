INSERT INTO public.admin_settings (key, value, description)
VALUES ('usd_to_ngn_rate', '1400', 'USD to NGN exchange rate applied to social boosting service prices')
ON CONFLICT (key) DO NOTHING;
