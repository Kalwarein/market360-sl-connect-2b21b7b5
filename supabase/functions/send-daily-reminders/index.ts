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

    // Get current time in GMT
    const now = new Date();
    const currentHour = now.getUTCHours();

    console.log(`Running daily reminders at ${now.toISOString()}, GMT hour: ${currentHour}`);

    // Determine time of day and message - only 8 AM and 6 PM
    let timeOfDay: 'morning' | 'evening' | null = null;
    let message = '';
    let emoji = '';

    // 8 AM GMT
    if (currentHour === 8) {
      timeOfDay = 'morning';
      message = 'Start your day with great deals and new products on Market360!';
      emoji = '🌅';
    } 
    // 6 PM GMT (18:00)
    else if (currentHour === 18) {
      timeOfDay = 'evening';
      message = 'Check out what\'s new this evening on Market360 - browse stores and discover deals!';
      emoji = '🌆';
    } else {
      console.log(`Not a scheduled reminder time. Current hour: ${currentHour}`);
      return new Response(
        JSON.stringify({ message: 'Not a scheduled reminder time' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get all users with their profile info
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, name, full_name, notification_preferences');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users to send reminders to`);

    let successCount = 0;
    let skippedCount = 0;

    // Send reminders to each user
    for (const profile of profiles || []) {
      try {
        const userName = profile.full_name || profile.name || 'there';

        // Create in-app notification
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: profile.id,
            type: 'system',
            title: `${emoji} Good ${timeOfDay}!`,
            body: message,
            link_url: '/',
          });

        if (notificationError) {
          console.error(`Error creating notification for user ${profile.id}:`, notificationError);
        }

        // Check if user has email notifications enabled
        const notifPrefs = profile.notification_preferences as any;
        const emailEnabled = notifPrefs?.email_notifications !== false;
        
        if (!emailEnabled) {
          console.log(`Email notifications disabled for user ${profile.id}, skipping email`);
          skippedCount++;
          continue;
        }

        // Send email via send-email function
        const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
          body: {
            type: 'daily_reminder',
            to: profile.email,
            data: {
              userName,
              timeOfDay,
              message,
            },
          },
        });

        if (emailError) {
          console.error(`Error sending email to ${profile.email}:`, emailError);
        } else {
          console.log(`Successfully sent ${timeOfDay} reminder to ${profile.email}`);
          successCount++;
        }

        // Also send push notification if user has subscriptions
        try {
          await supabaseClient.functions.invoke('send-push-notification', {
            body: {
              userId: profile.id,
              title: `${emoji} Good ${timeOfDay}!`,
              body: message,
              url: '/',
              tag: 'daily-reminder',
              icon: '/pwa-192x192.png'
            }
          });
        } catch (pushError) {
          console.error(`Error sending push notification to user ${profile.id}:`, pushError);
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
      }
    }

    console.log(`Daily reminders completed: ${successCount} emails sent, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        timeOfDay,
        emailsSent: successCount,
        skipped: skippedCount,
        total: profiles?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-daily-reminders:', error);
    const err = error as Error;
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
