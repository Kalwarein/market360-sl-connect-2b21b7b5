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
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: application.user_id,
        type: 'system',
        title: 'Seller Application Approved! 🎉',
        body: `Congratulations! Your seller application has been approved. Your store "${application.store_name || application.business_name}" is now live on Market360. Start adding products and grow your business!`,
        link_url: '/seller/dashboard'
      })

    console.log('Notification created')

    // Send approval email
    try {
      const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
        body: {
          to: application.contact_email,
          type: 'seller_approved',
          data: {
            sellerName: application.contact_person,
            businessName: application.business_name,
            storeName: application.store_name || application.business_name,
            storeUrl: `${Deno.env.get('SUPABASE_URL')}`
          }
        }
      });

      if (emailError) {
        console.error('Email send error:', emailError);
      } else {
        console.log('Approval email sent to:', application.contact_email);
      }
    } catch (emailErr) {
      console.error('Failed to send approval email:', emailErr);
    }

    // Create audit log
    await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'seller_application_approved',
        target_id: application.id,
        target_type: 'seller_application',
        description: `Approved seller application for ${application.business_name}`
      })

    console.log('Audit log created')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Seller application approved successfully',
        store_id: store.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
