import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      user_id,        // Target user (external_user_id) - optional for broadcast
      title, 
      body, 
      link_url, 
      image_url,
      data,
      is_broadcast    // If true, sends to all users
    } = await req.json();

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('[OneSignal] Credentials not configured');
      throw new Error('OneSignal credentials not configured');
    }

    // Build notification payload
    const notificationPayload: Record<string, any> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: body },
      data: {
        url: link_url,
        ...data
      },
      android_channel_id: "market360-notifications",
      // iOS specific
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
    };

    // Add image if provided
    if (image_url) {
      notificationPayload.big_picture = image_url;
      notificationPayload.ios_attachments = { image: image_url };
      notificationPayload.chrome_web_image = image_url;
    }

    // Target: broadcast to all OR specific user via external_user_id
    if (is_broadcast) {
      // Broadcast to all subscribed users
      notificationPayload.included_segments = ["Subscribed Users"];
      console.log('[OneSignal] Sending broadcast notification');
    } else if (user_id) {
      // Target specific user by external_user_id (auth.user.id)
      notificationPayload.include_aliases = {
        external_id: [user_id]
      };
      notificationPayload.target_channel = "push";
      console.log('[OneSignal] Sending notification to user:', user_id);
    } else {
      console.error('[OneSignal] No target specified (user_id or is_broadcast required)');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No target specified. Provide user_id or set is_broadcast=true' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[OneSignal] Sending notification with payload:', JSON.stringify(notificationPayload, null, 2));

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
      console.error('[OneSignal] API error:', JSON.stringify(result));
      throw new Error(`OneSignal API error: ${JSON.stringify(result)}`);
    }

    console.log('[OneSignal] Notification sent successfully:', JSON.stringify(result));

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification_id: result.id,
        recipients: result.recipients,
        external_id: result.external_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[OneSignal] Error sending notification:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
