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
  Shield,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  FileText,
  BadgeCheck,
  AlertCircle,
  Loader2,
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
    full_name: '', bio: '', location: '', phone: '', avatar_url: '',
  })
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('')
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false)
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [phoneVerifySuccess, setPhoneVerifySuccess] = useState(false)
  const [phoneVerifyError, setPhoneVerifyError] = useState('')

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
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
      })
      setAvatarPreview(data.avatar_url || '')
      setPhoneVerified(data.phone_verified || false)
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
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setSaveError('User not authenticated'); setTimeout(() => setSaveError(''), 3000); return }
    setSaving(true); setSaveSuccess(false); setSaveError('')
    try {
      let avatarUrl = formData.avatar_url || profile?.avatar_url || ''
      if (avatarFile) {
        try { const url = await handleAvatarUpload(); if (url) avatarUrl = url }
        catch (e) { console.error('Avatar upload failed:', e) }
      }
      const { error: updateError } = await supabase.from('profiles').update({
        full_name: formData.full_name || '', bio: formData.bio || '',
        location: formData.location || '', phone: formData.phone || '', avatar_url: avatarUrl || '',
      }).eq('id', user.id)
      if (updateError) { setSaveError(updateError.message || 'Failed to update profile'); setTimeout(() => setSaveError(''), 3000); return }
      setProfile({ ...(profile || {}), ...formData, avatar_url: avatarUrl })
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to update profile'); setTimeout(() => setSaveError(''), 3000)
    } finally { setSaving(false) }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !verificationFile) return
    setVerificationLoading(true)
    try {
      const { error } = await supabase.from('profiles').update({ verification_document: 'placeholder_url', verification_status: 'pending' }).eq('id', user.id)
      if (error) throw error
      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (updatedProfile) { setProfile(updatedProfile); useAuthStore.getState().setProfile(updatedProfile) }
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Failed to submit verification request')
    } finally { setVerificationLoading(false) }
  }

  const handleSendPhoneVerification = async () => {
    if (!formData.phone || !user) { setPhoneVerifyError('Please enter a phone number first'); setTimeout(() => setPhoneVerifyError(''), 3000); return }
    setPhoneVerificationLoading(true); setPhoneVerifySuccess(false); setPhoneVerifyError('')
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const { error } = await supabase.from('profiles').update({
        phone_verification_code: verificationCode,
        phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).eq('id', user.id)
      if (error) throw error
      alert(`Verification code sent to ${formData.phone}: ${verificationCode}`)
      setPhoneVerificationSent(true); setPhoneVerifySuccess(true); setTimeout(() => setPhoneVerifySuccess(false), 3000)
      await supabase.rpc('create_notification', { recipient_id: user.id, notification_type: 'system', notification_title: 'Phone Verification Code Sent', notification_content: `Your verification code is: ${verificationCode}`, notification_link: '/user/profile' })
    } catch (error) {
      console.error('Error sending phone verification:', error)
      setPhoneVerifyError('Failed to send verification code'); setTimeout(() => setPhoneVerifyError(''), 3000)
    } finally { setPhoneVerificationLoading(false) }
  }

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode || !user) { setPhoneVerifyError('Please enter the verification code'); setTimeout(() => setPhoneVerifyError(''), 3000); return }
    setPhoneVerificationLoading(true); setPhoneVerifySuccess(false); setPhoneVerifyError('')
    try {
      const { data: profileData, error: fetchError } = await supabase.from('profiles').select('phone_verification_code, phone_verification_expires').eq('id', user.id).single()
      if (fetchError) throw fetchError
      if (new Date() > new Date(profileData.phone_verification_expires)) { setPhoneVerifyError('Code expired. Please request a new one.'); setTimeout(() => setPhoneVerifyError(''), 3000); setPhoneVerificationSent(false); return }
      if (profileData.phone_verification_code !== phoneVerificationCode) { setPhoneVerifyError('Invalid verification code'); setTimeout(() => setPhoneVerifyError(''), 3000); return }
      const { error: updateError } = await supabase.from('profiles').update({ phone_verified: true, phone_verification_code: null, phone_verification_expires: null }).eq('id', user.id)
      if (updateError) throw updateError
      setPhoneVerified(true); setPhoneVerificationSent(false); setPhoneVerificationCode(''); setPhoneVerifySuccess(true); setTimeout(() => setPhoneVerifySuccess(false), 3000)
      await supabase.rpc('create_notification', { recipient_id: user.id, notification_type: 'system', notification_title: 'Phone Verified Successfully', notification_content: 'Your phone number has been verified successfully.', notification_link: '/user/profile' })
      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (updatedProfile) { setProfile(updatedProfile); useAuthStore.getState().setProfile(updatedProfile) }
    } catch (error) {
      console.error('Error verifying phone:', error)
      setPhoneVerifyError('Failed to verify phone number'); setTimeout(() => setPhoneVerifyError(''), 3000)
    } finally { setPhoneVerificationLoading(false) }
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
                {phoneVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Phone Verified
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
            {([
              { id: 'info', label: 'Profile Info', icon: User },
              { id: 'verification', label: 'Verification', icon: Shield },
            ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
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

            {/* Phone + Verify */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">Phone Number</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+63 9XX XXX XXXX"
                    className="pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
                {phoneVerified ? (
                  <div className="flex items-center gap-1.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium text-sm flex-shrink-0">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl flex-shrink-0"
                    onClick={handleSendPhoneVerification}
                    disabled={phoneVerificationLoading || !formData.phone}
                  >
                    {phoneVerificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                )}
              </div>

              {/* OTP input */}
              {phoneVerificationSent && !phoneVerified && (
                <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 space-y-3 animate-fade-in">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Enter the code sent to {formData.phone}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="verificationCode"
                      value={phoneVerificationCode}
                      onChange={(e) => setPhoneVerificationCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="flex-1 rounded-xl text-center tracking-widest font-mono text-lg"
                    />
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={handleVerifyPhoneCode}
                      disabled={phoneVerificationLoading || phoneVerificationCode.length < 6}
                    >
                      {phoneVerificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                  </div>
                  {phoneVerifySuccess && (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" /> Phone verified successfully!
                    </p>
                  )}
                  {phoneVerifyError && (
                    <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" /> {phoneVerifyError}
                    </p>
                  )}
                </div>
              )}
            </div>

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

      {/* ── Tab: Verification ── */}
      {activeTab === 'verification' && (
        <div className="space-y-4 animate-fade-in">
          {/* What is verification */}
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Seller Verification</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit a government-issued ID to become a verified seller on SuriMart. Verified sellers
                  unlock the ability to create products and earn the verified badge — building buyer trust.
                </p>
              </div>
            </div>
          </div>

          {/* Status UI */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Verification Status</h3>

            {profile?.verification_status === 'pending' && (
              <StatusBanner
                variant="blue" icon={Clock}
                title="Verification Under Review"
                body="Your request is being reviewed by our team. This typically takes 1–2 business days. We'll notify you once a decision is made."
              />
            )}

            {profile?.verification_status === 'approved' && (
              <StatusBanner
                variant="green" icon={BadgeCheck}
                title="You are a Verified Seller 🎉"
                body="Your identity has been verified. You can create products and your profile displays the verified badge."
              />
            )}

            {profile?.verification_status === 'rejected' && (
              <StatusBanner
                variant="red" icon={XCircle}
                title="Verification Rejected"
                body={profile?.verification_rejection_reason || 'Your verification was rejected. Please resubmit with a clearer or valid government-issued ID.'}
                action={
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={async () => {
                      await supabase.from('profiles').update({ verification_status: 'none' }).eq('id', user!.id)
                      const { data: up } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
                      if (up) setProfile(up)
                    }}
                  >
                    Submit New Request
                  </Button>
                }
              />
            )}

            {(!profile?.verification_status || profile?.verification_status === 'none') && (
              <>
                <StatusBanner
                  variant="amber" icon={AlertCircle}
                  title="Not Yet Verified"
                  body="Upload a government-issued ID to start selling. Accepted: National ID, Driver's License, Passport, PhilSys ID."
                />
                <form onSubmit={handleVerificationSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="verification" className="text-sm font-medium text-foreground/80">
                      Verification Document
                    </Label>
                    <label
                      htmlFor="verification"
                      className={`flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                        verificationFile
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
                          : 'border-border hover:border-indigo-400 hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        {verificationFile ? (
                          <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      {verificationFile ? (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{verificationFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Click to change file</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload document</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Image or PDF, max 10 MB</p>
                        </div>
                      )}
                      <input
                        id="verification"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={verificationLoading || !verificationFile}
                    className="w-full gap-2 rounded-xl"
                  >
                    {verificationLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                      <><Shield className="h-4 w-4" /> Submit Verification Request</>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
