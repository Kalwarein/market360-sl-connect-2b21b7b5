import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONIME_API_URL = 'https://api.monime.io';
const MONIME_SPACE_ID = 'spc-k6LbQZHzbGmj41P6jYJJ4e587Un';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const monimeToken = Deno.env.get('MONIME_API_TOKEN')!;

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token to get user ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { amount } = await req.json();
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount. Must be a positive number.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if wallet is frozen
    const { data: freezeData } = await supabase
      .from('wallet_freezes')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (freezeData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Your wallet is frozen. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `DEP-${user.id.substring(0, 8)}-${Date.now()}`;
    const idempotencyKey = `deposit-${reference}`;

    // Convert amount to minor units (cents)
    const amountInCents = Math.round(amount * 100);

    console.log('Creating Monime payment code:', { 
      userId: user.id, 
      amount, 
      amountInCents, 
      reference 
    });

    // Call Monime API to create payment code
    const monimeResponse = await fetch(`${MONIME_API_URL}/v1/payment-codes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${monimeToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Monime-Space-Id': MONIME_SPACE_ID,
      },
      body: JSON.stringify({
        name: `Market360 Deposit - ${reference}`,
        mode: 'one_time',
        amount: {
          currency: 'SLE',
          value: amountInCents,
        },
        authorizedProviders: ['m17', 'm18'],
        metadata: {
          user_id: user.id,
          type: 'deposit',
          platform: 'market360',
          reference: reference,
        },
      }),
    });

    const monimeData = await monimeResponse.json();
    console.log('Monime response:', JSON.stringify(monimeData, null, 2));

    if (!monimeResponse.ok || !monimeData.success) {
      console.error('Monime API error:', monimeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create payment code',
          details: monimeData.messages || monimeData.error || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentCode = monimeData.result;

    // Create pending ledger entry
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        transaction_type: 'deposit',
        amount: amountInCents,
        status: 'pending',
        provider: 'monime',
        reference: reference,
        monime_id: paymentCode.id,
        monime_ussd_code: paymentCode.ussdCode,
        metadata: {
          payment_code_status: paymentCode.status,
          expire_time: paymentCode.expireTime,
          created_via: 'api',
        },
      })
      .select()
      .single();

    if (ledgerError) {
      console.error('Ledger insert error:', ledgerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create transaction record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deposit initiated successfully:', {
      ledgerId: ledgerEntry.id,
      reference,
      ussdCode: paymentCode.ussdCode,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ledger_id: ledgerEntry.id,
          reference: reference,
          ussd_code: paymentCode.ussdCode,
          amount: amount,
          expires_at: paymentCode.expireTime,
          status: 'pending',
          instructions: `Dial ${paymentCode.ussdCode} to complete your payment of SLE ${amount.toLocaleString()}`,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Deposit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});