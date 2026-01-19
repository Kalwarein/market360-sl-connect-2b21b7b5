import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, buyer_id } = await req.json();

    if (!order_id || !buyer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, buyer_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[release-escrow] Processing order: ${order_id} for buyer: ${buyer_id}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(title, images)')
      .eq('id', order_id)
      .eq('buyer_id', buyer_id)
      .single();

    if (orderError || !order) {
      console.error('[release-escrow] Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order is in correct state
    if (order.status !== 'delivered') {
      console.error('[release-escrow] Invalid order status:', order.status);
      return new Response(
        JSON.stringify({ error: 'Order must be delivered before confirming' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.escrow_status !== 'holding') {
      console.error('[release-escrow] Invalid escrow status:', order.escrow_status);
      return new Response(
        JSON.stringify({ error: 'Escrow already released or refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate amount after 2% platform fee
    // All amounts are in whole Leones (no cents/decimals)
    const escrowAmount = Math.round(order.total_amount) || 0;
    const platformFee = Math.round(escrowAmount * 0.02);
    const amountToRelease = escrowAmount - platformFee;

    console.log(`[release-escrow] Amounts - Escrow: ${escrowAmount}, Fee: ${platformFee}, Release: ${amountToRelease}`);

    // Generate unique reference for idempotency
    const earningReference = `escrow-release:${order_id}`;
    
    // Check if earning already exists (idempotency)
    const { data: existingEarning } = await supabase
      .from('wallet_ledger')
      .select('id')
      .eq('reference', earningReference)
      .single();

    if (existingEarning) {
      console.log('[release-escrow] Earning already exists, returning success');
      return new Response(
        JSON.stringify({ 
          success: true, 
          amount_released: amountToRelease,
          fee_deducted: platformFee,
          already_processed: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status first
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        escrow_status: 'released'
      })
      .eq('id', order_id);

    if (updateOrderError) {
      console.error('[release-escrow] Failed to update order:', updateOrderError);
      throw updateOrderError;
    }

    console.log('[release-escrow] Order status updated to completed');

    // Add earning to seller's wallet_ledger
    // This credits the seller's balance
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: order.seller_id,
        amount: amountToRelease,
        transaction_type: 'earning',
        status: 'success',
        reference: earningReference,
        metadata: { 
          order_id, 
          fee_deducted: platformFee,
          fee_percentage: 2,
          gross_amount: escrowAmount,
          product_title: order.products?.title,
          buyer_id: order.buyer_id
        }
      });

    if (ledgerError) {
      console.error('[release-escrow] Ledger entry error:', ledgerError);
      
      // Rollback order status if ledger fails
      await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          escrow_status: 'holding'
        })
        .eq('id', order_id);
      
      throw ledgerError;
    }

    console.log('[release-escrow] Seller earnings credited successfully');

    // Create notification for seller
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: order.seller_id,
      type: 'order',
      title: 'Payment Released! 🎉',
      body: `Buyer confirmed delivery for "${order.products?.title}". Le ${amountToRelease.toLocaleString()} added to your wallet.`,
      link_url: `/seller/order/${order_id}`,
      metadata: { order_id, amount: amountToRelease, fee: platformFee }
    });

    if (notifError) {
      console.error('[release-escrow] Notification error (non-fatal):', notifError);
    }

    // Create notification for buyer
    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'order',
      title: 'Order Completed ✅',
      body: `Thank you for confirming receipt of "${order.products?.title}". Payment has been released to the seller.`,
      link_url: `/order-detail/${order_id}`,
      metadata: { order_id }
    });

    console.log('[release-escrow] Successfully completed escrow release');

    return new Response(
      JSON.stringify({ 
        success: true, 
        amount_released: amountToRelease,
        fee_deducted: platformFee 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[release-escrow] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});