import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-monime-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload = await req.json();
    console.log('Received Monime webhook:', JSON.stringify(payload, null, 2));

    // Extract event details
    const eventId = payload.id || `evt-${Date.now()}`;
    const eventType = payload.type || payload.event;
    const eventData = payload.data || payload.result || payload;

    if (!eventType) {
      console.error('Missing event type in webhook payload');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check idempotency - has this event been processed?
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log('Event already processed:', eventId);
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the event for idempotency
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      payload: payload,
    });

    // Process based on event type
    let processed = false;

    if (eventType === 'payment_code.processed' || eventType === 'payment_code.completed') {
      // Deposit completed - credit the wallet
      processed = await handleDepositSuccess(supabase, eventData);
    } else if (eventType === 'payment_code.expired' || eventType === 'payment_code.cancelled') {
      // Deposit failed/expired
      processed = await handleDepositFailed(supabase, eventData, eventType);
    } else if (eventType === 'payout.completed') {
      // Withdrawal completed
      processed = await handlePayoutSuccess(supabase, eventData);
    } else if (eventType === 'payout.failed') {
      // Withdrawal failed - reverse the ledger entry
      processed = await handlePayoutFailed(supabase, eventData);
    } else {
      console.log('Unhandled event type:', eventType);
    }

    console.log('Webhook processing result:', { eventType, processed });

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleDepositSuccess(supabase: any, eventData: any): Promise<boolean> {
  try {
    // Find the ledger entry by payment code ID or reference
    const monimeId = eventData.id || eventData.paymentCodeId;
    const reference = eventData.reference;

    console.log('Processing deposit success:', { monimeId, reference });

    // Find the pending ledger entry
    let query = supabase
      .from('wallet_ledger')
      .select('*')
      .eq('transaction_type', 'deposit')
      .eq('status', 'pending');

    if (monimeId) {
      query = query.eq('monime_id', monimeId);
    } else if (reference) {
      query = query.eq('reference', reference);
    } else {
      console.error('No identifier found in deposit event');
      return false;
    }

    const { data: ledgerEntry, error: fetchError } = await query.maybeSingle();

    if (fetchError || !ledgerEntry) {
      console.error('Ledger entry not found:', fetchError, { monimeId, reference });
      return false;
    }

    // Update ledger entry to success
    const { error: updateError } = await supabase
      .from('wallet_ledger')
      .update({
        status: 'success',
        metadata: {
          ...ledgerEntry.metadata,
          completed_at: new Date().toISOString(),
          processed_payment_data: eventData.processedPaymentData,
        },
      })
      .eq('id', ledgerEntry.id);

    if (updateError) {
      console.error('Failed to update ledger entry:', updateError);
      return false;
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: ledgerEntry.user_id,
      type: 'system',
      title: 'Deposit Successful',
      body: `Your deposit of SLE ${(ledgerEntry.amount / 100).toLocaleString()} has been credited to your wallet.`,
      metadata: { ledger_id: ledgerEntry.id, type: 'deposit_success' },
    });

    console.log('Deposit success processed for user:', ledgerEntry.user_id);
    return true;
  } catch (error) {
    console.error('Error processing deposit success:', error);
    return false;
  }
}

async function handleDepositFailed(supabase: any, eventData: any, reason: string): Promise<boolean> {
  try {
    const monimeId = eventData.id || eventData.paymentCodeId;
    const reference = eventData.reference;

    console.log('Processing deposit failure:', { monimeId, reference, reason });

    let query = supabase
      .from('wallet_ledger')
      .select('*')
      .eq('transaction_type', 'deposit')
      .eq('status', 'pending');

    if (monimeId) {
      query = query.eq('monime_id', monimeId);
    } else if (reference) {
      query = query.eq('reference', reference);
    } else {
      return false;
    }

    const { data: ledgerEntry, error: fetchError } = await query.maybeSingle();

    if (fetchError || !ledgerEntry) {
      console.log('No pending deposit found to fail');
      return false;
    }

    // Update ledger entry to failed
    await supabase
      .from('wallet_ledger')
      .update({
        status: 'failed',
        metadata: {
          ...ledgerEntry.metadata,
          failed_at: new Date().toISOString(),
          failure_reason: reason,
        },
      })
      .eq('id', ledgerEntry.id);

    console.log('Deposit marked as failed:', ledgerEntry.id);
    return true;
  } catch (error) {
    console.error('Error processing deposit failure:', error);
    return false;
  }
}

async function handlePayoutSuccess(supabase: any, eventData: any): Promise<boolean> {
  try {
    const monimeId = eventData.id || eventData.payoutId;

    console.log('Processing payout success:', { monimeId });

    const { data: ledgerEntry, error: fetchError } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('monime_id', monimeId)
      .eq('transaction_type', 'withdrawal')
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (fetchError || !ledgerEntry) {
      console.error('Ledger entry not found for payout:', fetchError, monimeId);
      return false;
    }

    // Update ledger entry to success
    const { error: updateError } = await supabase
      .from('wallet_ledger')
      .update({
        status: 'success',
        metadata: {
          ...ledgerEntry.metadata,
          completed_at: new Date().toISOString(),
          destination_reference: eventData.destination?.transactionReference,
        },
      })
      .eq('id', ledgerEntry.id);

    if (updateError) {
      console.error('Failed to update ledger entry:', updateError);
      return false;
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: ledgerEntry.user_id,
      type: 'system',
      title: 'Withdrawal Successful',
      body: `Your withdrawal of SLE ${(ledgerEntry.amount / 100).toLocaleString()} has been sent to your mobile money account.`,
      metadata: { ledger_id: ledgerEntry.id, type: 'withdrawal_success' },
    });

    console.log('Payout success processed for user:', ledgerEntry.user_id);
    return true;
  } catch (error) {
    console.error('Error processing payout success:', error);
    return false;
  }
}

async function handlePayoutFailed(supabase: any, eventData: any): Promise<boolean> {
  try {
    const monimeId = eventData.id || eventData.payoutId;
    const failureDetail = eventData.failureDetail || {};

    console.log('Processing payout failure:', { monimeId, failureDetail });

    const { data: ledgerEntry, error: fetchError } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('monime_id', monimeId)
      .eq('transaction_type', 'withdrawal')
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (fetchError || !ledgerEntry) {
      console.log('No pending withdrawal found to fail');
      return false;
    }

    // Update ledger entry to failed (funds will be returned to balance)
    await supabase
      .from('wallet_ledger')
      .update({
        status: 'failed',
        metadata: {
          ...ledgerEntry.metadata,
          failed_at: new Date().toISOString(),
          failure_code: failureDetail.code,
          failure_message: failureDetail.message,
        },
      })
      .eq('id', ledgerEntry.id);

    // Notify user
    await supabase.from('notifications').insert({
      user_id: ledgerEntry.user_id,
      type: 'system',
      title: 'Withdrawal Failed',
      body: `Your withdrawal of SLE ${(ledgerEntry.amount / 100).toLocaleString()} could not be completed. The funds remain in your wallet.`,
      metadata: { 
        ledger_id: ledgerEntry.id, 
        type: 'withdrawal_failed',
        reason: failureDetail.message || failureDetail.code,
      },
    });

    console.log('Payout marked as failed:', ledgerEntry.id);
    return true;
  } catch (error) {
    console.error('Error processing payout failure:', error);
    return false;
  }
}