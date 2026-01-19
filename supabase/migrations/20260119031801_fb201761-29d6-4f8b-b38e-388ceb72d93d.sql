-- Fix place_order_batch to use whole Leones (not cents) and simplify the flow
-- The function is SECURITY DEFINER owned by postgres, so it bypasses RLS
-- But we also fix the amount handling to be consistent

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
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_count int;
  v_total_amount numeric := 0;
  v_payment_reference text;
  v_balance int;
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

  -- Idempotency: if this batch already created orders, return them
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

    -- Check payment exists for idempotency
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

  -- Compute totals and validate products/stores
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

  -- Balance check: get_wallet_balance returns INTEGER in whole Leones
  -- v_total_amount is in whole Leones (from product prices)
  v_balance := public.get_wallet_balance(p_buyer_id);
  IF v_balance < v_total_amount THEN
    RAISE EXCEPTION 'insufficient balance: have % need %', v_balance, v_total_amount;
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

  -- INSTANT wallet deduction: amount in whole Leones, status = success
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
    v_total_amount,  -- Store in whole Leones (same as deposits/refunds)
    'success',       -- Instant deduction, not pending
    v_payment_reference,
    jsonb_build_object(
      'payment_method', 'wallet',
      'order_batch_ref', p_idempotency_key,
      'order_ids', v_order_ids,
      'total_leones', v_total_amount
    )
  );

  order_ids := v_order_ids;
  total_amount := v_total_amount;
  RETURN NEXT;
END;
$function$;