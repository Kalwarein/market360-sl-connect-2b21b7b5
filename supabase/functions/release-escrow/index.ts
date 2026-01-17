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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(title, images)')
      .eq('id', order_id)
      .eq('buyer_id', buyer_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order is in correct state
    if (order.status !== 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Order must be delivered before confirming' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.escrow_status !== 'holding') {
      return new Response(
        JSON.stringify({ error: 'Escrow already released or refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // IDEMPOTENCY CHECK: Check if already processed
    // ========================================
    const earningReference = `Order ${order_id} - Sale earnings`;
    const { data: existingEarning } = await supabase
      .from('wallet_ledger')
      .select('id')
      .eq('user_id', order.seller_id)
      .eq('transaction_type', 'earning')
      .ilike('reference', `%${order_id}%`)
      .maybeSingle();

    if (existingEarning) {
      // Already processed - just update order status and return success
      await supabase
        .from('orders')
        .update({ status: 'completed', escrow_status: 'released' })
        .eq('id', order_id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already processed',
          amount_released: Number(order.total_amount),
          fee_deducted: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // CRITICAL FIX: NO FEE DEDUCTION ON SALES
    // Sellers receive 100% of product price
    // Fees are ONLY applied on withdrawals
    // ========================================
    const escrowAmount = Number(order.total_amount) || 0;
    const amountToRelease = escrowAmount; // FULL AMOUNT - NO FEE
    const amountInCents = Math.round(amountToRelease * 100); // Convert to cents for ledger

    // ========================================
    // STEP 1: Create earning entry in wallet_ledger FIRST
    // This is the source of truth for balance
    // ========================================
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: order.seller_id,
        transaction_type: 'earning',
        amount: amountInCents,
        status: 'success',
        reference: earningReference,
        metadata: { 
          order_id, 
          fee_deducted: 0,
          original_amount: escrowAmount,
          product_title: order.products?.title || 'Unknown',
          buyer_id: buyer_id
        }
      });

    if (ledgerError) {
      console.error('Ledger error:', ledgerError);
      return new Response(
        JSON.stringify({ error: 'Failed to record earning. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // STEP 2: Update order status
    // ========================================
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        escrow_status: 'released'
      })
      .eq('id', order_id);

    if (updateOrderError) {
      console.error('Order update error:', updateOrderError);
      // Don't fail - ledger entry is the source of truth
    }

    // ========================================
    // STEP 3: Update wallets table for backward compatibility
    // ========================================
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id, balance_leones')
      .eq('user_id', order.seller_id)
      .single();

    if (existingWallet) {
      await supabase
        .from('wallets')
        .update({ 
          balance_leones: Number(existingWallet.balance_leones || 0) + amountToRelease 
        })
        .eq('id', existingWallet.id);
    } else {
      // Create wallet if doesn't exist
      await supabase
        .from('wallets')
        .insert({ user_id: order.seller_id, balance_leones: amountToRelease });
    }

    // ========================================
    // STEP 4: Create transaction record for backward compatibility
    // ========================================
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', order.seller_id)
      .single();

    if (wallet) {
      await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'earning',
          amount: amountToRelease,
          status: 'completed',
          reference: `Order ${order_id}`,
          metadata: { 
            order_id, 
            fee_deducted: 0,
            original_amount: escrowAmount,
            product_title: order.products?.title || 'Unknown',
            buyer_id: buyer_id
          }
        });
    }

    // ========================================
    // STEP 5: Send notifications
    // ========================================
    await supabase.from('notifications').insert({
      user_id: order.seller_id,
      type: 'order',
      title: 'Payment Released! 🎉',
      body: `Buyer confirmed delivery for ${order.products?.title}. Le ${amountToRelease.toLocaleString()} added to your wallet.`,
      link_url: `/seller/order/${order_id}`,
      metadata: { order_id, amount: amountToRelease }
    });

    // Send SMS to seller about payment release
    try {
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', order.seller_id)
        .single();

      if (sellerProfile?.phone) {
        await supabase.functions.invoke('send-sms', {
          body: {
            to: sellerProfile.phone,
            message: `💰 Market360 - Payment Released!\n\nBuyer confirmed delivery for ${order.products?.title}.\n\nLe ${amountToRelease.toLocaleString()} has been added to your wallet.\n\nWithdraw anytime at market360.app`
          }
        });
      }
    } catch (smsError) {
      console.error('SMS notification error:', smsError);
      // Don't fail the release for SMS errors
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        amount_released: amountToRelease,
        fee_deducted: 0 // NO FEE ON EARNINGS
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error releasing escrow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});