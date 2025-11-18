-- Create storage buckets for profile pictures, store assets, and chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-pictures', 'profile-pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('store-logos', 'store-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('store-banners', 'store-banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('chat-attachments', 'chat-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for profile-pictures bucket
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for store-logos bucket
CREATE POLICY "Anyone can view store logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');

CREATE POLICY "Store owners can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM stores 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Store owners can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM stores 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policies for store-banners bucket
CREATE POLICY "Anyone can view store banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-banners');

CREATE POLICY "Store owners can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-banners' AND
  EXISTS (
    SELECT 1 FROM stores 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Store owners can update banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-banners' AND
  EXISTS (
    SELECT 1 FROM stores 
    WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  )
);

-- RLS Policies for chat-attachments bucket
CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id::text = (storage.foldername(name))[1]
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

CREATE POLICY "Users can upload attachments to their conversations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id::text = (storage.foldername(name))[1]
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;