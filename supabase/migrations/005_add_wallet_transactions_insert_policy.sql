-- Add INSERT policy for wallet_transactions
-- Users need to be able to insert their own wallet transactions

CREATE POLICY "Users can insert their own wallet transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

