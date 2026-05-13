-- =============================================================================
-- COMBINED SCHEMA MIGRATION
-- Run this once on a fresh Supabase project to set up the entire database.
-- All statements are idempotent (safe to re-run).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3. TABLES  (final schema — all ALTER TABLE changes already folded in)
-- ---------------------------------------------------------------------------

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID REFERENCES auth.users(id) PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  wallet_balance  DECIMAL(10,2) DEFAULT 0.00,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id          SERIAL PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id                SERIAL PRIMARY KEY,
  service_id        INTEGER UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  category          TEXT,
  type              TEXT,
  rate              DECIMAL(10,2) NOT NULL,
  cost_rate         DECIMAL(10,2),
  markup_percentage DECIMAL(5,2) DEFAULT 30.00,
  min_quantity      INTEGER NOT NULL,
  max_quantity      INTEGER NOT NULL,
  refill_allowed    BOOLEAN DEFAULT false,
  cancel_allowed    BOOLEAN DEFAULT false,
  is_hidden         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  order_id                UUID,  -- FK added after orders table created below
  amount                  DECIMAL(10,2) NOT NULL,
  currency                TEXT DEFAULT 'USD',
  payment_provider        TEXT NOT NULL,
  provider_transaction_id TEXT,
  status                  TEXT NOT NULL DEFAULT 'Pending'
                            CHECK (status IN ('Success', 'Failed', 'Pending')),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type           TEXT NOT NULL
                   CHECK (type IN ('deposit', 'withdrawal', 'order_payment', 'refund')),
  amount         DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after  DECIMAL(10,2) NOT NULL,
  payment_id     UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  order_id       UUID,  -- FK added after orders table
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id               UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  service_id            INTEGER REFERENCES public.services(id) ON DELETE RESTRICT,
  exosupplier_order_id  INTEGER,
  link                  TEXT NOT NULL,
  quantity              INTEGER NOT NULL,
  status                TEXT NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending','In Progress','Completed','Cancelled','Partial')),
  charge                DECIMAL(10,2) NOT NULL,
  currency              TEXT DEFAULT 'USD',
  start_count           INTEGER,
  remains               INTEGER,
  customer_charge       DECIMAL(10,2),
  api_cost              DECIMAL(10,2),
  profit                DECIMAL(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- back-fill forward references now that orders exists
DO $$ BEGIN
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- refills
CREATE TABLE IF NOT EXISTS public.refills (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id              UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  exosupplier_refill_id INTEGER,
  status                TEXT NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending','Completed','Rejected')),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('transaction', 'billing')),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB DEFAULT '{}'::jsonb,
  read       BOOLEAN DEFAULT false,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- virtual_numbers  (final schema with all provider / type changes applied)
CREATE TABLE IF NOT EXISTS public.virtual_numbers (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  phone_number            VARCHAR(20) UNIQUE NOT NULL,
  country_code            VARCHAR(50) NOT NULL,
  country_name            VARCHAR(50) NOT NULL,
  twilio_sid              VARCHAR(100) UNIQUE,              -- nullable (025)
  status                  VARCHAR(20) DEFAULT 'active'
                            CHECK (status IN ('active','suspended','cancelled','restricted')),
  capabilities            TEXT[] DEFAULT ARRAY['sms'],
  monthly_cost            DECIMAL(10,2) DEFAULT 5.00,       -- nullable (013)
  twilio_monthly_cost     DECIMAL(10,2) DEFAULT 1.00,
  purchased_at            TIMESTAMPTZ DEFAULT NOW(),
  expires_at              TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),  -- nullable (013)
  renewal_reminder_sent   BOOLEAN DEFAULT false,
  provider                VARCHAR(50) DEFAULT 'twilio'
                            CHECK (provider IN (
                              'hero-sms','5sim','textverified','smspva',
                              'smspool','grizzly','platfone'
                            )),
  fivsim_order_id         VARCHAR(100),
  operator                TEXT,
  number_type             VARCHAR(50) DEFAULT 'subscription'
                            CHECK (number_type IN (
                              'subscription','one_time_otp','activation','rental'
                            )),
  textverified_id         TEXT,
  rental_code             TEXT,
  product                 TEXT,
  product_code            TEXT,
  product_type            TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Alter nullable columns that started NOT NULL in the original schema
ALTER TABLE public.virtual_numbers ALTER COLUMN monthly_cost DROP NOT NULL;
ALTER TABLE public.virtual_numbers ALTER COLUMN expires_at   DROP NOT NULL;

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number_id         UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  direction         VARCHAR(10) CHECK (direction IN ('inbound','outbound')),
  from_number       VARCHAR(20),
  to_number         VARCHAR(20),
  body              TEXT,
  message_type      VARCHAR(20) DEFAULT 'sms',
  is_otp            BOOLEAN DEFAULT FALSE,
  otp_code          VARCHAR(10),
  otp_service       VARCHAR(50),
  twilio_message_sid VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- otp_codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number_id    UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  code         VARCHAR(10) NOT NULL,
  service_name VARCHAR(100),
  sender_number VARCHAR(20),
  status       VARCHAR(20) DEFAULT 'pending'
                 CHECK (status IN ('pending','used','expired')),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- twilio_charges
CREATE TABLE IF NOT EXISTS public.twilio_charges (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  virtual_number_id UUID REFERENCES public.virtual_numbers(id) ON DELETE SET NULL,
  charge_type       VARCHAR(50) NOT NULL,
  twilio_sid        VARCHAR(100),
  actual_cost       DECIMAL(10,4) NOT NULL,
  user_charged      DECIMAL(10,2) NOT NULL,
  profit            DECIMAL(10,2) GENERATED ALWAYS AS (user_charged - actual_cost) STORED,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- number_purchases
CREATE TABLE IF NOT EXISTS public.number_purchases (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  virtual_number_id     UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  amount                DECIMAL(10,2) NOT NULL,
  currency              VARCHAR(3) DEFAULT 'USD'
                          CHECK (currency IN ('USD','RUB','EUR','GBP','NGN')),
  status                VARCHAR(20) DEFAULT 'completed',
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  actual_cost           DECIMAL(10,4),
  profit                DECIMAL(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- esim_orders
CREATE TABLE IF NOT EXISTS public.esim_orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  package_code    TEXT NOT NULL,
  package_name    TEXT NOT NULL,
  location        TEXT NOT NULL,
  duration        TEXT NOT NULL,
  data_volume     TEXT NOT NULL,
  order_no        TEXT,
  esim_tran_no    TEXT,
  iccid           TEXT,
  qr_code_url     TEXT,
  ac              TEXT,
  smdp_address    TEXT,
  transaction_id  TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  esim_status     TEXT,
  smdp_status     TEXT,
  provider_cost   NUMERIC(10,4) NOT NULL,
  charged_amount  NUMERIC(10,4) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_user_id              ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status               ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_exosupplier_order_id ON public.orders(exosupplier_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_profit               ON public.orders(profit);
CREATE INDEX IF NOT EXISTS idx_orders_customer_charge      ON public.orders(customer_charge);

CREATE INDEX IF NOT EXISTS idx_refills_order_id            ON public.refills(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id            ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id           ON public.payments(order_id);

CREATE INDEX IF NOT EXISTS idx_services_category           ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_hidden          ON public.services(is_hidden);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id    ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type       ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read         ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at   ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type         ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read    ON public.notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_virtual_numbers_user_id         ON public.virtual_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_status          ON public.virtual_numbers(status);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_phone_number    ON public.virtual_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_twilio_sid      ON public.virtual_numbers(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_expires_at      ON public.virtual_numbers(expires_at);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_status_expires  ON public.virtual_numbers(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_number_type     ON public.virtual_numbers(number_type);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_provider        ON public.virtual_numbers(provider);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_fivsim_order_id ON public.virtual_numbers(fivsim_order_id)
  WHERE fivsim_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_provider_type   ON public.virtual_numbers(provider, number_type, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_messages_number_id    ON public.messages(number_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_otp       ON public.messages(is_otp) WHERE is_otp = TRUE;

CREATE INDEX IF NOT EXISTS idx_otp_codes_number_id_status ON public.otp_codes(number_id, status);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at       ON public.otp_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_codes_status           ON public.otp_codes(status);

CREATE INDEX IF NOT EXISTS idx_twilio_charges_user_id           ON public.twilio_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_twilio_charges_virtual_number_id ON public.twilio_charges(virtual_number_id);
CREATE INDEX IF NOT EXISTS idx_twilio_charges_created_at        ON public.twilio_charges(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_number_purchases_user_id           ON public.number_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_number_purchases_virtual_number_id ON public.number_purchases(virtual_number_id);
CREATE INDEX IF NOT EXISTS idx_number_purchases_profit            ON public.number_purchases(profit);
CREATE INDEX IF NOT EXISTS idx_number_purchases_actual_cost       ON public.number_purchases(actual_cost);

CREATE INDEX IF NOT EXISTS esim_orders_user_id_idx      ON public.esim_orders(user_id);
CREATE INDEX IF NOT EXISTS esim_orders_order_no_idx     ON public.esim_orders(order_no);
CREATE INDEX IF NOT EXISTS esim_orders_esim_tran_no_idx ON public.esim_orders(esim_tran_no);
CREATE INDEX IF NOT EXISTS esim_orders_iccid_idx        ON public.esim_orders(iccid);

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_numbers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_charges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esim_orders         ENABLE ROW LEVEL SECURITY;

-- Helper macro: ignore "policy already exists" errors
-- users
DO $$ BEGIN CREATE POLICY "Users can view their own profile"   ON public.users FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- services
DO $$ BEGIN CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- orders
DO $$ BEGIN CREATE POLICY "Users can view their own orders"   ON public.orders FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- refills
DO $$ BEGIN
  CREATE POLICY "Users can view refills for their orders" ON public.refills FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = refills.order_id AND orders.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create refills for their orders" ON public.refills FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = refills.order_id AND orders.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payments
DO $$ BEGIN CREATE POLICY "Users can view their own payments"   ON public.payments FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- admin_settings
DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage admin settings" ON public.admin_settings FOR ALL
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- wallet_transactions
DO $$ BEGIN CREATE POLICY "Users can view their own wallet transactions"   ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert their own wallet transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- notifications
DO $$ BEGIN CREATE POLICY "Users can view their own notifications"   ON public.notifications FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System can insert notifications"         ON public.notifications FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- virtual_numbers
DO $$ BEGIN CREATE POLICY "Users can view their own virtual numbers"   ON public.virtual_numbers FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert their own virtual numbers" ON public.virtual_numbers FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update their own virtual numbers" ON public.virtual_numbers FOR UPDATE USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- messages
DO $$ BEGIN
  CREATE POLICY "Users can view messages for their numbers" ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.virtual_numbers WHERE virtual_numbers.id = messages.number_id AND virtual_numbers.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System can insert messages" ON public.messages FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- otp_codes
DO $$ BEGIN
  CREATE POLICY "Users can view OTPs for their numbers" ON public.otp_codes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.virtual_numbers WHERE virtual_numbers.id = otp_codes.number_id AND virtual_numbers.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own OTPs" ON public.otp_codes FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.virtual_numbers WHERE virtual_numbers.id = otp_codes.number_id AND virtual_numbers.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System can insert OTPs" ON public.otp_codes FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- twilio_charges
DO $$ BEGIN CREATE POLICY "Users can view their own twilio charges" ON public.twilio_charges FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System can insert twilio charges"        ON public.twilio_charges FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- number_purchases
DO $$ BEGIN CREATE POLICY "Users can view their own number purchases"   ON public.number_purchases FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert their own number purchases" ON public.number_purchases FOR INSERT WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- esim_orders
DO $$ BEGIN CREATE POLICY "Users can view own esim_orders"      ON public.esim_orders FOR SELECT USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Service role can manage esim_orders" ON public.esim_orders FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 6. TRIGGERS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_virtual_numbers_updated_at
    BEFORE UPDATE ON public.virtual_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_esim_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER esim_orders_updated_at
    BEFORE UPDATE ON public.esim_orders
    FOR EACH ROW EXECUTE FUNCTION update_esim_orders_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 7. UTILITY FUNCTION
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_customer_price(
  p_cost_rate        DECIMAL,
  p_markup_percentage DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN p_cost_rate * (1 + p_markup_percentage / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- 8. SEED DATA  (admin_settings defaults)
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('usd_to_ngn_rate',                '1400',       'USD to NGN exchange rate applied to social boosting service prices'),
  ('default_markup_percentage',      '30.00',      'Default profit markup percentage for all services'),
  ('phone_numbers_markup_percentage', '50',         'Markup % added on top of SMSPool API cost. 50 = users pay 1.5× the API price.'),
  ('one_time_otp_pricing_type',       'percentage', 'Pricing type for one-time OTP numbers: "percentage" or "fixed"'),
  ('one_time_otp_pricing_percentage', '20.00',      'Percentage of monthly cost for one-time OTP numbers (e.g., 20.00 = 20%)'),
  ('one_time_otp_pricing_fixed',      '1.00',       'Fixed price in USD for one-time OTP numbers (used when pricing_type is "fixed")'),
  ('twilio_bundle_sid_GB',            'AD7d556b57d32d8d2cbbca2a388187fbf0', 'Twilio Address SID for United Kingdom (GB)')
ON CONFLICT (key) DO NOTHING;
