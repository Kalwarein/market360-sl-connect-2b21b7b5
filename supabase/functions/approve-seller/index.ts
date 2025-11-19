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
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')

    console.log('Role check:', { user_id: user.id, roles, roleError })

    if (!roles || roles.length === 0) {
      throw new Error('Admin access required')
    }

    const { applicationId } = await req.json()

    console.log('Approving application:', applicationId)

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

    // Check if store already exists for this user
    const { data: existingStore } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('owner_id', application.user_id)
      .maybeSingle()

    let store;
    
    if (existingStore) {
      // Store already exists, use it
      store = existingStore
      console.log('Using existing store:', store.id)
    } else {
      // Create new store
      const { data: newStore, error: storeError } = await supabaseClient
        .from('stores')
        .insert({
          owner_id: application.user_id,
          store_name: application.store_name || application.business_name,
          description: application.store_description || application.business_description,
          logo_url: application.store_logo_url,
          banner_url: application.store_banner_url,
          city: application.store_city,
          region: application.store_region,
          country: application.store_country || 'Sierra Leone'
        })
        .select()
        .single()

      if (storeError) {
        console.error('Store creation error:', storeError)
        throw new Error('Failed to create store: ' + storeError.message)
      }

      store = newStore
      console.log('Store created:', store.id)
    }

    // Add seller role
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: application.user_id,
        role: 'seller'
      })

    if (roleInsertError && !(roleInsertError as any).message?.includes('duplicate')) {
      console.error('Role creation error:', roleInsertError)
      throw new Error('Failed to assign seller role: ' + (roleInsertError as any).message)
    }

    console.log('Seller role assigned')

    // Update application status
    const { error: updateError } = await supabaseClient
      .from('seller_applications')
      .update({
        status: 'approved',
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Application update error:', updateError)
      throw new Error('Failed to update application: ' + updateError.message)
    }

    console.log('Application approved')

    // Create notification
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: application.user_id,
        type: 'seller_approved',
        title: 'Seller Application Approved! 🎉',
        body: 'Congratulations! Your seller application has been approved. You can now start listing products.',
        metadata: { store_id: store.id, application_id: applicationId }
      })

    if (notifError) {
      console.error('Notification error:', notifError)
    }

    // Create audit log
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'seller_application_approved',
        target_type: 'seller_applications',
        target_id: applicationId,
        description: `Approved seller application for ${application.business_name}`,
        metadata: { store_id: store.id }
      })

    if (auditError) {
      console.error('Audit log error:', auditError)
    }

    console.log('Approval complete')

    return new Response(
      JSON.stringify({ 
        success: true, 
        store_id: store.id,
        message: 'Seller application approved successfully'
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
