-- Main Migration Script
-- Run this in Supabase SQL Editor to set up the database
-- Run this AFTER running schema.sql

-- ============================================
-- Add missing bio column to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================
-- 1. Add message columns for read receipts and soft delete
-- ============================================
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by_sender TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by_receiver TIMESTAMP WITH TIME ZONE;

-- Add reply columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reply TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Add function to add review reply (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.add_review_reply(
    review_id UUID,
    reply_text TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.reviews
    SET reply = reply_text,
        replied_at = TIMEZONE('utc'::text, NOW())
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    notify_on_match BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add notify_on_price_drop column to saved_listings
ALTER TABLE public.saved_listings ADD COLUMN IF NOT EXISTS notify_on_price_drop BOOLEAN DEFAULT FALSE;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS buy_type TEXT DEFAULT 'buy_now' CHECK (buy_type IN ('buy_now', 'reserve'));

-- Add recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    ip_address TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, listing_id)
);

-- Add indexes for recently_viewed
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_listing_id ON public.recently_viewed(listing_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);

-- Enable RLS for recently_viewed
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can view their own recently viewed"
    ON public.recently_viewed FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can insert their own recently viewed"
    ON public.recently_viewed FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can delete their own recently viewed"
    ON public.recently_viewed FOR DELETE
    USING (auth.uid() = user_id);

-- Add listing_templates table
CREATE TABLE IF NOT EXISTS public.listing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
    location TEXT,
    currency TEXT DEFAULT 'PHP',
    buy_type TEXT DEFAULT 'buy_now' CHECK (buy_type IN ('buy_now', 'reserve')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add index for listing_templates
CREATE INDEX IF NOT EXISTS idx_listing_templates_user_id ON public.listing_templates(user_id);

-- Enable RLS for listing_templates
ALTER TABLE public.listing_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own listing templates" ON public.listing_templates;
CREATE POLICY "Users can view their own listing templates"
    ON public.listing_templates FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own listing templates" ON public.listing_templates;
CREATE POLICY "Users can insert their own listing templates"
    ON public.listing_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own listing templates" ON public.listing_templates;
CREATE POLICY "Users can update their own listing templates"
    ON public.listing_templates FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own listing templates" ON public.listing_templates;
CREATE POLICY "Users can delete their own listing templates"
    ON public.listing_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Add saved_listings table
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, listing_id)
);

-- Add indexes for search tables
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON public.saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON public.saved_listings(listing_id);

-- Add indexes for listings to improve search performance
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);

-- RLS Policies for search_history
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
CREATE POLICY "Users can view their own search history"
    ON public.search_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own search history" ON public.search_history;
CREATE POLICY "Users can insert their own search history"
    ON public.search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own search history" ON public.search_history;
CREATE POLICY "Users can delete their own search history"
    ON public.search_history FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for saved_searches
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can view their own saved searches"
    ON public.saved_searches FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can insert their own saved searches"
    ON public.saved_searches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update their own saved searches"
    ON public.saved_searches FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches;
CREATE POLICY "Users can delete their own saved searches"
    ON public.saved_searches FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for saved_listings
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view their own saved listings"
    ON public.saved_listings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can insert their own saved listings"
    ON public.saved_listings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can delete their own saved listings"
    ON public.saved_listings FOR DELETE
    USING (auth.uid() = user_id);

-- Function to check saved searches and send notifications for new listings
CREATE OR REPLACE FUNCTION public.check_saved_search_matches()
RETURNS TRIGGER AS $$
DECLARE
    saved_search RECORD;
    listing_price DECIMAL;
    listing_condition TEXT;
    listing_category_id UUID;
    listing_created_at TIMESTAMP WITH TIME ZONE;
    listing_title TEXT;
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Get listing details
    SELECT price, condition, category_id, created_at, title
    INTO listing_price, listing_condition, listing_category_id, listing_created_at, listing_title
    FROM public.listings WHERE id = NEW.id;

    -- Check against all saved searches
    FOR saved_search IN
        SELECT ss.id, ss.user_id, ss.name, ss.query, ss.filters, ss.notify_on_match
        FROM public.saved_searches ss
        WHERE ss.notify_on_match = true
    LOOP
        -- Check if listing matches the saved search criteria
        IF (
            -- Check category match
            (saved_search.filters->>'category' IS NULL OR saved_search.filters->>'category' = 'all' OR saved_search.filters->>'category' = listing_category_id::TEXT)
            AND
            -- Check condition match
            (saved_search.filters->>'condition' IS NULL OR saved_search.filters->>'condition' = 'all' OR saved_search.filters->>'condition' = listing_condition)
            AND
            -- Check price range match
            (
                saved_search.filters->>'priceRange' IS NULL
                OR listing_price BETWEEN (saved_search.filters->'priceRange'->>0)::DECIMAL AND (saved_search.filters->'priceRange'->>1)::DECIMAL
            )
            AND
            -- Check date posted match (skip for new listings since they're always recent)
            (saved_search.filters->>'datePosted' IS NULL OR saved_search.filters->>'datePosted' = 'all')
            AND
            -- Check query match (title contains query)
            (saved_search.query IS NULL OR saved_search.query = '' OR listing_title ILIKE '%' || saved_search.query || '%')
        ) THEN
            -- Send notification
            notification_title := 'New listing matches your saved search: ' || saved_search.name;
            notification_content := 'A new listing "' || listing_title || '" matches your saved search criteria.';
            
            PERFORM public.create_notification(
                saved_search.user_id,
                'saved_search',
                notification_title,
                notification_content,
                '/listings/' || NEW.id
            );
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check saved searches when a new listing is created
DROP TRIGGER IF EXISTS trigger_check_saved_searches ON public.listings;
CREATE TRIGGER trigger_check_saved_searches
    AFTER INSERT ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_saved_search_matches();

-- Function to check price drops and send notifications
CREATE OR REPLACE FUNCTION public.check_price_drops()
RETURNS TRIGGER AS $$
DECLARE
    saved_item RECORD;
    old_price DECIMAL;
    new_price DECIMAL;
    notification_title TEXT;
    notification_content TEXT;
BEGIN
    -- Only check if price has decreased
    IF NEW.price >= OLD.price THEN
        RETURN NEW;
    END IF;
    
    old_price := OLD.price;
    new_price := NEW.price;
    
    -- Check all saved listings with price drop notifications enabled
    FOR saved_item IN
        SELECT sl.user_id, l.title
        FROM public.saved_listings sl
        JOIN public.listings l ON l.id = sl.listing_id
        WHERE sl.listing_id = NEW.id
        AND sl.notify_on_price_drop = true
    LOOP
        -- Send notification
        notification_title := 'Price Drop Alert: ' || saved_item.title;
        notification_content := 'The price of "' || saved_item.title || '" has dropped from ₱' || old_price || ' to ₱' || new_price || '!';
        
        PERFORM public.create_notification(
            saved_item.user_id,
            'price_drop',
            notification_title,
            notification_content,
            '/listings/' || NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check price drops when listing price is updated
DROP TRIGGER IF EXISTS trigger_check_price_drops ON public.listings;
CREATE TRIGGER trigger_check_price_drops
    AFTER UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_price_drops();

-- Make listing_id nullable (for general conversations not tied to a listing)
ALTER TABLE public.messages 
ALTER COLUMN listing_id DROP NOT NULL;

-- If deleted_at column exists, migrate data to deleted_by_sender
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
        UPDATE public.messages 
        SET deleted_by_sender = deleted_at 
        WHERE deleted_at IS NOT NULL;
        ALTER TABLE public.messages DROP COLUMN IF EXISTS deleted_at;
    END IF;
END $$;

-- ============================================
-- 2. Add orders and addresses tables
-- ============================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gcash', 'maya', 'paymongo', 'bank_transfer', 'cash_on_delivery')),
    provider_name TEXT,
    account_number TEXT,
    account_name TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_confirmation', 'processing', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 3. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================
-- 4. Enable RLS and create policies
-- ============================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can update their orders" ON public.orders;
CREATE POLICY "Buyers can update their orders" ON public.orders
    FOR UPDATE USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
CREATE POLICY "Sellers can update order status" ON public.orders
    FOR UPDATE USING (auth.uid() = seller_id);

-- ============================================
-- 5. Create triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Insert default categories
-- ============================================
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Electronics', 'electronics', 'Phones, laptops, tablets, and other electronic devices', 'laptop'),
('Fashion', 'fashion', 'Clothing, shoes, accessories, and more', 'shirt'),
('Home & Garden', 'home-garden', 'Furniture, appliances, decor, and garden supplies', 'home'),
('Vehicles', 'vehicles', 'Cars, motorcycles, boats, and other vehicles', 'car'),
('Sports & Hobbies', 'sports-hobbies', 'Sports equipment, hobbies, and outdoor gear', 'football'),
('Books & Media', 'books-media', 'Books, movies, music, and games', 'book'),
('Business & Industrial', 'business-industrial', 'Office equipment, tools, and industrial supplies', 'briefcase'),
('Health & Beauty', 'health-beauty', 'Healthcare products, cosmetics, and wellness items', 'heart'),
('Baby & Kids', 'baby-kids', 'Baby products, toys, and children items', 'baby'),
('Pets', 'pets', 'Pet supplies, accessories, and animals', 'paw')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. Create SECURITY DEFINER functions
-- ============================================

-- Create function to insert notification with SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS public.create_notification(UUID, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_notification(
    recipient_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_content TEXT,
    notification_link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (recipient_id, notification_type, notification_title, notification_content, notification_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark messages as read with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_user_id UUID, current_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET is_read = true, read_at = NOW()
    WHERE sender_id = conversation_user_id
    AND receiver_id = current_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for messages table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- Fix increment_listing_views function to handle unique constraints better
DROP FUNCTION IF EXISTS public.increment_listing_views(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.increment_listing_views(p_listing_id UUID, p_user_id UUID DEFAULT NULL, p_ip_address TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Check if this user has already viewed this listing
    IF p_user_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.listing_views
        WHERE listing_id = p_listing_id
        AND user_id = p_user_id
    ) THEN
        -- User already viewed, do nothing
        RETURN;
    END IF;
    
    -- Check if this IP has already viewed this listing (when user_id is null)
    IF p_user_id IS NULL AND p_ip_address IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.listing_views
        WHERE listing_id = p_listing_id
        AND ip_address = p_ip_address
    ) THEN
        -- IP already viewed, do nothing
        RETURN;
    END IF;
    
    -- Insert the view record
    INSERT INTO public.listing_views (listing_id, user_id, ip_address)
    VALUES (p_listing_id, p_user_id, p_ip_address);
    
    -- Increment the view count
    UPDATE public.listings
    SET views = COALESCE(views, 0) + 1
    WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add INSERT policy for notifications table
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 8. Add quantity column to listings table
-- ============================================
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);
