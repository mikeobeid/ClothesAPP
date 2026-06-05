-- Wardrobe App: guest-mode Storage policies for clothing-images bucket
-- Create the bucket manually in Dashboard first, then run this in SQL Editor.

-- Dashboard: Storage → New bucket
--   Name: clothing-images
--   Public bucket: ON

CREATE POLICY "guest_clothing_images_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'clothing-images');

CREATE POLICY "guest_clothing_images_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clothing-images');

CREATE POLICY "guest_clothing_images_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clothing-images')
WITH CHECK (bucket_id = 'clothing-images');

CREATE POLICY "guest_clothing_images_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'clothing-images');
