'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import {
  User,
  MapPin,
  Upload,
  Save,
  Camera,
  Loader2,
  BadgeCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react'

type Tab = 'info' | 'verification'

function InputField({
  id, label, placeholder, value, onChange, icon: Icon, type = 'text', className = '',
}: {
  id: string; label: string; placeholder: string; value: string
  onChange: (v: string) => void; icon?: any; type?: string; className?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors ${Icon ? 'pl-10' : ''} ${className}`}
        />
      </div>
    </div>
  )
}

function StatusBanner({
  variant, icon: Icon, title, body, action,
}: {
  variant: 'blue' | 'green' | 'red' | 'amber'
  icon: any; title: string; body: string; action?: React.ReactNode
}) {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300',
    red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300',
  }
  return (
    <div className={`rounded-2xl border p-5 ${styles[variant]}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm opacity-80 mt-0.5">{body}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export default function UserProfilePage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [formData, setFormData] = useState({
    full_name: '', bio: '', location: '', avatar_url: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { fetchProfile() }, [user])

  const fetchProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) throw error
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        avatar_url: data.avatar_url || '',
      })
      setAvatarPreview(data.avatar_url || '')
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return formData.avatar_url
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      
      // Try to upload directly without checking if bucket exists
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
          throw new Error('Storage bucket "avatars" not found. Please verify: 1) You created it in the correct Supabase project (https://ncgssjjcsqnhujbkozzy.supabase.co), 2) It is named exactly "avatars" (lowercase), 3) It is set to public')
        }
        
        throw uploadError
      }
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return publicUrl
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setSaveError('User not authenticated'); setTimeout(() => setSaveError(''), 3000); return }
    setSaving(true); setSaveSuccess(false); setSaveError('')
    try {
      let avatarUrl = formData.avatar_url || profile?.avatar_url || ''
      if (avatarFile) {
        try { const url = await handleAvatarUpload(); if (url) avatarUrl = url }
        catch (e: any) { 
          console.error('Avatar upload failed:', e)
          const errorMessage = e?.message || 'Failed to upload avatar'
          if (errorMessage.includes('bucket')) {
            setSaveError('Storage bucket not configured. Please create "avatars" bucket in Supabase Storage.')
          } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
            setSaveError('Storage permission denied. Check bucket policies in Supabase.')
          } else {
            setSaveError(errorMessage)
          }
          setTimeout(() => setSaveError(''), 5000); setSaving(false); return 
        }
      }
      const { error: updateError } = await supabase.from('profiles').update({
        full_name: formData.full_name || '', bio: formData.bio || '',
        location: formData.location || '', avatar_url: avatarUrl || '',
      }).eq('id', user.id)
      if (updateError) { setSaveError(updateError.message || 'Failed to update profile'); setTimeout(() => setSaveError(''), 3000); return }
      setProfile({ ...(profile || {}), ...formData, avatar_url: avatarUrl })
      // Update auth store to ensure persistence across sessions
      useAuthStore.getState().setProfile({ ...(profile || {}), ...formData, avatar_url: avatarUrl })
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to update profile'); setTimeout(() => setSaveError(''), 3000)
    } finally { setSaving(false) }
  }

  const initials = formData.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading your profile…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="space-y-0.5 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and verification</p>
      </div>

      {/* ── Profile Hero Card ── */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-fade-in">
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.05%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        </div>

        {/* Avatar + name row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
            {/* Avatar with upload button */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                <AvatarImage src={avatarPreview} alt={formData.full_name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center cursor-pointer shadow-md transition-colors"
                title="Change photo"
              >
                <Camera className="h-4 w-4 text-white" />
                <input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            {/* Name + badges */}
            <div className="flex-1 sm:mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{formData.full_name || 'Unnamed User'}</h2>
                {profile?.is_verified_seller && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified Seller
                  </span>
                )}
              </div>
              {formData.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {formData.location}
                </p>
              )}
              {formData.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{formData.bio}</p>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('info')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-background text-foreground shadow-sm"
            >
              <User className="h-4 w-4" />
              Profile Info
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab: Profile Info ── */}
      {activeTab === 'info' && (
        <div className="rounded-2xl border border-border/50 bg-card p-6 animate-fade-in">
          <div className="mb-6">
            <h3 className="font-semibold text-base">Personal Information</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Update your name, bio, and contact details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <InputField
              id="full_name" label="Full Name" placeholder="Your full name"
              value={formData.full_name} onChange={(v) => setFormData({ ...formData, full_name: v })}
              icon={User}
            />

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-sm font-medium text-foreground/80">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell buyers a bit about yourself…"
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl border border-border/60 bg-muted/30 focus:bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>

            {/* Location */}
            <InputField
              id="location" label="Location" placeholder="City, Province"
              value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })}
              icon={MapPin}
            />

            {/* Save row */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/50">
              <Button type="submit" disabled={saving} className="gap-2 rounded-xl px-6">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>

              {saveSuccess && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
                  <CheckCircle className="h-4 w-4" /> Profile updated!
                </p>
              )}
              {saveError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 animate-fade-in">
                  <XCircle className="h-4 w-4" /> {saveError}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
