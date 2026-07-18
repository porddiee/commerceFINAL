-- Migration: Create storage bucket and policies for review images

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Review images are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Users can upload review images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'review-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own review images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'review-images'
    AND auth.uid() = (
      SELECT reviewer_id FROM public.reviews WHERE id = (storage.objects.metadata->>'review_id')::uuid
    )
  );