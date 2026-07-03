import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface RecentlyViewedEntry {
  id: string
  user_id: string
  listing_id: string
  ip_address?: string
  viewed_at: string
}

export interface CreateRecentlyViewedData {
  user_id?: string
  listing_id: string
  ip_address?: string
}

export interface RecentlyViewedListing {
  id: string
  title: string
  price: number
  images: string[]
  status: string
  sellerName: string
  sellerAvatar?: string
}

export const recentlyViewedService = {
  /**
   * Get recently viewed listings for a user
   */
  async getRecentlyViewed(userId: string, limit = 8): Promise<RecentlyViewedListing[]> {
    try {
      const { data } = await supabase
        .from('recently_viewed')
        .select(`
          listings (
            *,
            profiles!listings_seller_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit)
      
      // Remove duplicates by listing ID
      const uniqueListings = data?.map((item: any) => ({
        ...item.listings,
        sellerName: item.profiles?.full_name || 'Unknown',
        sellerAvatar: item.profiles?.avatar_url
      })).filter(Boolean) || []
      
      const seen = new Set()
      const deduplicated = uniqueListings.filter((listing: RecentlyViewedListing) => {
        if (seen.has(listing.id)) return false
        seen.add(listing.id)
        return true
      })
      
      return deduplicated
    } catch (error: unknown) {
      // Silently ignore if table doesn't exist (PGRST116 or 404 errors)
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code
        if (errorCode !== 'PGRST116' && errorCode !== '42P01') {
          throw error
        }
      }
      return []
    }
  },

  /**
   * Add recently viewed entry
   */
  async addRecentlyViewed(data: CreateRecentlyViewedData): Promise<void> {
    try {
      await supabase
        .from('recently_viewed')
        .upsert(data, { onConflict: 'user_id,listing_id' })
    } catch (error: unknown) {
      // Silently ignore if table doesn't exist
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code
        if (errorCode !== 'PGRST116' && errorCode !== '42P01') {
          throw error
        }
      }
    }
  },

  /**
   * Remove recently viewed entry
   */
  async removeRecentlyViewed(userId: string, listingId: string): Promise<void> {
    try {
      await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId)
    } catch (error: unknown) {
      // Silently ignore if table doesn't exist
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code
        if (errorCode !== 'PGRST116' && errorCode !== '42P01') {
          throw error
        }
      }
    }
  },

  /**
   * Clear recently viewed for a user
   */
  async clearRecentlyViewed(userId: string): Promise<void> {
    try {
      await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', userId)
    } catch (error: unknown) {
      // Silently ignore if table doesn't exist
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code
        if (errorCode !== 'PGRST116' && errorCode !== '42P01') {
          throw error
        }
      }
    }
  },
}
