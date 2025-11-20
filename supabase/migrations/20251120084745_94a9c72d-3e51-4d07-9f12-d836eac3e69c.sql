-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminder notifications
-- Runs three times a day: morning (6 AM UTC), afternoon (12 PM UTC), evening (6 PM UTC)

-- Morning reminder (6 AM UTC)
SELECT cron.schedule(
    'send-morning-reminders',
    '0 6 * * *',
    $$
    SELECT
      net.http_post(
        url:=current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-reminders',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body:=jsonb_build_object('time', 'morning')
      ) as request_id;
    $$
);

-- Afternoon reminder (12 PM UTC)
SELECT cron.schedule(
    'send-afternoon-reminders',
    '0 12 * * *',
    $$
    SELECT
      net.http_post(
        url:=current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-reminders',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body:=jsonb_build_object('time', 'afternoon')
      ) as request_id;
    $$
);

-- Evening reminder (6 PM UTC)
SELECT cron.schedule(
    'send-evening-reminders',
    '0 18 * * *',
    $$
    SELECT
      net.http_post(
        url:=current_setting('app.settings.supabase_url') || '/functions/v1/send-daily-reminders',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body:=jsonb_build_object('time', 'evening')
      ) as request_id;
    $$
);
