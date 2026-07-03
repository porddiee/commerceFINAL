import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

const supabase = createClient()

export interface SignUpData {
  email: string
  password: string
  full_name?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UpdatePasswordData {
  newPassword: string
}

export interface UpdateEmailData {
  newEmail: string
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData) {
    const { email, password, full_name } = data
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })
    if (error) throw error
    return authData
  },

  /**
   * Sign in with email and password
   */
  async signInWithPassword(data: SignInData) {
    const { email, password } = data
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return authData
  },

  /**
   * Sign in with OAuth provider (Google, etc.)
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'facebook', options?: { redirectTo?: string }) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get the current user
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Update user password
   */
  async updatePassword(data: UpdatePasswordData) {
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })
    if (error) throw error
  },

  /**
   * Update user email
   */
  async updateEmail(data: UpdateEmailData) {
    const { error } = await supabase.auth.updateUser({
      email: data.newEmail,
    })
    if (error) throw error
  },

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw error
  },

  /**
   * Exchange OAuth code for session (used in callback route)
   */
  async exchangeCodeForSession(code: string) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
  },

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email_confirmed_at != null
  },

  /**
   * Get user profile with auth user
   */
  async getUserWithProfile(): Promise<{ user: User | null; profile: Profile | null }> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { user: null, profile: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { user, profile }
  },

  /**
   * Reset password - send reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  },

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: Record<string, any>) {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    })
    if (error) throw error
  },
}
