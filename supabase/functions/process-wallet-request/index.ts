import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin auth from caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    // Ensure caller is admin
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (roleError) throw roleError
    if (!roles || roles.length === 0) throw new Error('Admin access required')

    const { requestId, action, adminNotes } = await req.json()
    if (!requestId || !action) throw new Error('Missing requestId or action')

    // Load wallet request
    const { data: request, error: reqError } = await supabaseClient
      .from('wallet_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (reqError || !request) throw new Error('Wallet request not found')

    const nowIso = new Date().toISOString()

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updReqErr } = await supabaseClient
      .from('wallet_requests')
      .update({ status: newStatus, admin_notes: adminNotes ?? null, reviewed_at: nowIso, reviewed_by: user.id })
      .eq('id', requestId)
    if (updReqErr) throw updReqErr

    let walletDelta = 0

    if (action === 'approve') {
      if (request.type === 'deposit') {
        // No fee on deposits - full amount credited
        const depositAmount = Number(request.amount);
        walletDelta = depositAmount;
        
        // Add deposit to wallet_ledger (new Monime system)
        const { error: ledgerErr } = await supabaseClient.from('wallet_ledger').insert({
          user_id: request.user_id,
          amount: depositAmount,
          transaction_type: 'deposit',
          status: 'success',
          reference: `Manual Deposit - Admin approved`,
          metadata: { 
            original_amount: request.amount, 
            fee_percentage: 0, 
            wallet_request_id: request.id, 
            processed_by: user.id 
          }
        })
        if (ledgerErr) throw ledgerErr
      } else if (request.type === 'withdrawal') {
        const grossAmount = Number(request.amount);
        const fee = grossAmount * 0.02;
        const net = grossAmount - fee;
        walletDelta = -grossAmount;
        
        // Add withdrawal to wallet_ledger (new Monime system)
        const { error: ledgerErr } = await supabaseClient.from('wallet_ledger').insert({
          user_id: request.user_id,
          amount: grossAmount,
          transaction_type: 'withdrawal',
          status: 'success',
          reference: `Manual Withdrawal - Admin approved`,
          metadata: { 
            original_amount: request.amount, 
            fee_percentage: 2, 
            fee_amount: fee,
            net_payout: net, 
            wallet_request_id: request.id, 
            processed_by: user.id 
          }
        })
        if (ledgerErr) throw ledgerErr
      }
    }

    // Notify user
    const { error: notifErr } = await supabaseClient.from('notifications').insert({
      user_id: request.user_id,
      type: 'system',
      title: `Wallet ${request.type} ${newStatus}`,
      body: adminNotes || (newStatus === 'approved' ? 'Your request was approved.' : 'Your request was rejected.'),
      metadata: { wallet_request_id: request.id, wallet_delta: walletDelta }
    })
    if (notifErr) {
      // Non-fatal
      console.error('Notification error', notifErr)
    }

    // Audit log
    const { error: auditErr } = await supabaseClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'wallet_request_' + newStatus,
      target_type: 'wallet_requests',
      target_id: request.id,
      description: `${request.type} ${newStatus} for user ${request.user_id}`,
      metadata: { amount: request.amount }
    })
    if (auditErr) {
      console.error('Audit error', auditErr)
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error(error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
