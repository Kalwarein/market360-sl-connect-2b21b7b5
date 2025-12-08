-- Add scheduled deletion column to products table for 48-hour smart deletion
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient querying of pending deletions
CREATE INDEX IF NOT EXISTS idx_products_scheduled_deletion ON public.products (scheduled_deletion_at) 
WHERE scheduled_deletion_at IS NOT NULL;

-- Add product analytics columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orders_count INTEGER DEFAULT 0;

-- Function to permanently delete products past their scheduled deletion time
CREATE OR REPLACE FUNCTION public.delete_expired_products()
RETURNS void AS $$
BEGIN
  DELETE FROM public.products 
  WHERE scheduled_deletion_at IS NOT NULL 
    AND scheduled_deletion_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a trigger to auto-unpublish products when scheduled for deletion
CREATE OR REPLACE FUNCTION public.handle_product_deletion_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- When scheduled_deletion_at is set, auto-unpublish the product
  IF NEW.scheduled_deletion_at IS NOT NULL AND OLD.scheduled_deletion_at IS NULL THEN
    NEW.published := false;
  END IF;
  
  -- When scheduled_deletion_at is cleared (cancel deletion), allow republishing
  IF NEW.scheduled_deletion_at IS NULL AND OLD.scheduled_deletion_at IS NOT NULL THEN
    -- Don't auto-publish, just allow it
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for product deletion scheduling
DROP TRIGGER IF EXISTS on_product_deletion_schedule ON public.products;
CREATE TRIGGER on_product_deletion_schedule
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_deletion_schedule();