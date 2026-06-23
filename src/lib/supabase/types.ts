export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
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
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_verified_seller?: boolean
          verification_document?: string | null
          verification_status?: 'none' | 'pending' | 'approved' | 'rejected'
          verification_rejection_reason?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_verified_seller?: boolean
          verification_document?: string | null
          verification_status?: 'none' | 'pending' | 'approved' | 'rejected'
          verification_rejection_reason?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
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
        }
        Insert: {
          id?: string
          seller_id: string
          category_id: string
          title: string
          description: string
          price: number
          currency?: string
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
          location: string
          images?: string[]
          status?: 'active' | 'sold' | 'pending' | 'draft'
          views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          category_id?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
          location?: string
          images?: string[]
          status?: 'active' | 'sold' | 'pending' | 'draft'
          views?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          listing_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          listing_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      saved_listings: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'review' | 'listing_update' | 'system'
          title: string
          content: string
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'review' | 'listing_update' | 'system'
          title: string
          content: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'review' | 'listing_update' | 'system'
          title?: string
          content?: string
          is_read?: boolean
          link?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
