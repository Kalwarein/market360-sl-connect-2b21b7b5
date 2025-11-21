-- Create store_perks table for tracking purchased perks
CREATE TABLE IF NOT EXISTS public.store_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  perk_type TEXT NOT NULL,
  perk_name TEXT NOT NULL,
  price_paid NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_perks ENABLE ROW LEVEL SECURITY;

-- Store owners can view their own perks
CREATE POLICY "Store owners can view own perks"
ON public.store_perks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_perks.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Store owners can insert their own perks
CREATE POLICY "Store owners can insert own perks"
ON public.store_perks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_perks.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Anyone can view active perks (for public display)
CREATE POLICY "Anyone can view active perks"
ON public.store_perks
FOR SELECT
USING (is_active = true);

-- Add index for faster queries
CREATE INDEX idx_store_perks_store_id ON public.store_perks(store_id);
CREATE INDEX idx_store_perks_is_active ON public.store_perks(is_active);
CREATE INDEX idx_store_perks_expires_at ON public.store_perks(expires_at);