-- Migration: Add Virtual Numbers System
-- Creates tables for virtual numbers, messages, OTPs, charges, and purchases

-- 1. Virtual Numbers Table
CREATE TABLE IF NOT EXISTS public.virtual_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  country_name VARCHAR(50) NOT NULL,
  twilio_sid VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  capabilities TEXT[] DEFAULT ARRAY['sms'],
  monthly_cost DECIMAL(10,2) DEFAULT 5.00,
  twilio_monthly_cost DECIMAL(10,2) DEFAULT 1.00,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number_id UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  body TEXT,
  message_type VARCHAR(20) DEFAULT 'sms',
  is_otp BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(10),
  otp_service VARCHAR(50),
  twilio_message_sid VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OTP Codes Table (denormalized for faster queries)
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number_id UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(10) NOT NULL,
  service_name VARCHAR(100),
  sender_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Twilio Charges Table (track costs)
CREATE TABLE IF NOT EXISTS public.twilio_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  virtual_number_id UUID REFERENCES public.virtual_numbers(id) ON DELETE SET NULL,
  charge_type VARCHAR(50) NOT NULL,
  twilio_sid VARCHAR(100),
  actual_cost DECIMAL(10,4) NOT NULL,
  user_charged DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (user_charged - actual_cost) STORED,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Number Purchases Table (transactions)
CREATE TABLE IF NOT EXISTS public.number_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  virtual_number_id UUID REFERENCES public.virtual_numbers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'completed',
  wallet_transaction_id UUID REFERENCES public.wallet_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_user_id ON public.virtual_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_status ON public.virtual_numbers(status);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_phone_number ON public.virtual_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_twilio_sid ON public.virtual_numbers(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_messages_number_id ON public.messages(number_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_otp ON public.messages(is_otp) WHERE is_otp = TRUE;
CREATE INDEX IF NOT EXISTS idx_otp_codes_number_id_status ON public.otp_codes(number_id, status);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON public.otp_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_codes_status ON public.otp_codes(status);
CREATE INDEX IF NOT EXISTS idx_twilio_charges_user_id ON public.twilio_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_twilio_charges_virtual_number_id ON public.twilio_charges(virtual_number_id);
CREATE INDEX IF NOT EXISTS idx_twilio_charges_created_at ON public.twilio_charges(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_number_purchases_user_id ON public.number_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_number_purchases_virtual_number_id ON public.number_purchases(virtual_number_id);

-- Enable Row Level Security
ALTER TABLE public.virtual_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_numbers table
CREATE POLICY "Users can view their own virtual numbers"
  ON public.virtual_numbers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual numbers"
  ON public.virtual_numbers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own virtual numbers"
  ON public.virtual_numbers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages for their numbers"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_numbers
      WHERE virtual_numbers.id = messages.number_id
      AND virtual_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (true); -- Webhook handlers will use service role key

-- RLS Policies for otp_codes table
CREATE POLICY "Users can view OTPs for their numbers"
  ON public.otp_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_numbers
      WHERE virtual_numbers.id = otp_codes.number_id
      AND virtual_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own OTPs"
  ON public.otp_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_numbers
      WHERE virtual_numbers.id = otp_codes.number_id
      AND virtual_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert OTPs"
  ON public.otp_codes FOR INSERT
  WITH CHECK (true); -- Webhook handlers will use service role key

-- RLS Policies for twilio_charges table
CREATE POLICY "Users can view their own twilio charges"
  ON public.twilio_charges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert twilio charges"
  ON public.twilio_charges FOR INSERT
  WITH CHECK (true); -- System will use service role key

-- RLS Policies for number_purchases table
CREATE POLICY "Users can view their own number purchases"
  ON public.number_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own number purchases"
  ON public.number_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on virtual_numbers
CREATE TRIGGER update_virtual_numbers_updated_at
  BEFORE UPDATE ON public.virtual_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

