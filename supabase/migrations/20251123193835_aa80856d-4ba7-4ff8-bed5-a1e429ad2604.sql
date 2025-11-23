-- Create storage bucket for report evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for report-evidence bucket
CREATE POLICY "Users can upload own report evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-evidence' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own report evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-evidence' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all report evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-evidence' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);