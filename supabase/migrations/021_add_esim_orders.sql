-- eSIM orders table for eSIM Access integration
CREATE TABLE IF NOT EXISTS esim_orders (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Package info
  package_code    text NOT NULL,
  package_name    text NOT NULL,
  location        text NOT NULL,
  duration        text NOT NULL,     -- e.g. "30 DAY"
  data_volume     text NOT NULL,     -- e.g. "1.0 GB"

  -- Provider identifiers
  order_no        text,              -- eSIM Access orderNo (e.g. B23072016497499)
  esim_tran_no    text,              -- eSIM Access esimTranNo
  iccid           text,
  qr_code_url     text,
  ac              text,              -- activation code
  smdp_address    text,
  transaction_id  text UNIQUE NOT NULL, -- our unique tx id sent to provider

  -- Status
  status          text DEFAULT 'pending' NOT NULL,
  -- pending | got_resource | in_use | used_up | used_expired | unused_expired | cancelled | failed
  esim_status     text,              -- raw status from eSIM Access
  smdp_status     text,

  -- Financials (all USD)
  provider_cost   numeric(10, 4) NOT NULL,  -- cost from eSIM Access
  charged_amount  numeric(10, 4) NOT NULL,  -- amount deducted from user wallet

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE esim_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own esim_orders"
  ON esim_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage esim_orders"
  ON esim_orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS esim_orders_user_id_idx   ON esim_orders (user_id);
CREATE INDEX IF NOT EXISTS esim_orders_order_no_idx   ON esim_orders (order_no);
CREATE INDEX IF NOT EXISTS esim_orders_esim_tran_no_idx ON esim_orders (esim_tran_no);
CREATE INDEX IF NOT EXISTS esim_orders_iccid_idx      ON esim_orders (iccid);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_esim_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER esim_orders_updated_at
  BEFORE UPDATE ON esim_orders
  FOR EACH ROW EXECUTE FUNCTION update_esim_orders_updated_at();
