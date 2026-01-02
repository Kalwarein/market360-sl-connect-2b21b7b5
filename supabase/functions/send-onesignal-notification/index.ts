import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, link_url, image_url, data } = await req.json();

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('[OneSignal] Missing credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'OneSignal credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build notification payload
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title || 'Notification' },
      contents: { en: body || '' },
      data: { url: link_url, ...data },
      android_channel_id: 'market360-notifications',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
    };

    // Add image if provided
    if (image_url) {
      payload.big_picture = image_url;
      payload.ios_attachments = { image: image_url };
      payload.chrome_web_image = image_url;
    }

    // Target: specific user OR broadcast
    if (user_id) {
      // Target specific user by external_user_id (Supabase auth.user.id)
      payload.include_aliases = { external_id: [user_id] };
      payload.target_channel = 'push';
      console.log('[OneSignal] Targeting user:', user_id);
    } else {
      // Broadcast to all subscribed users
      payload.included_segments = ['Subscribed Users'];
      console.log('[OneSignal] Broadcasting to all subscribed users');
    }

    console.log('[OneSignal] Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[OneSignal] API error:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ success: false, error: result.errors || result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    console.log('[OneSignal] Success:', JSON.stringify(result));

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: result.id,
        recipients: result.recipients ?? 0,
        external_id: result.external_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[OneSignal] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
