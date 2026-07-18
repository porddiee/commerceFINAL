-- Migration: Add review_images table for review photo uploads

CREATE TABLE IF NOT EXISTS public.review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON public.review_images(review_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review images are viewable by everyone"
  ON public.review_images FOR SELECT USING (true);

CREATE POLICY "Users can upload review images for their own reviews"
  ON public.review_images FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT reviewer_id FROM public.reviews WHERE id = review_id
    )
  );

CREATE POLICY "Users can delete their own review images"
  ON public.review_images FOR DELETE USING (
    auth.uid() = (
      SELECT reviewer_id FROM public.reviews WHERE id = review_id
    )
  );