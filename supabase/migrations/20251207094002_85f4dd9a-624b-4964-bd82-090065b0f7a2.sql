-- Create a policy to allow authenticated users to upload deposit evidence
CREATE POLICY "Users can upload deposit evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Also allow users to view their own uploads
CREATE POLICY "Users can view their deposit evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);