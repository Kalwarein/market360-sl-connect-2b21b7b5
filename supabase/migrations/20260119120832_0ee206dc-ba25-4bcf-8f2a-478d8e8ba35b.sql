-- One-time cleanup: Normalize wallet_ledger amounts from Monime cents to NLE
-- This targets historical Monime-linked deposits/withdrawals where amounts appear inflated (>=100 and monime_id is set)

-- Step 1: Update deposit entries that appear to be in cents (amount >= 100 with monime_id)
-- These were stored before the fix that now correctly stores in whole Leones
UPDATE wallet_ledger
SET 
  amount = ROUND(amount / 100),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cents_to_nle_normalized', true,
    'original_cents_value', amount,
    'normalized_at', now()::text
  )
WHERE monime_id IS NOT NULL
  AND transaction_type = 'deposit'
  AND amount >= 100
  AND (metadata IS NULL OR NOT (metadata ? 'cents_to_nle_normalized'));

-- Step 2: Update withdrawal entries that appear to be in cents
UPDATE wallet_ledger
SET 
  amount = ROUND(amount / 100),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cents_to_nle_normalized', true,
    'original_cents_value', amount,
    'normalized_at', now()::text
  )
WHERE monime_id IS NOT NULL
  AND transaction_type = 'withdrawal'
  AND amount >= 100
  AND (metadata IS NULL OR NOT (metadata ? 'cents_to_nle_normalized'));

-- Step 3: Also normalize refund entries that look like they came from cents-based orders
-- (amounts >= 100 that don't have checkout references)
UPDATE wallet_ledger
SET 
  amount = ROUND(amount / 100),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'cents_to_nle_normalized', true,
    'original_cents_value', amount,
    'normalized_at', now()::text
  )
WHERE transaction_type = 'refund'
  AND amount >= 100
  AND reference NOT LIKE 'checkout:%'
  AND (metadata IS NULL OR NOT (metadata ? 'cents_to_nle_normalized'));