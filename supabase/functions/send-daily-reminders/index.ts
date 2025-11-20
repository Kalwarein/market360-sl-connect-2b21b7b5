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

    // Get current hour in GMT
    const currentHour = new Date().getUTCHours();
    
    // Determine time of day and message
    let timeOfDay = '';
    let message = '';
    let emoji = '';
    
    if (currentHour >= 5 && currentHour < 12) {
      timeOfDay = 'morning';
      message = 'Check out today\'s hot deals and new arrivals!';
      emoji = '🌅';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = 'afternoon';
      message = 'Don\'t miss out on trending products!';
      emoji = '☀️';
    } else if (currentHour >= 17 && currentHour < 21) {
      timeOfDay = 'evening';
      message = 'Evening deals are waiting for you!';
      emoji = '🌆';
    } else {
      // Skip night time reminders
      return new Response(
        JSON.stringify({ message: 'Skipping night time reminders' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users with push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('user_id')
      .limit(1000); // Process in batches

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with push subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send reminders to all subscribed users
    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        // Create in-app notification
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: sub.user_id,
            type: 'system',
            title: `${emoji} Good ${timeOfDay}!`,
            body: message,
            link_url: '/'
          });

        // Send push notification
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            userId: sub.user_id,
            title: `${emoji} Good ${timeOfDay}!`,
            body: message,
            url: '/',
            tag: 'daily-reminder',
            icon: '/pwa-192x192.png'
          })
        });

        return { success: true, userId: sub.user_id };
      } catch (error) {
        console.error('Failed to send reminder to user:', sub.user_id, error);
        return { success: false, userId: sub.user_id };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} of ${results.length} daily reminders`,
        timeOfDay,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-daily-reminders function:', error);
    const err = error as any;
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
