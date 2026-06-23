-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified_seller BOOLEAN DEFAULT FALSE,
    verification_document TEXT,
    verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected')),
    verification_rejection_reason TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PHP',
    condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    location TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending', 'draft')),
    buy_type TEXT DEFAULT 'buy_now' CHECK (buy_type IN ('buy_now', 'reserve')),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_by_sender TIMESTAMP WITH TIME ZONE,
    deleted_by_receiver TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(reviewer_id, listing_id)
);

-- Create saved_listings table
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    notify_on_price_drop BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, listing_id)
);

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    ip_address TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create listing_templates table
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

-- Create listing_views table for unique views tracking
CREATE TABLE IF NOT EXISTS public.listing_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(listing_id, user_id),
    UNIQUE(listing_id, ip_address)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'review', 'listing_update', 'system')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create orders table
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

-- Create addresses table
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

-- Create payment_methods table
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

-- Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create saved_searches table
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

-- Create saved_listings table
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    notify_on_price_drop BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, listing_id)
);

-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    ip_address TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create listing_templates table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON public.saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON public.saved_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_listing_id ON public.recently_viewed(listing_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_templates_user_id ON public.listing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_id ON public.listing_views(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
    ON public.profiles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
    ON public.categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for listings
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
    ON public.listings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can delete any listing" ON public.listings;
CREATE POLICY "Admins can delete any listing"
    ON public.listings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Verified sellers can insert listings" ON public.listings;
CREATE POLICY "Verified sellers can insert listings"
    ON public.listings FOR INSERT
    WITH CHECK (
        auth.uid() = seller_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_verified_seller = TRUE
        )
    );

DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.listings;
CREATE POLICY "Sellers can update their own listings"
    ON public.listings FOR UPDATE
    USING (
        auth.uid() = seller_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to increment views with SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS public.increment_listing_views(UUID, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.increment_listing_views(p_listing_id UUID, p_user_id UUID DEFAULT NULL, p_ip_address TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Check if this user/IP has already viewed this listing
    IF NOT EXISTS (
        SELECT 1 FROM public.listing_views
        WHERE listing_id = p_listing_id
        AND (user_id = p_user_id OR ip_address = p_ip_address)
    ) THEN
        -- Insert the view record
        INSERT INTO public.listing_views (listing_id, user_id, ip_address)
        VALUES (p_listing_id, p_user_id, p_ip_address);
        
        -- Increment the view count
        UPDATE public.listings
        SET views = views + 1
        WHERE id = p_listing_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

DROP POLICY IF EXISTS "Authenticated users can increment views" ON public.listings;
CREATE POLICY "Authenticated users can increment views"
    ON public.listings FOR UPDATE
    USING (false); -- Disable direct updates, use function instead

DROP POLICY IF EXISTS "Sellers can delete their own listings" ON public.listings;
CREATE POLICY "Sellers can delete their own listings"
    ON public.listings FOR DELETE
    USING (
        auth.uid() = seller_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Message receivers can update read status" ON public.messages;
CREATE POLICY "Message receivers can update read status"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Function to add reply to review (SECURITY DEFINER to bypass RLS)
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

-- RLS Policies for reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert reviews for transactions" ON public.reviews;
CREATE POLICY "Users can insert reviews for transactions"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Reviewers can update their own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- RLS Policies for saved_listings
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

-- RLS Policies for listing_views
DROP POLICY IF EXISTS "Users can view listing views" ON public.listing_views;
CREATE POLICY "Users can view listing views"
    ON public.listing_views FOR SELECT
    USING (true); -- Anyone can view listing views for analytics

DROP POLICY IF EXISTS "Function can insert listing views" ON public.listing_views;
CREATE POLICY "Function can insert listing views"
    ON public.listing_views FOR INSERT
    WITH CHECK (true); -- Function bypasses RLS with SECURITY DEFINER

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Users can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
CREATE POLICY "Sellers can update order status"
    ON public.orders FOR UPDATE
    USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can cancel their orders" ON public.orders;
CREATE POLICY "Buyers can cancel their orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = buyer_id AND status = 'pending');

-- RLS Policies for addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses"
    ON public.addresses FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses"
    ON public.addresses FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for search_history
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

-- RLS Policies for recently_viewed
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

-- RLS Policies for listing_templates
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

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create trigger for listing_templates updated_at
DROP TRIGGER IF EXISTS trigger_update_listing_templates_updated_at ON public.listing_templates;
CREATE TRIGGER trigger_update_listing_templates_updated_at
    BEFORE UPDATE ON public.listing_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user signup using DO block
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if trigger doesn't exist or other issues
        NULL;
END $$;

-- Enable Realtime for messages table
-- Skip if already added to avoid duplicate error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
