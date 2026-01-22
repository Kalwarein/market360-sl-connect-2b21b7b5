-- Add recovery and PIN fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pin_hash text,
ADD COLUMN IF NOT EXISTS pin_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS recovery_code1_hash text,
ADD COLUMN IF NOT EXISTS recovery_code2_hash text,
ADD COLUMN IF NOT EXISTS recovery_code_generated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS recovery_regeneration_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_regeneration_month integer,
ADD COLUMN IF NOT EXISTS recovery_setup_completed boolean DEFAULT false;

-- Create recovery_attempts table for security logging
CREATE TABLE IF NOT EXISTS public.recovery_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  attempt_type text NOT NULL, -- 'recovery_code' or 'pin'
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recovery_attempts
ALTER TABLE public.recovery_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view recovery attempts
CREATE POLICY "Admins can view all recovery attempts"
ON public.recovery_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert recovery attempts
CREATE POLICY "System can insert recovery attempts"
ON public.recovery_attempts FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_email ON public.recovery_attempts(email);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_created_at ON public.recovery_attempts(created_at DESC);