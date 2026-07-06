// Shared types for web and mobile apps
export type { Database } from '@/lib/supabase/types'

// Profile types
export interface Profile {
  id: string
  email: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  is_verified_seller: boolean
  verification_document: string | null
  verification_status: 'none' | 'pending' | 'approved' | 'rejected'
  verification_rejection_reason: string | null
  phone: string | null
  location: string | null
  created_at: string
  updated_at: string
}

// Listing types
export interface Listing {
  id: string
  seller_id: string
  category_id: string
  title: string
  description: string
  price: number
  currency: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  location: string
  images: string[]
  status: 'active' | 'sold' | 'pending' | 'draft'
  views: number
  created_at: string
  updated_at: string
  seller?: Profile
  category?: Category
}

export interface ListingWithDetails extends Listing {
  seller: Profile
  category: Category
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

// Message types
export interface Message {
  id: string
  listing_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
  listing?: Listing
}

export interface Conversation {
  listing_id: string
  other_user_id: string
  other_user: Profile
  listing: Listing
  last_message: Message
  unread_count: number
}

// Review types
export interface Review {
  id: string
  listing_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
  reply?: string
  replied_at?: string
  created_at: string
  updated_at: string
  reviewer?: Profile
  reviewee?: Profile
  listing?: Listing
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: 'message' | 'review' | 'listing_update' | 'system'
  title: string
  content: string
  is_read: boolean
  link: string | null
  created_at: string
}

// Saved listing types
export interface SavedListing {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

// Common types
export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type ListingStatus = 'active' | 'sold' | 'pending' | 'draft'
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type NotificationType = 'message' | 'review' | 'listing_update' | 'system'
export type UserRole = 'user' | 'admin'

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pages: number
}

// Filter types
export interface ListingFilters {
  category_id?: string
  condition?: Condition
  min_price?: number
  max_price?: number
  location?: string
  search?: string
  status?: ListingStatus
}

export interface SortOptions {
  field: 'created_at' | 'price' | 'views' | 'title'
  order: 'asc' | 'desc'
}
