-- Atomic checkout: create orders + deduct wallet in one transaction

-- 1) Track a checkout batch across multiple order rows
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_batch_ref text;

CREATE INDEX IF NOT EXISTS orders_buyer_batch_ref_idx
ON public.orders (buyer_id, order_batch_ref);

-- 2) Enforce idempotency for checkout wallet deductions (does not affect other payment references)
CREATE UNIQUE INDEX IF NOT EXISTS wallet_ledger_checkout_payment_unique
ON public.wallet_ledger (user_id, reference)
WHERE transaction_type = 'payment' AND reference LIKE 'checkout:%';

-- 3) Atomic order placement (security definer, uses auth.uid() validation)
CREATE OR REPLACE FUNCTION public.place_order_batch(
  p_buyer_id uuid,
  p_idempotency_key text,
  p_items jsonb,
  p_delivery_name text,
  p_delivery_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_region text,
  p_shipping_country text,
  p_delivery_notes text
)
RETURNS TABLE(order_ids uuid[], total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count int;
  v_total_amount numeric := 0;
  v_total_cents int := 0;
  v_payment_reference text;
  v_balance_cents int;
  v_order_ids uuid[] := ARRAY[]::uuid[];
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric;
  v_store_id uuid;
  v_seller_id uuid;
  v_line_total numeric;
  v_order_id uuid;
BEGIN
  -- Auth: caller must match buyer
  IF auth.uid() IS NULL OR auth.uid() <> p_buyer_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid idempotency key';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no items';
  END IF;

  v_payment_reference := format('checkout:%s:%s', p_buyer_id::text, p_idempotency_key);

  -- Idempotency: if this batch already created orders, return them (and ensure payment exists)
  SELECT count(*)
    INTO v_existing_count
  FROM public.orders
  WHERE buyer_id = p_buyer_id
    AND order_batch_ref = p_idempotency_key;

  IF v_existing_count > 0 THEN
    SELECT array_agg(id ORDER BY created_at), COALESCE(sum(total_amount), 0)
      INTO v_order_ids, v_total_amount
    FROM public.orders
    WHERE buyer_id = p_buyer_id
      AND order_batch_ref = p_idempotency_key;

    IF NOT EXISTS (
      SELECT 1
      FROM public.wallet_ledger
      WHERE user_id = p_buyer_id
        AND transaction_type = 'payment'
        AND status = 'success'
        AND reference = v_payment_reference
    ) THEN
      RAISE EXCEPTION 'orders exist but payment missing; contact support';
    END IF;

    order_ids := v_order_ids;
    total_amount := v_total_amount;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Compute totals and validate products/stores before any inserts
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::int, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'invalid quantity';
    END IF;

    SELECT p.price, p.store_id
      INTO v_price, v_store_id
    FROM public.products p
    WHERE p.id = v_product_id;

    IF v_price IS NULL OR v_store_id IS NULL THEN
      RAISE EXCEPTION 'product not available: %', v_product_id;
    END IF;

    SELECT s.owner_id
      INTO v_seller_id
    FROM public.stores s
    WHERE s.id = v_store_id;

    IF v_seller_id IS NULL THEN
      RAISE EXCEPTION 'store not available: %', v_store_id;
    END IF;

    v_line_total := v_price * v_qty;
    v_total_amount := v_total_amount + v_line_total;
  END LOOP;

  v_total_cents := round(v_total_amount * 100)::int;

  -- Balance check (ledger is the source of truth)
  v_balance_cents := public.get_wallet_balance(p_buyer_id);
  IF v_balance_cents < v_total_cents THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  -- Insert orders (one per item)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::int, 0);

    SELECT p.price, p.store_id
      INTO v_price, v_store_id
    FROM public.products p
    WHERE p.id = v_product_id;

    SELECT s.owner_id
      INTO v_seller_id
    FROM public.stores s
    WHERE s.id = v_store_id;

    v_line_total := v_price * v_qty;

    INSERT INTO public.orders (
      buyer_id,
      seller_id,
      product_id,
      quantity,
      total_amount,
      escrow_status,
      escrow_amount,
      order_batch_ref,
      delivery_name,
      delivery_phone,
      shipping_address,
      shipping_city,
      shipping_region,
      shipping_country,
      delivery_notes,
      status
    ) VALUES (
      p_buyer_id,
      v_seller_id,
      v_product_id,
      v_qty,
      v_line_total,
      'holding',
      v_line_total,
      p_idempotency_key,
      p_delivery_name,
      p_delivery_phone,
      p_shipping_address,
      p_shipping_city,
      p_shipping_region,
      p_shipping_country,
      p_delivery_notes,
      'pending'
    )
    RETURNING id INTO v_order_id;

    v_order_ids := array_append(v_order_ids, v_order_id);
  END LOOP;

  -- Insert wallet deduction (unique index enforces idempotency)
  INSERT INTO public.wallet_ledger (
    user_id,
    transaction_type,
    amount,
    status,
    reference,
    metadata
  ) VALUES (
    p_buyer_id,
    'payment',
    v_total_cents,
    'success',
    v_payment_reference,
    jsonb_build_object(
      'payment_method', 'wallet',
      'order_batch_ref', p_idempotency_key,
      'order_ids', v_order_ids,
      'total_sle', v_total_amount
    )
  );

  order_ids := v_order_ids;
  total_amount := v_total_amount;
  RETURN NEXT;
END;
$$;