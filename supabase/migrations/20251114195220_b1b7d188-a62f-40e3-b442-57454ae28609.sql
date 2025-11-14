-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'seller')
);

CREATE POLICY "Sellers can update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'seller')
);

CREATE POLICY "Sellers can delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'seller')
);

-- Create product_views table to track trending products
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  search_query TEXT
);

CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- Enable RLS on product_views
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert product views"
ON public.product_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view product views"
ON public.product_views FOR SELECT
USING (true);