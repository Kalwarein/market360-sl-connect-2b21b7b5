-- =============================================
-- FINANCE PLATFORM DATABASE ENHANCEMENTS
-- =============================================

-- 1. Add fraud detection flags to wallet-related tables
ALTER TABLE public.wallet_ledger 
ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_flags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 2. Create fraud alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL, -- 'rapid_deposits', 'rapid_withdrawals', 'deposit_withdrawal_abuse', 'duplicate_phone', 'failed_attempts'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'dismissed'
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create platform analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  metric_type text NOT NULL, -- 'deposits', 'withdrawals', 'perks_revenue', 'active_users', 'new_users'
  metric_value numeric NOT NULL DEFAULT 0,
  metric_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint for daily metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_analytics_daily 
ON public.platform_analytics(metric_date, metric_type);

-- 4. Create admin notes table for user wallets
CREATE TABLE IF NOT EXISTS public.wallet_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  note_type text NOT NULL DEFAULT 'general', -- 'general', 'fraud', 'support', 'action'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create finance admin activity log
CREATE TABLE IF NOT EXISTS public.finance_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_type text, -- 'wallet', 'transaction', 'freeze', 'fraud_alert'
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS on new tables
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_activity_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for fraud_alerts
CREATE POLICY "Admins can view all fraud alerts" ON public.fraud_alerts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert fraud alerts" ON public.fraud_alerts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update fraud alerts" ON public.fraud_alerts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS Policies for platform_analytics
CREATE POLICY "Admins can view platform analytics" ON public.platform_analytics
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert platform analytics" ON public.platform_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update platform analytics" ON public.platform_analytics
  FOR UPDATE USING (true);

-- 9. RLS Policies for wallet_admin_notes
CREATE POLICY "Admins can view wallet notes" ON public.wallet_admin_notes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert wallet notes" ON public.wallet_admin_notes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 10. RLS Policies for finance_activity_log
CREATE POLICY "Admins can view finance activity" ON public.finance_activity_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert finance activity" ON public.finance_activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 11. Function to calculate platform totals
CREATE OR REPLACE FUNCTION public.get_platform_wallet_totals()
RETURNS TABLE (
  total_balance numeric,
  total_deposits numeric,
  total_withdrawals numeric,
  total_earnings numeric,
  total_perks_revenue numeric,
  pending_amount numeric,
  frozen_wallets_count integer,
  flagged_users_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN transaction_type IN ('deposit', 'refund', 'earning') AND status = 'success' THEN amount
          WHEN transaction_type IN ('withdrawal', 'payment') AND status = 'success' THEN -amount
          ELSE 0
        END
      ) FROM wallet_ledger
    ), 0) as total_balance,
    COALESCE((SELECT SUM(amount) FROM wallet_ledger WHERE transaction_type = 'deposit' AND status = 'success'), 0) as total_deposits,
    COALESCE((SELECT SUM(amount) FROM wallet_ledger WHERE transaction_type = 'withdrawal' AND status = 'success'), 0) as total_withdrawals,
    COALESCE((SELECT SUM(amount) FROM wallet_ledger WHERE transaction_type = 'earning' AND status = 'success'), 0) as total_earnings,
    COALESCE((SELECT SUM(price_paid) FROM store_perks), 0) as total_perks_revenue,
    COALESCE((SELECT SUM(amount) FROM wallet_ledger WHERE status = 'pending'), 0) as pending_amount,
    (SELECT COUNT(DISTINCT user_id)::integer FROM wallet_freezes WHERE is_active = true) as frozen_wallets_count,
    (SELECT COUNT(DISTINCT user_id)::integer FROM fraud_alerts WHERE status = 'open') as flagged_users_count
$$;

-- 12. Function to get daily transaction volume
CREATE OR REPLACE FUNCTION public.get_daily_transaction_volume(days_back integer DEFAULT 30)
RETURNS TABLE (
  tx_date date,
  deposits numeric,
  withdrawals numeric,
  net_flow numeric,
  tx_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(created_at) as tx_date,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit' AND status = 'success' THEN amount ELSE 0 END), 0) as deposits,
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' AND status = 'success' THEN amount ELSE 0 END), 0) as withdrawals,
    COALESCE(SUM(CASE 
      WHEN transaction_type IN ('deposit', 'refund', 'earning') AND status = 'success' THEN amount
      WHEN transaction_type IN ('withdrawal', 'payment') AND status = 'success' THEN -amount
      ELSE 0
    END), 0) as net_flow,
    COUNT(*)::integer as tx_count
  FROM wallet_ledger
  WHERE created_at >= CURRENT_DATE - days_back
  GROUP BY DATE(created_at)
  ORDER BY tx_date DESC
$$;

-- 13. Function to detect fraud patterns
CREATE OR REPLACE FUNCTION public.detect_fraud_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Pattern 1: Rapid deposits (5+ deposits in 1 hour)
  FOR r IN 
    SELECT user_id, COUNT(*) as cnt
    FROM wallet_ledger
    WHERE transaction_type = 'deposit'
      AND created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, description, metadata)
    VALUES (
      r.user_id, 
      'rapid_deposits', 
      'high',
      'User made ' || r.cnt || ' deposits in the last hour',
      jsonb_build_object('count', r.cnt, 'period', '1 hour')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Pattern 2: Rapid withdrawals (5+ withdrawals in 1 hour)
  FOR r IN 
    SELECT user_id, COUNT(*) as cnt
    FROM wallet_ledger
    WHERE transaction_type = 'withdrawal'
      AND created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, description, metadata)
    VALUES (
      r.user_id,
      'rapid_withdrawals',
      'high', 
      'User made ' || r.cnt || ' withdrawals in the last hour',
      jsonb_build_object('count', r.cnt, 'period', '1 hour')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Pattern 3: Deposit-withdrawal abuse (deposit and withdraw within 10 minutes)
  FOR r IN
    SELECT DISTINCT d.user_id
    FROM wallet_ledger d
    INNER JOIN wallet_ledger w ON d.user_id = w.user_id
    WHERE d.transaction_type = 'deposit' 
      AND d.status = 'success'
      AND w.transaction_type = 'withdrawal'
      AND w.created_at BETWEEN d.created_at AND d.created_at + INTERVAL '10 minutes'
      AND d.created_at >= NOW() - INTERVAL '24 hours'
  LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, description, metadata)
    VALUES (
      r.user_id,
      'deposit_withdrawal_abuse',
      'critical',
      'User deposits and withdraws within 10 minutes',
      jsonb_build_object('pattern', 'rapid_cashout')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Pattern 4: Multiple failed USSD attempts (5+ in 24 hours)
  FOR r IN
    SELECT user_id, COUNT(*) as cnt
    FROM wallet_ledger
    WHERE status = 'failed'
      AND created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  LOOP
    INSERT INTO fraud_alerts (user_id, alert_type, severity, description, metadata)
    VALUES (
      r.user_id,
      'failed_attempts',
      'medium',
      'User has ' || r.cnt || ' failed transactions in 24 hours',
      jsonb_build_object('count', r.cnt, 'period', '24 hours')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 14. Add updated_at trigger for fraud_alerts
CREATE TRIGGER update_fraud_alerts_updated_at
BEFORE UPDATE ON public.fraud_alerts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();