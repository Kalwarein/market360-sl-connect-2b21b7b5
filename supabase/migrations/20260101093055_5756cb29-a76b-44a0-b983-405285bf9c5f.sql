-- Create store_moderation_appeals table
CREATE TABLE IF NOT EXISTS public.store_moderation_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_moderation_id UUID REFERENCES public.store_moderation(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  appeal_message TEXT NOT NULL,
  admin_response TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add suspension_expires_at column to stores for temporary suspensions
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.store_moderation_appeals ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_moderation_appeals
CREATE POLICY "Users can create appeals for own stores"
ON public.store_moderation_appeals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_moderation_appeals.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view appeals for own stores"
ON public.store_moderation_appeals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_moderation_appeals.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all store appeals"
ON public.store_moderation_appeals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update store appeals"
ON public.store_moderation_appeals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));