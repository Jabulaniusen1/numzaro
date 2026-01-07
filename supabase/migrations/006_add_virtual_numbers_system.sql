-- Migration: Add Virtual Numbers System
-- Creates tables for phone numbers, SMS messages, call logs, OTP sessions, and subscriptions

-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'telnyx',
  country TEXT NOT NULL,
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('long_term', 'otp', 'business')),
  capabilities TEXT NOT NULL CHECK (capabilities IN ('sms', 'voice', 'sms+voice')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'expired')),
  purchase_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monthly_cost DECIMAL(10, 2) DEFAULT NULL, -- NULL for OTP numbers
  renewal_date TIMESTAMPTZ, -- NULL for OTP numbers
  provider_number_id TEXT, -- Provider's internal ID for this number
  forwarding_number TEXT, -- For business numbers with call forwarding
  voicemail_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sms_messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  provider_message_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT,
  to_number TEXT,
  duration INTEGER, -- Duration in seconds
  recording_url TEXT,
  status TEXT, -- e.g., 'completed', 'failed', 'busy'
  provider_call_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create otp_sessions table
CREATE TABLE IF NOT EXISTS public.otp_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT, -- Name of service requesting OTP (e.g., "WhatsApp", "Telegram")
  sms_message TEXT, -- The OTP message received
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create number_subscriptions table (for renewal tracking)
CREATE TABLE IF NOT EXISTS public.number_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  next_charge_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'failed', 'cancelled', 'grace_period')),
  provider_subscription_id TEXT, -- Provider's subscription ID if available
  failed_attempts INTEGER DEFAULT 0,
  last_charge_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON public.phone_numbers(number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON public.phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_type ON public.phone_numbers(type);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_renewal_date ON public.phone_numbers(renewal_date);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_country ON public.phone_numbers(country);

CREATE INDEX IF NOT EXISTS idx_sms_messages_number_id ON public.sms_messages(number_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON public.sms_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON public.sms_messages(direction);

CREATE INDEX IF NOT EXISTS idx_call_logs_number_id ON public.call_logs(number_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON public.call_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON public.call_logs(direction);

CREATE INDEX IF NOT EXISTS idx_otp_sessions_number_id ON public.otp_sessions(number_id);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_used ON public.otp_sessions(used);

CREATE INDEX IF NOT EXISTS idx_number_subscriptions_number_id ON public.number_subscriptions(number_id);
CREATE INDEX IF NOT EXISTS idx_number_subscriptions_user_id ON public.number_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_number_subscriptions_next_charge_date ON public.number_subscriptions(next_charge_date);
CREATE INDEX IF NOT EXISTS idx_number_subscriptions_status ON public.number_subscriptions(status);

-- Enable Row Level Security
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_numbers table
CREATE POLICY "Users can view their own phone numbers"
  ON public.phone_numbers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone numbers"
  ON public.phone_numbers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone numbers"
  ON public.phone_numbers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phone numbers"
  ON public.phone_numbers FOR DELETE
  USING (auth.uid() = user_id);

-- Note: Admin access is handled at the application layer using ADMIN_EMAILS env variable
-- RLS policies only enforce user-level access control

-- RLS Policies for sms_messages table
CREATE POLICY "Users can view SMS for their numbers"
  ON public.sms_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.phone_numbers
      WHERE phone_numbers.id = sms_messages.number_id
      AND phone_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert SMS messages"
  ON public.sms_messages FOR INSERT
  WITH CHECK (true); -- Webhook handlers will use service role key

-- Note: Admin access is handled at the application layer

-- RLS Policies for call_logs table
CREATE POLICY "Users can view call logs for their numbers"
  ON public.call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.phone_numbers
      WHERE phone_numbers.id = call_logs.number_id
      AND phone_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (true); -- Webhook handlers will use service role key

-- Note: Admin access is handled at the application layer

-- RLS Policies for otp_sessions table
CREATE POLICY "Users can view OTP sessions for their numbers"
  ON public.otp_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.phone_numbers
      WHERE phone_numbers.id = otp_sessions.number_id
      AND phone_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their OTP sessions"
  ON public.otp_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.phone_numbers
      WHERE phone_numbers.id = otp_sessions.number_id
      AND phone_numbers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert OTP sessions"
  ON public.otp_sessions FOR INSERT
  WITH CHECK (true); -- Webhook handlers will use service role key

-- RLS Policies for number_subscriptions table
CREATE POLICY "Users can view their own subscriptions"
  ON public.number_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.number_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
  ON public.number_subscriptions FOR INSERT
  WITH CHECK (true); -- System inserts during purchase

-- Note: Admin access is handled at the application layer

-- Trigger to automatically update updated_at timestamp for phone_numbers
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at timestamp for number_subscriptions
CREATE TRIGGER update_number_subscriptions_updated_at
  BEFORE UPDATE ON public.number_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint on number + provider (a number from a provider should only exist once)
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_numbers_provider_number 
  ON public.phone_numbers(provider, number);

-- Add unique constraint: one active subscription per number
CREATE UNIQUE INDEX IF NOT EXISTS idx_number_subscriptions_active_number 
  ON public.number_subscriptions(number_id) 
  WHERE status IN ('active', 'grace_period');

