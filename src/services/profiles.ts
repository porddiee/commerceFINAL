import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const supabase = createClient()

export interface UpdateProfileData {
  full_name?: string
  bio?: string
  location?: string
  avatar_url?: string
  phone?: string
  verification_document?: string
  verification_status?: 'none' | 'pending' | 'approved' | 'rejected'
  verification_rejection_reason?: string
}

export interface PhoneVerificationData {
  phone: string
  code: string
}

export const profilesService = {
  /**
   * Get profile by ID
   */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get profile by email
   */
  async getProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update profile
   */
  async updateProfile(id: string, data: UpdateProfileData): Promise<Profile> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return profile
  },

  /**
   * Get profile with phone verification status
   */
  async getPhoneVerificationStatus(id: string): Promise<{ phone: string | null; phone_verified: boolean }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('phone, phone_verified')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { phone: data?.phone || null, phone_verified: data?.phone_verified || false }
  },

  /**
   * Request phone verification code
   */
  async requestPhoneVerification(id: string, phone: string): Promise<void> {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    const { error } = await supabase.from('profiles').update({
      phone_verification_code: verificationCode,
      phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      phone,
    }).eq('id', id)
    
    if (error) throw error
    
    // TODO: Send SMS with verification code using your SMS service
    console.log('Verification code:', verificationCode)
  },

  /**
   * Verify phone code
   */
  async verifyPhoneCode(id: string, code: string): Promise<void> {
    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('phone_verification_code, phone_verification_expires')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError
    
    if (new Date() > new Date(profileData.phone_verification_expires)) {
      throw new Error('Code expired. Please request a new one.')
    }
    
    if (profileData.phone_verification_code !== code) {
      throw new Error('Invalid verification code')
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        phone_verified: true, 
        phone_verification_code: null, 
        phone_verification_expires: null 
      })
      .eq('id', id)
    
    if (updateError) throw updateError
  },

  /**
   * Submit seller verification document
   */
  async submitVerificationDocument(id: string, document: File): Promise<Profile> {
    const supabase = createClient()
    
    // Upload file to Supabase storage
    const fileExt = document.name.split('.').pop()
    const fileName = `${id}-verification-${Date.now()}.${fileExt}`
    const filePath = `verification-documents/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, document, { upsert: true })
    
    if (uploadError) {
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
        throw new Error('Storage bucket "verification-documents" not found. Please contact support.')
      }
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(filePath)
    
    // Update profile with verification document URL
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        verification_document: publicUrl,
        verification_status: 'pending',
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return profile
  },

  /**
   * Reset verification status
   */
  async resetVerificationStatus(id: string): Promise<Profile> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ verification_status: 'none' })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return profile
  },

  /**
   * Get multiple profiles by IDs
   */
  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', ids)
    
    if (error) throw error
    return data || []
  },

  /**
   * Search profiles by name
   */
  async searchProfiles(query: string, limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get verified sellers
   */
  async getVerifiedSellers(limit = 50): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_verified_seller', true)
      .eq('verification_status', 'approved')
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Count total users
   */
  async countUsers(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  },

  /**
   * Count pending verifications
   */
  async countPendingVerifications(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')
    
    if (error) throw error
    return count || 0
  },

  /**
   * Get recent users
   */
  async getRecentUsers(limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
}
