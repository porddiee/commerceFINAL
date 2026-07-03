import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

const supabase = createClient()

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  parent_id?: string | null
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string | null
  icon?: string | null
  parent_id?: string | null
}

export interface CategoryWithCount extends Category {
  active_listings_count?: number
}

export const categoriesService = {
  /**
   * Get all categories ordered by name
   */
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get all categories with active listings count
   */
  async getCategoriesWithCount(): Promise<CategoryWithCount[]> {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (categoriesError) throw categoriesError

    // Fetch active count for each category
    const categoriesWithCounts = await Promise.all(
      (categoriesData || []).map(async (category) => {
        const { count } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('status', 'active')
        
        return { ...category, active_listings_count: count || 0 }
      })
    )

    return categoriesWithCounts
  },

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select('*')
      .single()
    
    if (error) throw error
    return category
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return category
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get parent categories (categories without parent_id)
   */
  async getParentCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get child categories by parent ID
   */
  async getChildCategories(parentId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  /**
   * Search categories by name
   */
  async searchCategories(query: string, limit = 10): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Count all categories
   */
  async countCategories(): Promise<number> {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  },
}
