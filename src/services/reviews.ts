import { createClient } from '@/lib/supabase/client'
import type { Review } from '@/types'

const supabase = createClient()

export interface CreateReviewData {
  listing_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
}

export interface UpdateReviewData {
  rating?: number
  comment?: string
  reply?: string
  replied_at?: string
}

export const reviewsService = {
  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get reviews for a listing
   */
  async getReviewsByListing(listingId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get reviews for a listing with reviewer details
   */
  async getReviewsByListingWithDetails(listingId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Fetch reviewer and listing details separately
    const reviewsWithDetails = await Promise.all(
      (data || []).map(async (review) => {
        const [{ data: reviewer }, { data: listing }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, avatar_url').eq('id', review.reviewer_id).single(),
          supabase.from('listings').select('title').eq('id', review.listing_id).single(),
        ])
        return { ...review, reviewer, listing }
      })
    )
    
    return reviewsWithDetails
  },

  /**
   * Get reviews by reviewer (reviews given by user)
   */
  async getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get review by listing and reviewer
   */
  async getReviewByListingAndReviewer(listingId: string, reviewerId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('reviewer_id', reviewerId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /**
   * Get reviews by reviewer with details
   */
  async getReviewsByReviewerWithDetails(reviewerId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Fetch reviewee and listing details separately
    const reviewsWithDetails = await Promise.all(
      (data || []).map(async (review) => {
        const [{ data: reviewee }, { data: listing }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, avatar_url').eq('id', review.reviewee_id).single(),
          supabase.from('listings').select('title').eq('id', review.listing_id).single(),
        ])
        return { ...review, reviewee, listing }
      })
    )
    
    return reviewsWithDetails
  },

  /**
   * Get reviews for a user (reviews received by user)
   */
  async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get reviews for a user with details
   */
  async getReviewsByRevieweeWithDetails(revieweeId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Fetch reviewer and listing details separately
    const reviewsWithDetails = await Promise.all(
      (data || []).map(async (review) => {
        const [{ data: reviewer }, { data: listing }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, avatar_url').eq('id', review.reviewer_id).single(),
          supabase.from('listings').select('title').eq('id', review.listing_id).single(),
        ])
        return { ...review, reviewer, listing }
      })
    )
    
    return reviewsWithDetails
  },

  /**
   * Create a new review
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    const { data: review, error } = await supabase
      .from('reviews')
      .insert(data)
      .select('*')
      .single()
    
    if (error) throw error
    return review
  },

  /**
   * Update a review
   */
  async updateReview(id: string, data: UpdateReviewData): Promise<Review> {
    const updateData: UpdateReviewData & { replied_at?: string } = { ...data }
    
    // If adding a reply, set replied_at timestamp
    if (data.reply && !data.replied_at) {
      updateData.replied_at = new Date().toISOString()
    }
    
    const { data: review, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return review
  },

  /**
   * Add a reply to a review
   */
  async addReply(id: string, reply: string): Promise<Review> {
    try {
      return this.updateReview(id, { reply })
    } catch (error: any) {
      // Handle empty error objects
      if (!error || Object.keys(error).length === 0) {
        throw new Error('Failed to add reply to review')
      }
      throw error
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get average rating for a user
   */
  async getAverageRatingForUser(userId: string): Promise<{ avg: number; count: number }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId)
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return { avg: 0, count: 0 }
    }

    const total = data.reduce((sum, r) => sum + r.rating, 0)
    return {
      avg: total / data.length,
      count: data.length,
    }
  },

  /**
   * Get rating breakdown for a user
   */
  async getRatingBreakdown(userId: string): Promise<{ [key: number]: number }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId)
    
    if (error) throw error
    
    const breakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    for (const review of data || []) {
      breakdown[review.rating] = (breakdown[review.rating] || 0) + 1
    }
    
    return breakdown
  },

  /**
   * Check if user has reviewed a listing
   */
  async hasReviewedListing(listingId: string, reviewerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reviewer_id', reviewerId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    
    return !!data
  },

  /**
   * Get reviews received and given by a user
   */
  async getUserReviews(userId: string): Promise<{ received: Review[]; given: Review[] }> {
    const [received, given] = await Promise.all([
      this.getReviewsByRevieweeWithDetails(userId),
      this.getReviewsByReviewerWithDetails(userId),
    ])
    
    return { received, given }
  },

  /**
   * Count reviews for a user
   */
  async countReviewsForUser(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewee_id', userId)
    
    if (error) throw error
    return count || 0
  },
}
