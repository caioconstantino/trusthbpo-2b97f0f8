-- Drop existing policies if any for escolas bucket
DROP POLICY IF EXISTS "Public can view escola logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload escola logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update escola logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete escola logos" ON storage.objects;

-- Create policies for escolas bucket
CREATE POLICY "Public can view escola logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'escolas');

CREATE POLICY "Admins can upload escola logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'escolas' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update escola logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'escolas' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete escola logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'escolas' AND public.has_role(auth.uid(), 'admin'));