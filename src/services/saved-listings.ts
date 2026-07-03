import { createClient } from '@/lib/supabase/client'
import type { SavedListing, Listing } from '@/types'

const supabase = createClient()

export interface CreateSavedListingData {
  user_id: string
  listing_id: string
  notify_on_price_drop?: boolean
}

export interface UpdateSavedListingData {
  notify_on_price_drop?: boolean
}

export const savedListingsService = {
  /**
   * Get saved listing by ID
   */
  async getSavedListingById(id: string): Promise<SavedListing | null> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get all saved listings for a user
   */
  async getSavedListingsByUser(userId: string): Promise<SavedListing[]> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get saved listings for a user with listing details
   */
  async getSavedListingsWithDetails(userId: string): Promise<(SavedListing & { listing: Listing })[]> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        *,
        listings (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []) as (SavedListing & { listing: Listing })[]
  },

  /**
   * Check if a listing is saved by a user
   */
  async isListingSaved(userId: string, listingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    
    return !!data
  },

  /**
   * Get saves by listing IDs
   */
  async getSavesByListingIds(listingIds: string[]): Promise<SavedListing[]> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('*')
      .in('listing_id', listingIds)
    
    if (error) throw error
    return data || []
  },

  /**
   * Create a saved listing
   */
  async createSavedListing(data: CreateSavedListingData): Promise<SavedListing> {
    const { data: savedListing, error } = await supabase
      .from('saved_listings')
      .insert({
        ...data,
        notify_on_price_drop: data.notify_on_price_drop || false,
      })
      .select('*')
      .single()
    
    if (error) throw error
    return savedListing
  },

  /**
   * Update a saved listing
   */
  async updateSavedListing(id: string, data: UpdateSavedListingData): Promise<SavedListing> {
    const { data: savedListing, error } = await supabase
      .from('saved_listings')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return savedListing
  },

  /**
   * Toggle price drop notification for a saved listing
   */
  async togglePriceDropNotification(userId: string, listingId: string): Promise<SavedListing> {
    // First check if it exists
    const { data: existing } = await supabase
      .from('saved_listings')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single()
    
    if (!existing) {
      throw new Error('Saved listing not found')
    }
    
    try {
      return await this.updateSavedListing(existing.id, {
        notify_on_price_drop: !existing.notify_on_price_drop,
      })
    } catch (error: any) {
      // Treat any error as feature not available (column likely missing)
      throw new Error('Price drop notification feature not available')
    }
  },

  /**
   * Delete a saved listing
   */
  async deleteSavedListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Delete a saved listing by user and listing ID
   */
  async deleteSavedListingByUserAndListing(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId)
    
    if (error) throw error
  },

  /**
   * Save or unsave a listing (toggle)
   */
  async toggleSavedListing(userId: string, listingId: string): Promise<{ saved: boolean; savedListing?: SavedListing }> {
    const isSaved = await this.isListingSaved(userId, listingId)
    
    if (isSaved) {
      await this.deleteSavedListingByUserAndListing(userId, listingId)
      return { saved: false }
    } else {
      const savedListing = await this.createSavedListing({
        user_id: userId,
        listing_id: listingId,
        notify_on_price_drop: false,
      })
      return { saved: true, savedListing }
    }
  },

  /**
   * Get saved listings with price drop notification enabled
   */
  async getSavedListingsWithPriceDropAlert(userId: string): Promise<(SavedListing & { listing: Listing })[]> {
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        *,
        listings (*)
      `)
      .eq('user_id', userId)
      .eq('notify_on_price_drop', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []) as (SavedListing & { listing: Listing })[]
  },

  /**
   * Count saved listings for a user
   */
  async countSavedListings(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('saved_listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) throw error
    return count || 0
  },
}
