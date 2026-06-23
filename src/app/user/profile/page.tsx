'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { User, MapPin, Upload, Save, Shield, Phone, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function UserProfilePage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    avatar_url: '',
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

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return formData.avatar_url

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      throw new Error(error.message || 'Failed to upload avatar')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setSaveError('User not authenticated')
      setTimeout(() => setSaveError(''), 3000)
      return
    }

    setSaving(true)
    setSaveSuccess(false)
    setSaveError('')
    
    try {
      let avatarUrl = formData.avatar_url || profile?.avatar_url || ''

      if (avatarFile) {
        try {
          const uploadedUrl = await handleAvatarUpload()
          if (uploadedUrl) {
            avatarUrl = uploadedUrl
          }
        } catch (uploadError: any) {
          // Silently fail and keep existing avatar
          console.error('Avatar upload failed:', uploadError?.message)
        }
      }

      const updateData: any = {
        full_name: formData.full_name || '',
        bio: formData.bio || '',
        location: formData.location || '',
        phone: formData.phone || '',
        avatar_url: avatarUrl || '',
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        setSaveError(updateError.message || 'Failed to update profile')
        setTimeout(() => setSaveError(''), 3000)
        setSaving(false)
        return
      }

      setProfile({
        ...(profile || {}),
        full_name: formData.full_name || '',
        bio: formData.bio || '',
        location: formData.location || '',
        phone: formData.phone || '',
        avatar_url: avatarUrl || '',
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to update profile')
      setTimeout(() => setSaveError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !verificationFile) return

    setVerificationLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_document: 'placeholder_url',
          verification_status: 'pending',
        })
        .eq('id', user.id)

      if (error) throw error
      alert('Verification request submitted successfully!')
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (updatedProfile) {
        setProfile(updatedProfile)
        useAuthStore.getState().setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Failed to submit verification request')
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleSendPhoneVerification = async () => {
    if (!formData.phone || !user) {
      setPhoneVerifyError('Please enter a phone number first')
      setTimeout(() => setPhoneVerifyError(''), 3000)
      return
    }

    setPhoneVerificationLoading(true)
    setPhoneVerifySuccess(false)
    setPhoneVerifyError('')
    try {
      // Generate a random 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Store the code in the profile temporarily (in production, this should be sent via SMS)
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_verification_code: verificationCode,
          phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        })
        .eq('id', user.id)

      if (error) throw error

      // In production, you would send this via SMS using a service like Twilio
      // For now, we'll show it in an alert for testing
      alert(`Verification code sent to ${formData.phone}: ${verificationCode}`)
      
      setPhoneVerificationSent(true)
      setPhoneVerifySuccess(true)
      setTimeout(() => setPhoneVerifySuccess(false), 3000)
      
      // Create notification for user
      await supabase.rpc('create_notification', {
        recipient_id: user.id,
        notification_type: 'system',
        notification_title: 'Phone Verification Code Sent',
        notification_content: `Your verification code is: ${verificationCode}`,
        notification_link: '/user/profile',
      })
    } catch (error) {
      console.error('Error sending phone verification:', error)
      setPhoneVerifyError('Failed to send verification code')
      setTimeout(() => setPhoneVerifyError(''), 3000)
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode || !user) {
      setPhoneVerifyError('Please enter the verification code')
      setTimeout(() => setPhoneVerifyError(''), 3000)
      return
    }

    setPhoneVerificationLoading(true)
    setPhoneVerifySuccess(false)
    setPhoneVerifyError('')
    try {
      // Check if the code matches and hasn't expired
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('phone_verification_code, phone_verification_expires')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      const now = new Date()
      const expires = new Date(profileData.phone_verification_expires)

      if (now > expires) {
        setPhoneVerifyError('Verification code has expired. Please request a new one.')
        setTimeout(() => setPhoneVerifyError(''), 3000)
        setPhoneVerificationSent(false)
        return
      }

      if (profileData.phone_verification_code !== phoneVerificationCode) {
        setPhoneVerifyError('Invalid verification code')
        setTimeout(() => setPhoneVerifyError(''), 3000)
        return
      }

      // Mark phone as verified
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_verified: true,
          phone_verification_code: null,
          phone_verification_expires: null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setPhoneVerified(true)
      setPhoneVerificationSent(false)
      setPhoneVerificationCode('')
      setPhoneVerifySuccess(true)
      setTimeout(() => setPhoneVerifySuccess(false), 3000)
      
      // Create success notification
      await supabase.rpc('create_notification', {
        recipient_id: user.id,
        notification_type: 'system',
        notification_title: 'Phone Verified Successfully',
        notification_content: 'Your phone number has been verified successfully.',
        notification_link: '/user/profile',
      })

      // Update local profile state
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (updatedProfile) {
        setProfile(updatedProfile)
        useAuthStore.getState().setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error verifying phone code:', error)
      setPhoneVerifyError('Failed to verify phone number')
      setTimeout(() => setPhoneVerifyError(''), 3000)
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  function getVerificationStatusUI() {
    switch (profile?.verification_status) {
      case 'pending':
        return (
          <div className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Verification Pending</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your verification request is being reviewed by an admin. This usually takes 1-2 business days.
            </p>
          </div>
        )
      case 'approved':
        return (
          <div className="border-green-200 bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-400 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Verified Seller</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              You are now a verified seller and can create listings on SuriMart.
            </p>
          </div>
        )
      case 'rejected':
        return (
          <div className="border-red-200 bg-red-50 dark:bg-red-900/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-2">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Verification Rejected</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              {profile?.verification_rejection_reason || 'Your verification was rejected. Please try again with valid documents.'}
            </p>
            <Button
              onClick={async () => {
                await supabase.from('profiles').update({ verification_status: 'none' }).eq('id', user.id)
                const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (updatedProfile) setProfile(updatedProfile)
              }}
              size="sm"
            >
              Submit New Request
            </Button>
          </div>
        )
      default:
        return (
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification">Verification Document</Label>
              <Input
                id="verification"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload a government-issued ID or proof of identity
              </p>
            </div>
            <Button type="submit" disabled={verificationLoading}>
              {verificationLoading ? 'Submitting...' : 'Submit Verification'}
            </Button>
          </form>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a new avatar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarPreview} alt={formData.full_name} />
              <AvatarFallback className="text-4xl">
                {formData.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Label htmlFor="avatar">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New
                  </span>
                </Button>
              </Label>
            </div>
            {profile?.is_verified_seller && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Shield className="h-4 w-4" />
                Verified Seller
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter your location"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                  {!phoneVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendPhoneVerification}
                      disabled={phoneVerificationLoading || !formData.phone}
                    >
                      {phoneVerificationLoading ? 'Sending...' : 'Verify'}
                    </Button>
                  )}
                  {phoneVerified && (
                    <div className="flex items-center gap-1 text-green-600 px-3">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm">Verified</span>
                    </div>
                  )}
                </div>
                {phoneVerificationSent && !phoneVerified && (
                  <div className="space-y-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Label htmlFor="verificationCode">Enter Verification Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="verificationCode"
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value)}
                        placeholder="6-digit code"
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyPhoneCode}
                        disabled={phoneVerificationLoading}
                      >
                        {phoneVerificationLoading ? 'Verifying...' : 'Confirm'}
                      </Button>
                    </div>
                    {phoneVerifySuccess && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Phone verified successfully!</span>
                      </div>
                    )}
                    {phoneVerifyError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <XCircle className="h-4 w-4" />
                        <span>{phoneVerifyError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
              
              {saveError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>{saveError}</span>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Seller Verification Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seller Verification
            </CardTitle>
            <CardDescription>Verify your identity to start selling on SuriMart</CardDescription>
          </CardHeader>
          <CardContent>
            {getVerificationStatusUI()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
