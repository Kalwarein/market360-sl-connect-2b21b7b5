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
    const financialAccountId = Deno.env.get('MONIME_FINANCIAL_ACCOUNT_ID');

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
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
    const { amount, phone_number, provider_id } = await req.json();
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount. Must be a positive number.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone_number || typeof phone_number !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate provider_id (m17 = Orange Money, m18 = Africell)
    const validProviders = ['m17', 'm18'];
    const selectedProvider = provider_id || 'm17'; // Default to Orange Money
    if (!validProviders.includes(selectedProvider)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid provider. Use m17 (Orange) or m18 (Africell).' }),
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

    // Get wallet balance using the ledger function
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_wallet_balance', { p_user_id: user.id });

    if (balanceError) {
      console.error('Balance fetch error:', balanceError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = balanceData || 0;
    const amountInCents = Math.round(amount * 100);

    console.log('Withdrawal request:', {
      userId: user.id,
      amount,
      amountInCents,
      currentBalance,
      phoneNumber: phone_number,
      provider: selectedProvider,
    });

    // Check sufficient balance
    if (amountInCents > currentBalance) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient balance',
          current_balance: currentBalance / 100,
          requested_amount: amount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `WDR-${user.id.substring(0, 8)}-${Date.now()}`;
    const idempotencyKey = `withdrawal-${reference}`;

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');

    // Call Monime API to create payout
    const payoutBody: Record<string, unknown> = {
      amount: {
        currency: 'SLE',
        value: amountInCents,
      },
      destination: {
        type: 'momo',
        providerId: selectedProvider,
        accountNumber: cleanPhone,
      },
      metadata: {
        user_id: user.id,
        type: 'withdrawal',
        platform: 'market360',
        reference: reference,
      },
    };

    // Only add source if financial account ID is provided
    if (financialAccountId) {
      payoutBody.source = {
        financialAccountId: financialAccountId,
      };
    }

    console.log('Creating Monime payout:', payoutBody);

    const monimeResponse = await fetch(`${MONIME_API_URL}/v1/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${monimeToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Monime-Space-Id': MONIME_SPACE_ID,
        'Monime-Version': 'caph.2025-06-20',
      },
      body: JSON.stringify(payoutBody),
    });

    const monimeData = await monimeResponse.json();
    console.log('Monime payout response:', JSON.stringify(monimeData, null, 2));

    if (!monimeResponse.ok || !monimeData.success) {
      console.error('Monime API error:', monimeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to initiate withdrawal',
          details: monimeData.messages || monimeData.error || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payout = monimeData.result;

    // Create pending ledger entry (debit)
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        transaction_type: 'withdrawal',
        amount: amountInCents,
        status: 'processing', // Processing because payout is initiated
        provider: 'monime',
        reference: reference,
        monime_id: payout.id,
        metadata: {
          payout_status: payout.status,
          destination_phone: cleanPhone,
          destination_provider: selectedProvider,
          created_via: 'api',
        },
      })
      .select()
      .single();

    if (ledgerError) {
      console.error('Ledger insert error:', ledgerError);
      // Note: Payout was already initiated with Monime - webhook will handle it
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create transaction record. Payout may still process.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal initiated successfully:', {
      ledgerId: ledgerEntry.id,
      payoutId: payout.id,
      reference,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ledger_id: ledgerEntry.id,
          reference: reference,
          amount: amount,
          status: 'processing',
          destination: {
            phone: cleanPhone,
            provider: selectedProvider === 'm17' ? 'Orange Money' : 'Africell Money',
          },
          message: 'Withdrawal initiated. You will receive the funds shortly.',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Withdrawal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});