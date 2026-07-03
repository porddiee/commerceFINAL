import { createClient } from '@/lib/supabase/client'
import type { Listing, ListingWithDetails, ListingFilters, SortOptions, Condition, ListingStatus } from '@/types'

const supabase = createClient()

export interface CreateListingData {
  seller_id: string
  category_id: string
  title: string
  description: string
  price: number
  condition: Condition
  location: string
  images: string[]
  quantity?: number
  currency?: string
  status?: ListingStatus
}

export interface UpdateListingData {
  category_id?: string
  title?: string
  description?: string
  price?: number
  condition?: Condition
  location?: string
  images?: string[]
  quantity?: number
  status?: ListingStatus
}

export const listingsService = {
  /**
   * Get listing by ID
   */
  async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get listing by ID with seller and category details
   */
  async getListingWithDetails(id: string): Promise<ListingWithDetails | null> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey (*),
        category:categories (*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as ListingWithDetails
  },

  /**
   * Get all listings with optional filters
   */
  async getListings(filters?: ListingFilters, sort?: SortOptions, page = 1, limit = 20): Promise<{ data: Listing[]; count: number }> {
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.condition) {
      query = query.eq('condition', filters.condition)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters?.min_price) {
      query = query.gte('price', filters.min_price)
    }
    if (filters?.max_price) {
      query = query.lte('price', filters.max_price)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query
    
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  /**
   * Get listings by seller ID
   */
  async getListingsBySeller(sellerId: string, status?: ListingStatus): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
    
    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  /**
   * Get listings by seller ID with category details
   */
  async getListingsBySellerWithDetails(sellerId: string, status?: ListingStatus): Promise<ListingWithDetails[]> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories (*)
      `)
      .eq('seller_id', sellerId)
    
    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as ListingWithDetails[]
  },

  /**
   * Get active listings
   */
  async getActiveListings(limit = 50): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get featured/trending listings (by views)
   */
  async getFeaturedListings(limit = 10): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('views', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get trending products (recent + high views)
   */
  async getTrendingProducts(limit = 10): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to filter
    
    if (error) throw error
    
    // Sort by views locally for trending effect
    return (data || [])
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  },

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingData): Promise<Listing> {
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        ...data,
        quantity: data.quantity || 1,
        currency: data.currency || 'PHP',
        status: data.status || 'active',
        views: 0,
      })
      .select('*')
      .single()
    
    if (error) throw error
    return listing
  },

  /**
   * Update a listing
   */
  async updateListing(id: string, data: UpdateListingData): Promise<Listing> {
    const { data: listing, error } = await supabase
      .from('listings')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return listing
  },

  /**
   * Delete a listing
   */
  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Increment listing views
   */
  async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_views', { listing_id: id })
    
    // If RPC doesn't exist, fall back to direct update
    if (error) {
      const { data: listing } = await supabase
        .from('listings')
        .select('views')
        .eq('id', id)
        .single()
      
      if (listing) {
        await supabase
          .from('listings')
          .update({ views: listing.views + 1 })
          .eq('id', id)
      }
    }
  },

  /**
   * Update listing status
   */
  async updateStatus(id: string, status: ListingStatus): Promise<Listing> {
    return this.updateListing(id, { status })
  },

  /**
   * Update listing quantity
   */
  async updateQuantity(id: string, quantity: number): Promise<Listing> {
    return this.updateListing(id, { quantity })
  },

  /**
   * Get price suggestions for a category and condition
   */
  async getPriceSuggestion(categoryId: string, condition: Condition): Promise<{ min: number; avg: number; max: number } | null> {
    const { data, error } = await supabase
      .from('listings')
      .select('price')
      .eq('category_id', categoryId)
      .eq('condition', condition)
      .eq('status', 'active')
      .limit(50)
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return null
    }

    const prices = data.map((l: { price: number }) => l.price)
    return {
      min: Math.min(...prices),
      avg: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
      max: Math.max(...prices),
    }
  },

  /**
   * Search listings
   */
  async searchListings(query: string, filters?: ListingFilters, limit = 20): Promise<Listing[]> {
    let supabaseQuery = supabase
      .from('listings')
      .select('*')
      .ilike('title', `%${query}%`)
      .eq('status', 'active')
      .limit(limit)

    if (filters?.category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', filters.category_id)
    }
    if (filters?.condition) {
      supabaseQuery = supabaseQuery.eq('condition', filters.condition)
    }
    if (filters?.min_price) {
      supabaseQuery = supabaseQuery.gte('price', filters.min_price)
    }
    if (filters?.max_price) {
      supabaseQuery = supabaseQuery.lte('price', filters.max_price)
    }

    const { data, error } = await supabaseQuery
    
    if (error) throw error
    return data || []
  },

  /**
   * Count active listings
   */
  async countActiveListings(): Promise<number> {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (error) throw error
    return count || 0
  },

  /**
   * Count listings by seller
   */
  async countListingsBySeller(sellerId: string, status?: ListingStatus): Promise<number> {
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
    
    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  },

  /**
   * Count all listings
   */
  async countAllListings(): Promise<number> {
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  },

  /**
   * Get all listings (admin use)
   */
  async getAllListings(limit = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, status, created_at, category_id, seller_id')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
}
