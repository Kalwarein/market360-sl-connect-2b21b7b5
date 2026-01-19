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

    console.log('Withdrawal function called');
    console.log('Financial account ID configured:', financialAccountId);

    // Financial account ID is REQUIRED for payouts
    if (!financialAccountId) {
      console.error('MONIME_FINANCIAL_ACCOUNT_ID not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Withdrawal service not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
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

    console.log('User authenticated:', user.id);

    // Parse request body
    const { amount, phone_number, provider_id } = await req.json();
    
    console.log('Request body:', { amount, phone_number, provider_id });

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
      console.log('Wallet is frozen for user:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Your wallet is frozen. Please contact support.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get wallet balance using the ledger function (returns in whole Leones)
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_wallet_balance', { p_user_id: user.id });

    if (balanceError) {
      console.error('Balance fetch error:', balanceError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch wallet balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Balance is in whole Leones from the RPC function
    const currentBalance = balanceData || 0;
    
    // Amount from frontend is in whole Leones (no decimals in our system)
    const amountWholeLeones = Math.round(amount);
    
    // Calculate 2% fee (in whole Leones)
    const feePercentage = 0.02;
    const feeAmount = Math.round(amountWholeLeones * feePercentage);
    const amountToSend = amountWholeLeones - feeAmount;

    // Convert to cents for Monime API
    const amountInCentsForMonime = amountToSend * 100;

    console.log('Withdrawal calculations:', {
      userId: user.id,
      amountWholeLeones,
      feeAmount,
      amountToSend,
      amountInCentsForMonime,
      currentBalance,
      phoneNumber: phone_number,
      provider: selectedProvider,
    });

    // Check sufficient balance (both in whole Leones now)
    if (amountWholeLeones > currentBalance) {
      console.log('Insufficient balance:', { amountWholeLeones, currentBalance });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient balance',
          current_balance: currentBalance,
          requested_amount: amountWholeLeones,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique reference
    const reference = `WDR-${user.id.substring(0, 8)}-${Date.now()}`;
    const idempotencyKey = `withdrawal-${reference}`;

    // Format phone number for Monime API
    // Payout destination expects a phoneNumber (E.164), e.g. +23278000000
    const digitsOnly = String(phone_number).replace(/\D/g, '');

    let national = digitsOnly;
    if (national.startsWith('232')) national = national.substring(3);
    if (national.startsWith('0')) national = national.substring(1);

    if (national.length !== 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid phone number format. Please enter a Sierra Leone number like 076123456 or +23276123456.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const monimePhoneNumber = `+232${national}`;
    console.log('Formatted phone number:', { input: phone_number, national, monimePhoneNumber });

    // Build payout request body according to Monime API v1 specs
    // IMPORTANT: source.financialAccountId is REQUIRED - must be fac-xxx, NOT spc-xxx (Space ID)
    const payoutBody: Record<string, unknown> = {
      amount: {
        currency: 'SLE',
        value: amountInCentsForMonime, // Amount in cents (minor unit) for Monime API
      },
      source: {
        financialAccountId: financialAccountId, // Must be fac-xxx format
      },
      destination: {
        type: 'momo',
        providerId: selectedProvider, // m17 = Orange, m18 = Africell
        phoneNumber: monimePhoneNumber,
      },
      // Monime expects metadata as a StringMap (all values must be strings)
      metadata: {
        user_id: user.id,
        type: 'withdrawal',
        platform: 'market360',
        reference: reference,
        original_amount_leones: String(amountWholeLeones),
        fee_leones: String(feeAmount),
        amount_to_send_leones: String(amountToSend),
      },
    };

    console.log('Creating Monime payout with financial account:', financialAccountId);
    console.log('Payout body:', JSON.stringify(payoutBody, null, 2));

    const monimeResponse = await fetch(`${MONIME_API_URL}/v1/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${monimeToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Monime-Space-Id': MONIME_SPACE_ID,
        'Monime-Version': 'caph.2025-08-23', // Use latest API version
      },
      body: JSON.stringify(payoutBody),
    });

    const monimeRaw = await monimeResponse.text();
    let monimeData: any;
    try {
      monimeData = JSON.parse(monimeRaw);
    } catch (_e) {
      monimeData = { success: false, raw: monimeRaw };
    }

    console.log('Monime payout response status:', monimeResponse.status);
    console.log('Monime payout response body:', JSON.stringify(monimeData, null, 2));

    if (!monimeResponse.ok || !monimeData.success) {
      // Extract error details
      const messages = Array.isArray(monimeData?.messages) ? monimeData.messages : [];
      const errorObj = monimeData?.error;
      const failureDetail = monimeData?.result?.failureDetail;
      
      const errorDetails = 
        failureDetail?.message || 
        failureDetail?.code ||
        (messages.length > 0 ? messages.join(', ') : null) ||
        errorObj?.message || 
        errorObj || 
        'Unknown error from payment provider';

      console.error('Monime API error:', { 
        status: monimeResponse.status, 
        errorDetails,
        fullResponse: monimeData 
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to initiate withdrawal. Please try again later.',
          details: errorDetails,
          monime_status: monimeResponse.status,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payout = monimeData.result;
    console.log('Payout created successfully:', { payoutId: payout.id, status: payout.status });

    // Create pending ledger entry (full amount deducted from wallet) - store in whole Leones
    // Status is 'pending' until webhook confirms completion
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        transaction_type: 'withdrawal',
        amount: amountWholeLeones, // Full amount in whole Leones
        status: 'pending', // Will be updated by webhook to 'success' or 'failed'
        provider: 'monime',
        reference: reference,
        monime_id: payout.id,
        metadata: {
          payout_status: payout.status,
          destination_phone: monimePhoneNumber,
          destination_provider: selectedProvider,
          provider_name: selectedProvider === 'm17' ? 'Orange Money' : 'Africell Money',
          created_via: 'api',
          fee_leones: feeAmount,
          amount_sent_leones: amountToSend,
          amount_sent_cents_to_monime: amountInCentsForMonime,
          fee_percentage: 2,
        },
      })
      .select()
      .single();

    if (ledgerError) {
      console.error('Ledger insert error:', ledgerError);
      // Payout was already initiated - webhook should still handle it
      // But warn the user
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create transaction record. Your withdrawal may still process - check your mobile money account.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Withdrawal initiated successfully:', {
      ledgerId: ledgerEntry.id,
      payoutId: payout.id,
      reference,
      status: 'pending',
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ledger_id: ledgerEntry.id,
          reference: reference,
          amount: amountWholeLeones,
          fee: feeAmount,
          amount_to_receive: amountToSend,
          status: 'pending',
          destination: {
            phone: monimePhoneNumber,
            provider: selectedProvider === 'm17' ? 'Orange Money' : 'Africell Money',
          },
          message: `Withdrawal initiated. You will receive Le ${amountToSend.toLocaleString()} shortly (2% processing fee applied).`,
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
