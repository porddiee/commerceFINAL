-- Setup Supabase Storage for listing images
-- Run this in Supabase SQL Editor to create the storage bucket and policies

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to listing images
DROP POLICY IF EXISTS "Public Access to Listing Images" ON storage.objects;
CREATE POLICY "Public Access to Listing Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload listing images
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Allow authenticated users to delete their own listing images
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
