import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface SearchHistoryEntry {
  id: string
  user_id: string
  query: string
  filters?: Record<string, unknown>
  created_at: string
}

export interface CreateSearchHistoryData {
  user_id: string
  query: string
  filters?: Record<string, unknown>
}

export const searchHistoryService = {
  /**
   * Get search history for a user
   */
  async getSearchHistory(userId: string, limit = 10): Promise<SearchHistoryEntry[]> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Add search history entry
   */
  async addSearchHistory(data: CreateSearchHistoryData): Promise<SearchHistoryEntry> {
    const { data: entry, error } = await supabase
      .from('search_history')
      .insert(data)
      .select('*')
      .single()
    
    if (error) throw error
    return entry
  },

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
  },
}
