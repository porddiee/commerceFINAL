import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface ListingTemplate {
  id: string
  user_id: string
  name: string
  title: string
  description: string
  category_id: string | null
  condition: string
  location: string
  currency: string
  buy_type: string
  created_at: string
  updated_at: string
}

export interface CreateListingTemplateData {
  user_id: string
  name: string
  title: string
  description: string
  category_id: string | null
  condition: string
  location: string
  currency: string
  buy_type: string
}

export interface UpdateListingTemplateData {
  name?: string
  title?: string
  description?: string
  category_id?: string | null
  condition?: string
  location?: string
  currency?: string
  buy_type?: string
}

export const listingTemplatesService = {
  /**
   * Get templates for a user with category details
   */
  async getUserTemplates(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('listing_templates')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ListingTemplate | null> {
    const { data, error } = await supabase
      .from('listing_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Create a new template
   */
  async createTemplate(data: CreateListingTemplateData): Promise<ListingTemplate> {
    const { data: template, error } = await supabase
      .from('listing_templates')
      .insert(data)
      .select('*')
      .single()
    
    if (error) throw error
    return template
  },

  /**
   * Update a template
   */
  async updateTemplate(id: string, data: UpdateListingTemplateData): Promise<ListingTemplate> {
    const { data: template, error } = await supabase
      .from('listing_templates')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return template
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('listing_templates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}
