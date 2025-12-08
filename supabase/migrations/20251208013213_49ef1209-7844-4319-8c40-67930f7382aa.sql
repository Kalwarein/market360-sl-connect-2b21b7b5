-- Add promoted product columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promoted_until timestamp with time zone;

-- Create index for promoted products queries
CREATE INDEX IF NOT EXISTS idx_products_promoted ON public.products(is_promoted, promoted_until) WHERE is_promoted = true;