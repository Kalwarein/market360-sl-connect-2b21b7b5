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

    // Calculate amount after 2% fee
    const escrowAmount = order.total_amount || 0;
    const fee = escrowAmount * 0.02;
    const amountToRelease = escrowAmount - fee;

    // Update order status first
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        escrow_status: 'released'
      })
      .eq('id', order_id);

    if (updateOrderError) throw updateOrderError;

    // Add earning to seller's wallet_ledger (new Monime system)
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: order.seller_id,
        amount: amountToRelease,
        transaction_type: 'earning',
        status: 'success',
        reference: `Order #${order_id.slice(0, 8)} - Payment released`,
        metadata: { 
          order_id, 
          fee_deducted: fee,
          gross_amount: escrowAmount,
          product_title: order.products?.title
        }
      });

    if (ledgerError) {
      console.error('Ledger entry error:', ledgerError);
      throw ledgerError;
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        amount_released: amountToRelease,
        fee_deducted: fee 
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
