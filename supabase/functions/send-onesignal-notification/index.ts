import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      title, 
      body, 
      link_url, 
      image_url,
      data 
    } = await req.json();

    console.log('Sending OneSignal notification to user:', user_id);

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured');
    }

    // Create Supabase client to fetch user's OneSignal player ID
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's OneSignal player ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onesignal_player_id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile?.onesignal_player_id) {
      console.log('User does not have OneSignal player ID registered');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User not subscribed to push notifications' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Send notification via OneSignal REST API
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [profile.onesignal_player_id],
      headings: { en: title },
      contents: { en: body },
      data: {
        url: link_url,
        ...data
      },
      ...(image_url && { 
        big_picture: image_url,
        large_icon: image_url 
      }),
      android_channel_id: "market360-notifications"
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(notificationPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      throw new Error(`OneSignal API error: ${JSON.stringify(result)}`);
    }

    console.log('OneSignal notification sent successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id: result.id,
        recipients: result.recipients 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error sending OneSignal notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
