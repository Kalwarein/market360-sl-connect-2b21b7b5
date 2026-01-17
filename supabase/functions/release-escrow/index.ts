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

    // Update order status FIRST (idempotency check)
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        escrow_status: 'released'
      })
      .eq('id', order_id)
      .eq('escrow_status', 'holding'); // Additional check for idempotency

    if (updateOrderError) throw updateOrderError;

    // Get seller's wallet
    let sellerWallet;
    const { data: existingWallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_leones')
      .eq('user_id', order.seller_id)
      .single();

    if (walletError) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createWalletError } = await supabase
        .from('wallets')
        .insert({ user_id: order.seller_id, balance_leones: 0 })
        .select('id, balance_leones')
        .single();

      if (createWalletError) throw createWalletError;
      sellerWallet = newWallet;
    } else {
      sellerWallet = existingWallet;
    }

    if (!sellerWallet) throw new Error('Wallet not found');

    // ========================================
    // CRITICAL FIX: NO FEE DEDUCTION ON SALES
    // Sellers receive 100% of product price
    // Fees are ONLY applied on withdrawals
    // ========================================
    const escrowAmount = Number(order.total_amount) || 0;
    const amountToRelease = escrowAmount; // FULL AMOUNT - NO FEE

    // Update seller wallet balance (using service role)
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({ 
        balance_leones: Number(sellerWallet.balance_leones || 0) + amountToRelease 
      })
      .eq('id', sellerWallet.id);

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      throw balanceError;
    }

    // Create transaction record in transactions table
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: sellerWallet.id,
        type: 'earning',
        amount: amountToRelease,
        status: 'completed',
        reference: `Order ${order_id}`,
        metadata: { 
          order_id, 
          fee_deducted: 0, // NO FEE ON EARNINGS
          original_amount: escrowAmount,
          product_title: order.products?.title || 'Unknown',
          buyer_id: buyer_id
        }
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      throw transactionError;
    }

    // Also create entry in wallet_ledger for consistency
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: order.seller_id,
        transaction_type: 'earning',
        amount: amountToRelease * 100, // Convert to cents for ledger
        status: 'success',
        reference: `Order ${order_id} - Sale earnings`,
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
      // Don't throw - transactions table entry is primary
    }

    // Create notification for seller
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