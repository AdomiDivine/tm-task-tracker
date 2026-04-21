
DROP POLICY IF EXISTS "Public read task attachments" ON storage.objects;

-- Allow direct fetches by URL (public bucket still serves files), but block listing
CREATE POLICY "Authenticated read task attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'task-attachments');
