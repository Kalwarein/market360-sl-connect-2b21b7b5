import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, url, tag, image, icon, actions, requireInteraction } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification to each subscription
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const payload = JSON.stringify({
          title,
          body,
          url: url || '/',
          tag: tag || 'market360-notification',
          icon: icon || '/pwa-192x192.png',
          image: image || null,
          badge: '/pwa-192x192.png',
          actions: actions || [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          requireInteraction: requireInteraction || false
        });

        // Use web-push library to send notification
        const webpush = await import('https://esm.sh/web-push@3.6.6');
        
        webpush.setVapidDetails(
          'mailto:support@market360.app',
          vapidPublicKey,
          vapidPrivateKey
        );

        await webpush.sendNotification(pushSubscription, payload);
        
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('Failed to send push notification:', error);
        
        // If subscription is invalid, delete it
        const err = error as any;
        if (err.statusCode === 410) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
        
        return { success: false, endpoint: subscription.endpoint, error: err.message || 'Unknown error' };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} of ${results.length} push notifications`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    const err = error as any;
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
