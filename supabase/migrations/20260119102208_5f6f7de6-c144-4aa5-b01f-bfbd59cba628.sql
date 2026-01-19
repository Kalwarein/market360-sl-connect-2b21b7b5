-- ========================================
-- COMPREHENSIVE PAYMENT SYSTEM CLEANUP
-- ========================================

-- 1. Fix any pending payment entries that should be success
-- (payments are atomic - if order exists, payment succeeded)
UPDATE wallet_ledger
SET status = 'success'
WHERE transaction_type = 'payment'
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE wallet_ledger.reference LIKE '%' || o.order_batch_ref || '%'
    AND o.escrow_status = 'holding'
  );

-- 2. Clean up the wallet_ledger RLS policy to ensure proper access
-- Drop existing INSERT policy and recreate with correct permissions
DROP POLICY IF EXISTS "Users can create own ledger entries" ON wallet_ledger;

-- Create a more permissive policy for payments that is enforced via the RPC
-- The place_order_batch function runs as SECURITY DEFINER so it bypasses RLS
-- But we need policies for edge functions using service role (which also bypass RLS)
-- And for direct user inserts for pending deposits/withdrawals

CREATE POLICY "Users can create own ledger entries"
ON wallet_ledger FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND amount > 0
  AND (
    -- Allow pending deposits and withdrawals (Monime flow)
    (status = 'pending' AND transaction_type IN ('deposit', 'withdrawal'))
    -- Allow payment with success status (checkout flow via RPC uses SECURITY DEFINER)
    OR (status = 'success' AND transaction_type = 'payment')
  )
);

-- 3. Create a function to validate escrow consistency
-- This ensures no order exists without corresponding wallet deduction
CREATE OR REPLACE FUNCTION public.validate_order_escrow_consistency()
RETURNS TABLE(
  order_id uuid,
  issue text,
  order_amount numeric,
  ledger_amount integer,
  escrow_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Find orders with escrow_status='holding' but no corresponding payment
  SELECT 
    o.id as order_id,
    'Missing payment ledger entry' as issue,
    o.total_amount as order_amount,
    NULL::integer as ledger_amount,
    o.escrow_status
  FROM orders o
  WHERE o.escrow_status = 'holding'
    AND o.order_batch_ref IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM wallet_ledger wl
      WHERE wl.reference LIKE '%' || o.order_batch_ref || '%'
        AND wl.transaction_type = 'payment'
        AND wl.status = 'success'
    )
  
  UNION ALL
  
  -- Find orders with unit mismatch (legacy issue)
  SELECT 
    o.id as order_id,
    'Unit mismatch between order and ledger' as issue,
    o.total_amount as order_amount,
    wl.amount as ledger_amount,
    o.escrow_status
  FROM orders o
  JOIN wallet_ledger wl ON wl.reference LIKE '%' || o.order_batch_ref || '%'
    AND wl.transaction_type = 'payment'
  WHERE o.order_batch_ref IS NOT NULL
    AND ABS(o.total_amount - wl.amount) > 1  -- More than 1 unit difference
$$;

-- 4. Ensure the get_wallet_balance function handles all transaction types correctly
-- This is already correct but let's verify by recreating it
DROP FUNCTION IF EXISTS public.get_wallet_balance(uuid);

CREATE FUNCTION public.get_wallet_balance(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        -- Credits: deposits, refunds, and earnings add to balance
        WHEN transaction_type IN ('deposit', 'refund', 'earning') AND status = 'success' THEN amount
        -- Debits: withdrawals and payments subtract from balance
        WHEN transaction_type IN ('withdrawal', 'payment') AND status = 'success' THEN -amount
        ELSE 0
      END
    ),
    0
  )::INTEGER
  FROM public.wallet_ledger
  WHERE user_id = p_user_id
$$;

-- 5. Add a check constraint on wallet_ledger to enforce whole Leones
-- (amounts must be positive integers, no decimals)
ALTER TABLE wallet_ledger 
DROP CONSTRAINT IF EXISTS wallet_ledger_amount_check;

ALTER TABLE wallet_ledger
ADD CONSTRAINT wallet_ledger_amount_positive CHECK (amount > 0);

-- 6. Create an index for faster order-payment lookups
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reference_pattern 
ON wallet_ledger (reference text_pattern_ops);

-- 7. Add a trigger to ensure escrow_amount matches total_amount on orders
CREATE OR REPLACE FUNCTION public.sync_escrow_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On insert, set escrow_amount to match total_amount
  IF TG_OP = 'INSERT' THEN
    NEW.escrow_amount := NEW.total_amount;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_escrow_amount ON orders;
CREATE TRIGGER trigger_sync_escrow_amount
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_escrow_amount();

-- 8. Update handle_new_user to NOT create legacy wallet entry
-- (wallet_ledger is the sole source of truth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, name, notification_preferences)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    jsonb_build_object(
      'orders', true,
      'updates', true,
      'messages', true,
      'promotions', false,
      'email_notifications', true
    )
  );
  
  -- NOTE: We no longer create a wallet entry in the legacy wallets table
  -- The wallet_ledger table is the sole source of truth for balances
  -- Balance is computed by get_wallet_balance() RPC from ledger entries
  
  -- Assign default buyer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  RETURN NEW;
END;
$$;