-- Create user moderation table for suspensions and bans
CREATE TABLE public.user_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('suspension', 'ban')),
  reason TEXT NOT NULL,
  admin_id UUID NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create appeals table
CREATE TABLE public.moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_id UUID NOT NULL REFERENCES public.user_moderation(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appeal_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_moderation
CREATE POLICY "Admins can view all moderations"
ON public.user_moderation FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert moderations"
ON public.user_moderation FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update moderations"
ON public.user_moderation FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own moderations"
ON public.user_moderation FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for moderation_appeals
CREATE POLICY "Admins can view all appeals"
ON public.moderation_appeals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appeals"
ON public.moderation_appeals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create own appeals"
ON public.moderation_appeals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own appeals"
ON public.moderation_appeals FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_moderation_user_id ON public.user_moderation(user_id);
CREATE INDEX idx_user_moderation_is_active ON public.user_moderation(is_active);
CREATE INDEX idx_moderation_appeals_status ON public.moderation_appeals(status);

-- Add trigger for updated_at
CREATE TRIGGER update_user_moderation_updated_at
BEFORE UPDATE ON public.user_moderation
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();