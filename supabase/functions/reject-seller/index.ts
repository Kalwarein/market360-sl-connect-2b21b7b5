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

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roles) {
      throw new Error('Admin access required')
    }

    const { applicationId, reason } = await req.json()

    console.log('Rejecting application:', applicationId)

    // Get application details
    const { data: application, error: appError } = await supabaseClient
      .from('seller_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'pending') {
      throw new Error('Application already processed')
    }

    // Update application status
    const { error: updateError } = await supabaseClient
      .from('seller_applications')
      .update({
        status: 'rejected',
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || 'Application does not meet requirements'
      })
      .eq('id', applicationId)

    if (updateError) {
      throw new Error('Failed to update application: ' + updateError.message)
    }

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: application.user_id,
        type: 'seller_rejected',
        title: 'Seller Application Update',
        body: `Unfortunately, your seller application was not approved. Reason: ${reason || 'Does not meet requirements'}`,
        metadata: { application_id: applicationId, reason }
      })

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'seller_application_rejected',
        target_type: 'seller_applications',
        target_id: applicationId,
        description: `Rejected seller application for ${application.business_name}`,
        metadata: { reason }
      })

    console.log('Rejection complete')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Seller application rejected'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
