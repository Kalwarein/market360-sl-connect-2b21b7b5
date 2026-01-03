-- =============================================
-- MONIME LEDGER-BASED WALLET SYSTEM
-- =============================================

-- 1. Create wallet_ledger table (core ledger for all wallet transactions)
CREATE TABLE public.wallet_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'earning')),
  amount INTEGER NOT NULL, -- Amount in minor units (cents/leones cents)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'reversed')),
  provider TEXT DEFAULT 'monime',
  reference TEXT UNIQUE, -- Unique reference for idempotency
  monime_id TEXT, -- Monime object ID (payment_code_id or payout_id)
  monime_ussd_code TEXT, -- USSD code for deposits
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_wallet_ledger_user_id ON public.wallet_ledger(user_id);
CREATE INDEX idx_wallet_ledger_reference ON public.wallet_ledger(reference);
CREATE INDEX idx_wallet_ledger_monime_id ON public.wallet_ledger(monime_id);
CREATE INDEX idx_wallet_ledger_status ON public.wallet_ledger(status);

-- 2. Create webhook_events table for idempotency and audit
CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE, -- Monime event ID for idempotency
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);

-- 3. Create wallet_freezes table for admin freeze/unfreeze functionality
CREATE TABLE public.wallet_freezes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frozen_by UUID NOT NULL,
  frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unfrozen_at TIMESTAMP WITH TIME ZONE,
  unfrozen_by UUID,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_wallet_freezes_active ON public.wallet_freezes(user_id) WHERE is_active = true;

-- 4. Enable RLS on new tables
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_freezes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for wallet_ledger
-- Users can view their own ledger entries
CREATE POLICY "Users can view their own ledger entries"
ON public.wallet_ledger
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert pending entries (for initiating transactions)
CREATE POLICY "Users can create their own pending ledger entries"
ON public.wallet_ledger
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Only service role (edge functions) can update ledger entries
-- No direct update policy for users - updates happen via edge functions

-- Admins can view all ledger entries
CREATE POLICY "Admins can view all ledger entries"
ON public.wallet_ledger
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. RLS Policies for webhook_events (only service role access, no user access)
-- No user policies - webhook_events is internal only

-- 7. RLS Policies for wallet_freezes
-- Users can view their own freeze status
CREATE POLICY "Users can view their own freeze status"
ON public.wallet_freezes
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all freezes
CREATE POLICY "Admins can view all freezes"
ON public.wallet_freezes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create freezes"
ON public.wallet_freezes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update freezes"
ON public.wallet_freezes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Function to calculate wallet balance from ledger
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN transaction_type IN ('deposit', 'refund', 'earning') AND status = 'success' THEN amount
        WHEN transaction_type IN ('withdrawal', 'payment') AND status = 'success' THEN -amount
        ELSE 0
      END
    ),
    0
  )::INTEGER
  FROM public.wallet_ledger
  WHERE user_id = p_user_id
$$;

-- 9. Function to check if wallet is frozen
CREATE OR REPLACE FUNCTION public.is_wallet_frozen(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wallet_freezes
    WHERE user_id = p_user_id AND is_active = true
  )
$$;

-- 10. Trigger to update updated_at on wallet_ledger
CREATE TRIGGER update_wallet_ledger_updated_at
BEFORE UPDATE ON public.wallet_ledger
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 11. Enable realtime for wallet_ledger so UI updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_ledger;