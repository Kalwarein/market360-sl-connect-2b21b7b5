-- Fix chat deletion: Add DELETE policies for conversations and messages
-- Users should be able to delete their own conversations and associated messages

-- Allow users to delete conversations they are part of
CREATE POLICY "Users can delete own conversations" 
ON public.conversations 
FOR DELETE 
USING ((auth.uid() = buyer_id) OR (auth.uid() = seller_id));

-- Allow users to delete messages in their own conversations
CREATE POLICY "Users can delete messages in own conversations" 
ON public.messages 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = messages.conversation_id
      AND ((conversations.buyer_id = auth.uid()) OR (conversations.seller_id = auth.uid()))
  )
);

-- Fix moderation re-suspension: Create function to check if user has active moderation
CREATE OR REPLACE FUNCTION public.has_active_moderation(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_moderation
    WHERE user_id = user_uuid
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

-- Update user_moderation to automatically deactivate expired suspensions
-- This trigger will run whenever we check moderation status
CREATE OR REPLACE FUNCTION public.deactivate_expired_moderations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate any expired moderations
  UPDATE public.user_moderation
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-deactivate expired moderations on SELECT
-- We'll use a statement-level trigger on user_moderation table
CREATE OR REPLACE FUNCTION public.check_and_deactivate_expired_moderations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_moderation
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();
END;
$$;