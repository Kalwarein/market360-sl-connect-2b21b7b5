-- Create store_reviews table
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_images TEXT[],
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view store reviews" 
ON public.store_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create store reviews" 
ON public.store_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own store reviews" 
ON public.store_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own store reviews" 
ON public.store_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create store_review_votes table
CREATE TABLE IF NOT EXISTS public.store_review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.store_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.store_review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view store review votes" 
ON public.store_review_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can vote on store reviews" 
ON public.store_review_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own store votes" 
ON public.store_review_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_store_reviews_store_id ON public.store_reviews(store_id);
CREATE INDEX idx_store_reviews_user_id ON public.store_reviews(user_id);
CREATE INDEX idx_store_reviews_rating ON public.store_reviews(rating);
CREATE INDEX idx_store_review_votes_review_id ON public.store_review_votes(review_id);

-- Create updated_at trigger for store_reviews
CREATE TRIGGER update_store_reviews_updated_at
BEFORE UPDATE ON public.store_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();