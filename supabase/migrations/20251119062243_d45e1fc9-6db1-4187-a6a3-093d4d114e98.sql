-- Add notification preferences and language columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"orders": true, "messages": true, "promotions": false, "updates": true}'::jsonb,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'english';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);