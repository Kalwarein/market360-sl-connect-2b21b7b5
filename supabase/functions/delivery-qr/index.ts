import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a cryptographically secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a 7-digit delivery code
function generateDeliveryCode(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const num = ((array[0] << 24) | (array[1] << 16) | (array[2] << 8) | array[3]) >>> 0;
  return (1000000 + (num % 9000000)).toString();
}

// Hash the delivery code for secure storage
async function hashCode(code: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt token with a simple HMAC for verification
async function encryptToken(orderId: string, buyerId: string, sellerId: string, timestamp: number): Promise<string> {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const data = `${orderId}:${buyerId}:${sellerId}:${timestamp}:${generateToken()}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureHex = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
  
  // Encode data + signature as base64
  const combined = `${data}:${signatureHex}`;
  return btoa(combined);
}

// Shared function to release escrow and complete order
async function releaseEscrow(supabase: any, order: any, qrId: string | null, verificationMethod: string) {
  console.log(`[delivery-qr] Releasing escrow via ${verificationMethod}...`);

  // Calculate amount after 2% platform fee
  const escrowAmount = Math.round(order.total_amount) || 0;
  const platformFee = Math.round(escrowAmount * 0.02);
  const amountToRelease = escrowAmount - platformFee;

  // Generate unique reference for idempotency
  const earningReference = `${verificationMethod}-escrow-release:${order.id}`;
  
  // Check if earning already exists (idempotency)
  const { data: existingEarning } = await supabase
    .from('wallet_ledger')
    .select('id')
    .eq('reference', earningReference)
    .single();

  if (existingEarning) {
    console.log('[delivery-qr] Earning already exists');
    return {
      success: true,
      amount_released: amountToRelease,
      fee_deducted: platformFee,
      already_processed: true
    };
  }

  // Update order status
  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({ 
      status: 'completed',
      escrow_status: 'released'
    })
    .eq('id', order.id);

  if (updateOrderError) {
    console.error('[delivery-qr] Failed to update order:', updateOrderError);
    throw updateOrderError;
  }

  // Add earning to seller's wallet_ledger
  const { error: ledgerError } = await supabase
    .from('wallet_ledger')
    .insert({
      user_id: order.seller_id,
      amount: amountToRelease,
      transaction_type: 'earning',
      status: 'success',
      reference: earningReference,
      metadata: { 
        order_id: order.id, 
        fee_deducted: platformFee,
        fee_percentage: 2,
        gross_amount: escrowAmount,
        product_title: order.products?.title,
        buyer_id: order.buyer_id,
        verified_via: verificationMethod
      }
    });

  if (ledgerError) {
    console.error('[delivery-qr] Ledger entry error:', ledgerError);
    
    // Rollback order status if ledger fails
    await supabase
      .from('orders')
      .update({ 
        status: 'delivered',
        escrow_status: 'holding'
      })
      .eq('id', order.id);
    
    throw ledgerError;
  }

  console.log('[delivery-qr] Seller earnings credited successfully');

  // Create notification for seller
  await supabase.from('notifications').insert({
    user_id: order.seller_id,
    type: 'order',
    title: 'Payment Released! 🎉',
    body: `Delivery verified for "${order.products?.title}". Le ${amountToRelease.toLocaleString()} added to your wallet.`,
    link_url: `/seller/order/${order.id}`,
    metadata: { order_id: order.id, amount: amountToRelease, fee: platformFee }
  });

  // Create notification for buyer
  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'order',
    title: 'Order Completed ✅',
    body: `Delivery confirmed for "${order.products?.title}". Thank you for shopping!`,
    link_url: `/order/${order.id}`,
    metadata: { order_id: order.id }
  });

  // Delete QR code if exists
  if (qrId) {
    await supabase
      .from('delivery_qr_codes')
      .delete()
      .eq('id', qrId);
  }

  return {
    success: true,
    amount_released: amountToRelease,
    fee_deducted: platformFee,
    order_id: order.id,
    product_title: order.products?.title
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, order_id, buyer_id, seller_id, token, code } = await req.json();

    // ===============================
    // ACTION: GENERATE QR CODE
    // ===============================
    if (action === 'generate') {
      if (!order_id || !buyer_id) {
        return new Response(
          JSON.stringify({ error: 'Missing order_id or buyer_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[delivery-qr] Generating QR for order: ${order_id}`);

      // Verify the order exists and belongs to buyer
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, buyer_id, seller_id, status, escrow_status')
        .eq('id', order_id)
        .eq('buyer_id', buyer_id)
        .single();

      if (orderError || !order) {
        console.error('[delivery-qr] Order not found:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Only allow QR generation for orders that are shipped/delivered and escrow is holding
      if (!['shipped', 'delivered'].includes(order.status)) {
        return new Response(
          JSON.stringify({ error: 'QR code can only be generated for shipped or delivered orders' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (order.escrow_status !== 'holding') {
        return new Response(
          JSON.stringify({ error: 'Order escrow already released or refunded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete existing QR code for this order (regeneration)
      await supabase
        .from('delivery_qr_codes')
        .delete()
        .eq('order_id', order_id);

      // Generate new encrypted token
      const timestamp = Date.now();
      const encryptedToken = await encryptToken(order_id, buyer_id, order.seller_id, timestamp);
      
      // QR expires in 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Insert new QR code
      const { data: qrCode, error: insertError } = await supabase
        .from('delivery_qr_codes')
        .insert({
          order_id,
          buyer_id,
          seller_id: order.seller_id,
          encrypted_token: encryptedToken,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[delivery-qr] Insert error:', insertError);
        throw insertError;
      }

      console.log(`[delivery-qr] QR generated successfully, expires at ${expiresAt.toISOString()}`);

      return new Response(
        JSON.stringify({
          success: true,
          qr_data: {
            id: qrCode.id,
            token: encryptedToken,
            expires_at: expiresAt.toISOString(),
            order_id
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===============================
    // ACTION: GENERATE DELIVERY CODE
    // ===============================
    if (action === 'generate_code') {
      if (!order_id || !buyer_id) {
        return new Response(
          JSON.stringify({ error: 'Missing order_id or buyer_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[delivery-qr] Generating delivery code for order: ${order_id}`);

      // Verify the order exists and belongs to buyer
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, buyer_id, seller_id, status, escrow_status')
        .eq('id', order_id)
        .eq('buyer_id', buyer_id)
        .single();

      if (orderError || !order) {
        console.error('[delivery-qr] Order not found:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Only allow code generation for orders that are shipped/delivered and escrow is holding
      if (!['shipped', 'delivered'].includes(order.status)) {
        return new Response(
          JSON.stringify({ error: 'Delivery code can only be generated for shipped or delivered orders' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (order.escrow_status !== 'holding') {
        return new Response(
          JSON.stringify({ error: 'Order escrow already released or refunded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete existing QR/code for this order (regeneration invalidates previous)
      await supabase
        .from('delivery_qr_codes')
        .delete()
        .eq('order_id', order_id);

      // Generate new 7-digit code
      const deliveryCode = generateDeliveryCode();
      const salt = order_id + order.seller_id;
      const hashedCode = await hashCode(deliveryCode, salt);
      
      // Code expires in 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Insert new delivery code (stored as hashed in encrypted_token field)
      const { data: qrCode, error: insertError } = await supabase
        .from('delivery_qr_codes')
        .insert({
          order_id,
          buyer_id,
          seller_id: order.seller_id,
          encrypted_token: `CODE:${hashedCode}`, // Prefix to distinguish from QR tokens
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[delivery-qr] Insert error:', insertError);
        throw insertError;
      }

      console.log(`[delivery-qr] Delivery code generated successfully, expires at ${expiresAt.toISOString()}`);

      return new Response(
        JSON.stringify({
          success: true,
          code_data: {
            id: qrCode.id,
            code: deliveryCode, // Return plain code to display to buyer
            expires_at: expiresAt.toISOString(),
            order_id
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===============================
    // ACTION: VALIDATE QR CODE (SCAN)
    // ===============================
    if (action === 'validate') {
      if (!token || !seller_id) {
        return new Response(
          JSON.stringify({ error: 'Missing token or seller_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[delivery-qr] Validating QR token for seller: ${seller_id}`);

      // Find the QR code by token
      const { data: qrCode, error: qrError } = await supabase
        .from('delivery_qr_codes')
        .select('*')
        .eq('encrypted_token', token)
        .single();

      // Log the scan attempt
      const logScan = async (result: string, errorMessage?: string, qrId?: string, orderId?: string) => {
        await supabase.from('qr_scan_logs').insert({
          qr_id: qrId,
          order_id: orderId || 'unknown',
          seller_id,
          scan_result: result,
          error_message: errorMessage,
          metadata: { token_prefix: token.substring(0, 20), method: 'qr_scan' }
        });
      };

      if (qrError || !qrCode) {
        console.error('[delivery-qr] QR not found');
        await logScan('not_found', 'QR code not found in database');
        return new Response(
          JSON.stringify({ error: 'Invalid QR code', code: 'NOT_FOUND' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already scanned
      if (qrCode.status === 'scanned') {
        console.error('[delivery-qr] QR already scanned');
        await logScan('already_scanned', 'QR code was already used', qrCode.id, qrCode.order_id);
        return new Response(
          JSON.stringify({ error: 'QR code already scanned', code: 'ALREADY_SCANNED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date(qrCode.expires_at) < new Date()) {
        console.error('[delivery-qr] QR expired');
        await logScan('expired', 'QR code has expired', qrCode.id, qrCode.order_id);
        
        // Delete expired QR
        await supabase
          .from('delivery_qr_codes')
          .delete()
          .eq('id', qrCode.id);
        
        return new Response(
          JSON.stringify({ error: 'QR code has expired. Ask buyer to regenerate.', code: 'EXPIRED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if seller matches
      if (qrCode.seller_id !== seller_id) {
        console.error('[delivery-qr] Wrong seller');
        await logScan('wrong_seller', 'Seller ID does not match QR code', qrCode.id, qrCode.order_id);
        return new Response(
          JSON.stringify({ error: 'This QR code is not for your order', code: 'WRONG_SELLER' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('id', qrCode.order_id)
        .single();

      if (orderError || !order) {
        console.error('[delivery-qr] Order not found');
        await logScan('invalid', 'Order not found', qrCode.id, qrCode.order_id);
        return new Response(
          JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify order is in correct state
      if (order.escrow_status !== 'holding') {
        console.error('[delivery-qr] Escrow not holding');
        await logScan('invalid', 'Escrow already released', qrCode.id, qrCode.order_id);
        return new Response(
          JSON.stringify({ error: 'Escrow already released or refunded', code: 'ESCROW_RELEASED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[delivery-qr] QR valid! Releasing escrow...');

      // Mark QR as scanned
      await supabase
        .from('delivery_qr_codes')
        .update({ status: 'scanned', scanned_at: new Date().toISOString() })
        .eq('id', qrCode.id);

      // Release escrow
      const result = await releaseEscrow(supabase, order, qrCode.id, 'qr_scan');
      
      await logScan('success', undefined, qrCode.id, qrCode.order_id);

      console.log('[delivery-qr] Successfully completed escrow release via QR');

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===============================
    // ACTION: VALIDATE DELIVERY CODE
    // ===============================
    if (action === 'validate_code') {
      if (!code || !seller_id || !order_id) {
        return new Response(
          JSON.stringify({ error: 'Missing code, order_id, or seller_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[delivery-qr] Validating delivery code for order: ${order_id}`);

      // Log the attempt
      const logCodeAttempt = async (result: string, errorMessage?: string, qrId?: string) => {
        await supabase.from('qr_scan_logs').insert({
          qr_id: qrId,
          order_id,
          seller_id,
          scan_result: result,
          error_message: errorMessage,
          metadata: { code_prefix: code.substring(0, 3) + '****', method: 'delivery_code' }
        });
      };

      // First verify the order belongs to seller
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('id', order_id)
        .eq('seller_id', seller_id)
        .single();

      if (orderError || !order) {
        console.error('[delivery-qr] Order not found or wrong seller');
        await logCodeAttempt('not_found', 'Order not found or wrong seller');
        return new Response(
          JSON.stringify({ error: 'Order not found or not your order', code: 'ORDER_NOT_FOUND' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify order is in correct state
      if (order.escrow_status !== 'holding') {
        console.error('[delivery-qr] Escrow not holding');
        await logCodeAttempt('invalid', 'Escrow already released');
        return new Response(
          JSON.stringify({ error: 'Escrow already released or refunded', code: 'ESCROW_RELEASED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find the delivery code record for this order
      const { data: qrCode, error: qrError } = await supabase
        .from('delivery_qr_codes')
        .select('*')
        .eq('order_id', order_id)
        .eq('seller_id', seller_id)
        .eq('status', 'active')
        .single();

      if (qrError || !qrCode) {
        console.error('[delivery-qr] No active code found');
        await logCodeAttempt('not_found', 'No active delivery code for this order');
        return new Response(
          JSON.stringify({ error: 'No active delivery code found. Ask buyer to generate one.', code: 'NOT_FOUND' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date(qrCode.expires_at) < new Date()) {
        console.error('[delivery-qr] Code expired');
        await logCodeAttempt('expired', 'Delivery code has expired', qrCode.id);
        
        // Delete expired code
        await supabase
          .from('delivery_qr_codes')
          .delete()
          .eq('id', qrCode.id);
        
        return new Response(
          JSON.stringify({ error: 'Code has expired. Ask buyer to generate a new one.', code: 'EXPIRED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify it's a code-based entry (not QR)
      if (!qrCode.encrypted_token.startsWith('CODE:')) {
        console.error('[delivery-qr] Not a code-based entry');
        await logCodeAttempt('invalid', 'No code found, only QR available', qrCode.id);
        return new Response(
          JSON.stringify({ error: 'No delivery code active. Buyer needs to generate a code.', code: 'NO_CODE' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the code matches
      const storedHash = qrCode.encrypted_token.replace('CODE:', '');
      const salt = order_id + seller_id;
      const inputHash = await hashCode(code, salt);

      if (inputHash !== storedHash) {
        console.error('[delivery-qr] Invalid code');
        await logCodeAttempt('invalid_code', 'Code does not match', qrCode.id);
        return new Response(
          JSON.stringify({ error: 'Invalid code. Please check and try again.', code: 'INVALID_CODE' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[delivery-qr] Code valid! Releasing escrow...');

      // Mark as scanned/used
      await supabase
        .from('delivery_qr_codes')
        .update({ status: 'scanned', scanned_at: new Date().toISOString() })
        .eq('id', qrCode.id);

      // Release escrow
      const result = await releaseEscrow(supabase, order, qrCode.id, 'delivery_code');
      
      await logCodeAttempt('success', undefined, qrCode.id);

      console.log('[delivery-qr] Successfully completed escrow release via delivery code');

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===============================
    // ACTION: GET QR/CODE STATUS
    // ===============================
    if (action === 'status') {
      if (!order_id) {
        return new Response(
          JSON.stringify({ error: 'Missing order_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: qrCode, error } = await supabase
        .from('delivery_qr_codes')
        .select('*')
        .eq('order_id', order_id)
        .eq('status', 'active')
        .single();

      if (error || !qrCode) {
        return new Response(
          JSON.stringify({ has_active_qr: false, has_active_code: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      const isExpired = new Date(qrCode.expires_at) < new Date();
      
      if (isExpired) {
        // Clean up expired QR/code
        await supabase
          .from('delivery_qr_codes')
          .delete()
          .eq('id', qrCode.id);
        
        return new Response(
          JSON.stringify({ has_active_qr: false, has_active_code: false, was_expired: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isCode = qrCode.encrypted_token.startsWith('CODE:');

      return new Response(
        JSON.stringify({ 
          has_active_qr: !isCode,
          has_active_code: isCode,
          qr_data: !isCode ? {
            id: qrCode.id,
            token: qrCode.encrypted_token,
            expires_at: qrCode.expires_at
          } : undefined,
          code_data: isCode ? {
            id: qrCode.id,
            expires_at: qrCode.expires_at
            // Note: We don't return the code itself for security - buyer already has it
          } : undefined
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delivery-qr] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
