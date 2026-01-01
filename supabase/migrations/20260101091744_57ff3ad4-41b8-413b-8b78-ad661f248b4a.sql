-- Add status column to stores table
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add status column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create store_moderation table for detailed moderation history
CREATE TABLE IF NOT EXISTS public.store_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'suspend', 'ban', 'unsuspend', 'unban'
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_moderation table for detailed moderation history
CREATE TABLE IF NOT EXISTS public.product_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'suspend', 'ban', 'delete', 'unsuspend', 'unban'
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.store_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_moderation ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_moderation
CREATE POLICY "Admins can view all store moderations"
ON public.store_moderation FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert store moderations"
ON public.store_moderation FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_moderation
CREATE POLICY "Admins can view all product moderations"
ON public.product_moderation FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert product moderations"
ON public.product_moderation FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies to stores table for full access
CREATE POLICY "Admins can view all stores"
ON public.stores FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all stores"
ON public.stores FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies to products table for full access
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all products"
ON public.products FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all products"
ON public.products FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to wallets for viewing
CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to transactions for viewing
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Modify public product visibility to exclude suspended/banned products
DROP POLICY IF EXISTS "Anyone can view published products" ON public.products;
CREATE POLICY "Anyone can view published active products"
ON public.products FOR SELECT
USING (published = true AND status = 'active');

-- Modify public store visibility to exclude suspended/banned stores
DROP POLICY IF EXISTS "Anyone can view published stores" ON public.stores;
CREATE POLICY "Anyone can view active stores"
ON public.stores FOR SELECT
USING (status = 'active');