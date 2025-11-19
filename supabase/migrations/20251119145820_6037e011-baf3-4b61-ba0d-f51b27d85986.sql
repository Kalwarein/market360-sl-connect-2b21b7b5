-- Update notification preferences to include email toggle (on by default)
-- This runs for existing users
UPDATE profiles 
SET notification_preferences = jsonb_set(
  COALESCE(notification_preferences, '{}'::jsonb),
  '{email_notifications}',
  'true'::jsonb
)
WHERE notification_preferences IS NULL 
   OR NOT (notification_preferences ? 'email_notifications');

-- Update the handle_new_user function to set email notifications on by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, notification_preferences)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    jsonb_build_object(
      'orders', true,
      'updates', true,
      'messages', true,
      'promotions', false,
      'email_notifications', true
    )
  );
  
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, balance_leones)
  VALUES (NEW.id, 0);
  
  -- Assign default buyer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  RETURN NEW;
END;
$function$;