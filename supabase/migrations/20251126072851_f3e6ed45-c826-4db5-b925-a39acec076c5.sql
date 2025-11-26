-- Fix review system to allow reviews without requiring completed orders
-- and ensure users can review different products (max once per product)

-- Drop the restrictive RLS policy
DROP POLICY IF EXISTS "Buyers can create reviews for purchased products" ON product_reviews;

-- Create new policy that allows any authenticated user to review products
CREATE POLICY "Users can create reviews for products" 
ON product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate reviews on same product by same user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'product_reviews_user_product_unique'
  ) THEN
    ALTER TABLE product_reviews 
    ADD CONSTRAINT product_reviews_user_product_unique 
    UNIQUE (user_id, product_id);
  END IF;
END $$;

-- Similarly fix store reviews
DROP POLICY IF EXISTS "Users can create store reviews" ON store_reviews;

CREATE POLICY "Users can create store reviews" 
ON store_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint for store reviews
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'store_reviews_user_store_unique'
  ) THEN
    ALTER TABLE store_reviews 
    ADD CONSTRAINT store_reviews_user_store_unique 
    UNIQUE (user_id, store_id);
  END IF;
END $$;