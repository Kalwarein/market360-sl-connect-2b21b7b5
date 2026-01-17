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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, reason, refund_type, initiator_id }: {
      order_id: string;
      reason?: string;
      refund_type: 'buyer_cancel' | 'seller_decline' | 'dispute';
      initiator_id: string;
    } = await req.json();

    if (!order_id || !refund_type || !initiator_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(title, images, id)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order can be refunded (idempotency)
    if (order.escrow_status === 'refunded' || order.escrow_status === 'released') {
      return new Response(
        JSON.stringify({ error: 'Order already processed', order_status: order.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refundAmount = Number(order.total_amount);
    const refundAmountInCents = Math.round(refundAmount * 100); // Convert to cents for ledger

    // ========================================
    // IDEMPOTENCY CHECK: Check if refund already exists
    // ========================================
    const { data: existingRefund } = await supabase
      .from('wallet_ledger')
      .select('id')
      .eq('user_id', order.buyer_id)
      .eq('transaction_type', 'refund')
      .ilike('reference', `%${order_id}%`)
      .eq('status', 'success')
      .maybeSingle();

    if (existingRefund) {
      // Already processed - just update order status and return success
      await supabase
        .from('orders')
        .update({ 
          status: refund_type === 'dispute' ? 'disputed' : 'cancelled',
          escrow_status: 'refunded'
        })
        .eq('id', order_id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already processed',
          refund_amount: refundAmount,
          order_status: refund_type === 'dispute' ? 'disputed' : 'cancelled'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status FIRST (idempotency check)
    const newStatus = refund_type === 'dispute' ? 'disputed' : 'cancelled';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      escrow_status: 'refunded'
    };

    if (refund_type === 'dispute') {
      updateData.dispute_reason = reason;
      updateData.dispute_opened_at = new Date().toISOString();
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .eq('escrow_status', 'holding'); // Idempotency check

    if (updateOrderError) throw updateOrderError;

    // ========================================
    // CRITICAL: Create refund entry in wallet_ledger FIRST
    // This is the source of truth for balance
    // ========================================
    const refundReasons = {
      'buyer_cancel': `Order cancelled by buyer`,
      'seller_decline': `Order declined by seller`,
      'dispute': `Dispute refund - ${reason || 'No reason provided'}`
    };

    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: order.buyer_id,
        transaction_type: 'refund',
        amount: refundAmountInCents,
        status: 'success',
        reference: `Order #${order_id.slice(0, 8)} - ${refundReasons[refund_type]}`,
        metadata: { 
          order_id, 
          refund_type, 
          reason,
          product_title: order.products?.title || 'Unknown',
          original_amount: refundAmount
        }
      });

    if (ledgerError) {
      console.error('Ledger error:', ledgerError);
      return new Response(
        JSON.stringify({ error: 'Failed to process refund. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Update wallets table for backward compatibility
    // ========================================
    const { data: buyerWallet } = await supabase
      .from('wallets')
      .select('id, balance_leones')
      .eq('user_id', order.buyer_id)
      .single();

    if (buyerWallet) {
      await supabase
        .from('wallets')
        .update({ 
          balance_leones: Number(buyerWallet.balance_leones) + refundAmount
        })
        .eq('id', buyerWallet.id);

      // Create transaction record for backward compatibility
      await supabase
        .from('transactions')
        .insert({
          wallet_id: buyerWallet.id,
          type: 'refund',
          amount: refundAmount,
          status: 'completed',
          reference: `Order #${order_id.slice(0, 8)} - ${refundReasons[refund_type]}`,
          metadata: { order_id, refund_type, reason }
        });
    }

    // Send notification to buyer
    const buyerNotifications = {
      'buyer_cancel': {
        title: '💰 Refund Processed',
        body: `Your order for "${order.products?.title}" has been cancelled. Le ${refundAmount.toLocaleString()} refunded to your wallet.`
      },
      'seller_decline': {
        title: '💰 Order Declined - Refund Issued',
        body: `The seller declined your order for "${order.products?.title}". Le ${refundAmount.toLocaleString()} has been refunded.`
      },
      'dispute': {
        title: '⚠️ Dispute Filed - Funds Secured',
        body: `Your dispute for "${order.products?.title}" is under review. Le ${refundAmount.toLocaleString()} has been refunded.`
      }
    };

    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'order',
      title: buyerNotifications[refund_type].title,
      body: buyerNotifications[refund_type].body,
      link_url: `/order-detail/${order_id}`,
      image_url: order.products?.images?.[0],
      metadata: { 
        order_id, 
        refund_amount: refundAmount,
        refund_type,
        product_title: order.products?.title 
      }
    });

    // Send notification to seller
    const sellerNotifications = {
      'buyer_cancel': {
        title: '🚫 Order Cancelled',
        body: `Buyer cancelled order for "${order.products?.title}". Order has been refunded.`
      },
      'seller_decline': {
        title: '🚫 Order Declined',
        body: `You declined the order for "${order.products?.title}". Buyer has been refunded.`
      },
      'dispute': {
        title: '⚠️ Order Disputed',
        body: `Buyer filed a dispute for "${order.products?.title}". Admin will review the case.`
      }
    };

    await supabase.from('notifications').insert({
      user_id: order.seller_id,
      type: 'order',
      title: sellerNotifications[refund_type].title,
      body: sellerNotifications[refund_type].body,
      link_url: `/seller/order/${order_id}`,
      image_url: order.products?.images?.[0],
      metadata: { 
        order_id, 
        refund_amount: refundAmount,
        refund_type,
        product_title: order.products?.title 
      }
    });

    // Send chat system message
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', order.buyer_id)
      .eq('seller_id', order.seller_id)
      .eq('product_id', order.products?.id)
      .maybeSingle();

    if (conversation) {
      const chatMessages = {
        'buyer_cancel': `🚫 Order cancelled by buyer. Refund of Le ${refundAmount.toLocaleString()} has been processed back to buyer's wallet.`,
        'seller_decline': `🚫 Order declined by seller. Refund of Le ${refundAmount.toLocaleString()} has been processed back to buyer's wallet.`,
        'dispute': `⚠️ Buyer filed a dispute. Refund of Le ${refundAmount.toLocaleString()} has been processed. Admin will review this case.`
      };

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: initiator_id,
        body: chatMessages[refund_type],
        message_type: 'action'
      });
    }

    // Notify admins for disputes
    if (refund_type === 'dispute') {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await supabase.from('notifications').insert({
            user_id: admin.user_id,
            type: 'order',
            title: '⚠️ New Order Dispute',
            body: `Order #${order_id.slice(0, 8)} disputed: "${reason || 'No reason provided'}"`,
            link_url: `/admin/orders`,
            metadata: { order_id, dispute_reason: reason }
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        refund_amount: refundAmount,
        order_status: newStatus
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing refund:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});