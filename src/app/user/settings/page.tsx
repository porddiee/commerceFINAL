'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useLanguageStore } from '@/lib/store/language'
import { Language } from '@/lib/translations'
import {
  Upload, Shield, Lock, Bell, Eye, Globe, CheckCircle, XCircle, Clock,
  Settings, Loader2, MapPin, BarChart3, MessageSquare, ShoppingBag,
  Monitor, Sun, Moon, Accessibility, Sparkles,
} from 'lucide-react'

/* ─────────────────────── Toggle switch ─────────────────────── */
function Toggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

/* ─────────────────────── Setting row ─────────────────────── */
function SettingRow({
  icon: Icon, title, description, children,
}: { icon?: any; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

/* ─────────────────────── Section card ─────────────────────── */
function SectionCard({
  icon: Icon, title, description, children, accent = 'indigo',
}: { icon: any; title: string; description: string; children: React.ReactNode; accent?: string }) {
  const accentMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-blue-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    violet: 'from-violet-500 to-purple-600',
    rose: 'from-rose-500 to-pink-600',
  }
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/30 dark:to-slate-950/50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 divide-y divide-border/50">{children}</div>
    </div>
  )
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function SettingsPage() {
  const { user, profile } = useAuthStore()
  const { language, setLanguage, translate } = useLanguageStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    listingAlerts: true,
    messageAlerts: true,
  })
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: true,
    allowDataSharing: false,
    adTracking: false,
  })
  const [preferences, setPreferences] = useState({
    language: language,
    theme: 'system',
  })
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
  })
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('')
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false)
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailNotification, setEmailNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationSettings')
    const savedPrivacy = localStorage.getItem('privacySettings')
    const savedPreferences = localStorage.getItem('preferences')
    const savedAccessibility = localStorage.getItem('accessibilitySettings')

    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications))
    if (savedPrivacy) setPrivacySettings(JSON.parse(savedPrivacy))
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences)
      setPreferences(prefs)
      if (prefs.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (prefs.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      setLanguage(prefs.language || 'en')
    }
    if (savedAccessibility) {
      const accessibility = JSON.parse(savedAccessibility)
      setAccessibilitySettings(accessibility)
      applyAccessibilitySettings(accessibility)
    }
    
    // Load phone and email verification status from profile
    if (user) {
      supabase.from('profiles').select('phone, phone_verified').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setPhone(data.phone || '')
          setPhoneVerified(data.phone_verified || false)
        }
      })
      // Check email verification from auth
      supabase.auth.getUser().then(({ data }) => {
        setEmailVerified(data.user?.email_confirmed_at != null)
      })
    }
  }, [setLanguage, user])

  // Apply accessibility settings to UI
  const applyAccessibilitySettings = (settings: typeof accessibilitySettings) => {
    const body = document.body
    
    // High contrast
    if (settings.highContrast) {
      body.classList.add('accessibility-high-contrast')
    } else {
      body.classList.remove('accessibility-high-contrast')
    }
    
    // Large text
    if (settings.largeText) {
      body.classList.add('accessibility-large-text')
    } else {
      body.classList.remove('accessibility-large-text')
    }
    
    // Reduce motion
    if (settings.reduceMotion) {
      body.classList.add('accessibility-reduce-motion')
    } else {
      body.classList.remove('accessibility-reduce-motion')
    }
  }

  // Apply accessibility settings when they change
  useEffect(() => {
    applyAccessibilitySettings(accessibilitySettings)
  }, [accessibilitySettings])

  const saveSetting = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })
      if (error) throw error
      alert('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !verificationFile) return

    setVerificationLoading(true)
    try {
      // Upload file to Supabase storage
      const fileExt = verificationFile.name.split('.').pop()
      const fileName = `${user.id}-verification-${Date.now()}.${fileExt}`
      const filePath = `verification-documents/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, verificationFile, { upsert: true })
      
      if (uploadError) {
        // Try to create bucket if it doesn't exist
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
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_document: publicUrl,
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
        useAuthStore.getState().setProfile(updatedProfile)
      }
      setVerificationFile(null)
    } catch (error: any) {
      console.error('Error submitting verification:', error)
      alert(error.message || 'Failed to submit verification request')
    } finally {
      setVerificationLoading(false)
    }
  }

  /* ── Theme pill picker ── */
  const themes = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ]

  const handleThemeChange = (newTheme: string) => {
    setPreferences((p) => ({ ...p, theme: newTheme }))
    saveSetting('preferences', { ...preferences, theme: newTheme })
    if (newTheme === 'dark') document.documentElement.classList.add('dark')
    else if (newTheme === 'light') document.documentElement.classList.remove('dark')
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setPreferences((p) => ({ ...p, language: lang }))
    saveSetting('preferences', { ...preferences, language: lang })
  }

  const handleEnable2FA = async () => {
    if (!user) return
    setTwoFactorLoading(true)
    try {
      // In a real implementation, this would:
      // 1. Generate a TOTP secret
      // 2. Show QR code to user
      // 3. Verify user can generate valid codes
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTwoFactorEnabled(true)
      setShow2FAModal(false)
      alert('Two-factor authentication enabled! In production, you would scan a QR code with an authenticator app.')
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      alert('Failed to enable 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!user) return
    setTwoFactorLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setTwoFactorEnabled(false)
      alert('Two-factor authentication disabled')
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      alert('Failed to disable 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleSendPhoneVerification = async () => {
    if (!phone || !user) {
      alert('Please enter a phone number first')
      return
    }
    setPhoneVerificationLoading(true)
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const { error } = await supabase.from('profiles').update({
        phone_verification_code: verificationCode,
        phone_verification_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        phone: phone,
      }).eq('id', user.id)
      if (error) throw error
      alert(`Verification code sent to ${phone}: ${verificationCode}`)
      setPhoneVerificationSent(true)
    } catch (error) {
      console.error('Error sending phone verification:', error)
      alert('Failed to send verification code')
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (!phoneVerificationCode || !user) {
      alert('Please enter the verification code')
      return
    }
    setPhoneVerificationLoading(true)
    try {
      const { data: profileData, error: fetchError } = await supabase.from('profiles').select('phone_verification_code, phone_verification_expires').eq('id', user.id).single()
      if (fetchError) throw fetchError
      if (new Date() > new Date(profileData.phone_verification_expires)) {
        alert('Code expired. Please request a new one.')
        setPhoneVerificationSent(false)
        return
      }
      if (profileData.phone_verification_code !== phoneVerificationCode) {
        alert('Invalid verification code')
        return
      }
      const { error: updateError } = await supabase.from('profiles').update({ phone_verified: true, phone_verification_code: null, phone_verification_expires: null }).eq('id', user.id)
      if (updateError) throw updateError
      setPhoneVerified(true)
      setPhoneVerificationSent(false)
      setPhoneVerificationCode('')
      alert('Phone verified successfully!')
    } catch (error) {
      console.error('Error verifying phone:', error)
      alert('Failed to verify phone number')
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  const handleSendEmailVerification = async () => {
    if (!user) return
    setEmailVerificationLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      })
      if (error) throw error
      alert('Verification email sent! Please check your inbox and click the confirmation link.')
    } catch (error) {
      console.error('Error sending email verification:', error)
      alert('Failed to send verification email')
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!user || !newEmail) {
      setEmailNotification({ type: 'error', message: 'Please enter a new email address' })
      setTimeout(() => setEmailNotification(null), 3000)
      return
    }
    if (newEmail === user.email) {
      setEmailNotification({ type: 'error', message: 'New email must be different from current email' })
      setTimeout(() => setEmailNotification(null), 3000)
      return
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setEmailNotification({ type: 'error', message: 'Please enter a valid email address' })
      setTimeout(() => setEmailNotification(null), 3000)
      return
    }
    setEmailVerificationLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })
      if (error) {
        if (error.message.includes('already been registered')) {
          setEmailNotification({ type: 'error', message: 'This email address is already registered. Please use a different email.' })
          setEmailVerificationLoading(false)
          setTimeout(() => setEmailNotification(null), 3000)
          return
        }
        if (error.message.includes('invalid format')) {
          setEmailNotification({ type: 'error', message: 'Please enter a valid email address' })
          setEmailVerificationLoading(false)
          setTimeout(() => setEmailNotification(null), 3000)
          return
        }
        if (error.message.includes('rate limit')) {
          setEmailNotification({ type: 'error', message: 'Too many email change attempts. Please wait a few minutes before trying again.' })
          setEmailVerificationLoading(false)
          setTimeout(() => setEmailNotification(null), 5000)
          return
        }
        throw error
      }
      setEmailNotification({ type: 'success', message: 'Email change request sent! Please check your current email for confirmation.' })
      setEditingEmail(false)
      setNewEmail('')
      setTimeout(() => setEmailNotification(null), 5000)
      // When email is changed, it's no longer verified until user confirms
      setEmailVerified(false)
    } catch (error: any) {
      console.error('Error changing email:', error)
      setEmailNotification({ type: 'error', message: 'Failed to change email address. Please try again.' })
      setTimeout(() => setEmailNotification(null), 3000)
    } finally {
      setEmailVerificationLoading(false)
    }
  }

  /* ── Verification status banner ── */
  const verificationBanner = () => {
    const status = profile?.verification_status
    if (status === 'pending') {
      return (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/15 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Verification Pending</p>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5 font-medium">
              Your request is being reviewed. This usually takes 1–2 business days.
            </p>
          </div>
        </div>
      )
    }
    if (status === 'approved') {
      return (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/15 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Verified Seller ✓</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-medium">
              You are a verified seller and can create products on SuriMart.
            </p>
          </div>
        </div>
      )
    }
    if (status === 'rejected') {
      return (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/15 p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Verification Rejected</p>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-0.5 font-medium">
                {profile?.verification_rejection_reason || 'Your verification was rejected. Please try again with valid documents.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4"
            onClick={async () => {
              if (!user) return
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({ verification_status: 'none' })
                  .eq('id', user.id)
                if (error) throw error
                alert('Verification status reset. You can now submit a new request.')
                const { data: updatedProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                if (updatedProfile) {
                  useAuthStore.getState().setProfile(updatedProfile)
                }
              } catch (error) {
                console.error('Error resetting verification:', error)
                alert('Failed to reset verification status. Please try again.')
              }
            }}
          >
            Submit New Request
          </Button>
        </div>
      )
    }
    // Default: no verification yet
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Email Notification Banner */}
      {emailNotification && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 animate-fade-in ${
          emailNotification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900'
            : 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900'
        }`}>
          {emailNotification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${
            emailNotification.type === 'success'
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-rose-800 dark:text-rose-300'
          }`}>
            {emailNotification.message}
          </p>
        </div>
      )}

      {/* Accessibility CSS */}
      <style jsx global>{`
        .accessibility-high-contrast {
          --tw-bg-opacity: 1 !important;
        }
        .accessibility-high-contrast * {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #000000 !important;
        }
        .accessibility-high-contrast .dark * {
          color: #ffffff !important;
          background-color: #000000 !important;
          border-color: #ffffff !important;
        }
        
        .accessibility-large-text {
          font-size: 120% !important;
        }
        .accessibility-large-text * {
          font-size: inherit !important;
        }
        
        .accessibility-reduce-motion *,
        .accessibility-reduce-motion *::before,
        .accessibility-reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Account</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{translate('settings')}</h1>
            <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">Manage your account, security, notifications, and preferences</p>
          </div>
        </div>
      </div>

      {/* ── Verification status (if applicable) ── */}
      {verificationBanner()}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ═══ LEFT COLUMN (3 cols) ═══ */}
        <div className="lg:col-span-3 space-y-6">

          {/* ── Account & Security ── */}
          <SectionCard icon={Lock} title="Account & Security" description="Passwords, email, and two-factor authentication" accent="indigo">
            {/* Email */}
            <div className="py-4 first:pt-0">
              <Label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</Label>
              {!editingEmail ? (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="flex-1 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold text-sm"
                  />
                  <div className="flex gap-2">
                    {emailVerified ? (
                      <div className="flex items-center gap-1.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium text-sm flex-shrink-0">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendEmailVerification}
                        disabled={emailVerificationLoading}
                        className="rounded-xl text-xs font-bold h-10 border-2"
                      >
                        {emailVerificationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Verify'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingEmail(true); setNewEmail(user?.email || '') }}
                      className="rounded-xl text-xs font-bold h-10 border-2"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    className="flex-1 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 font-semibold text-sm transition-all"
                  />
                  <Button
                    type="button"
                    onClick={handleChangeEmail}
                    disabled={emailVerificationLoading || !newEmail}
                    className="rounded-xl text-xs font-bold h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {emailVerificationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingEmail(false); setNewEmail('') }}
                    className="rounded-xl text-xs font-bold h-10 border-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                {emailVerified ? 'Verified through email confirmation' : 'Click verify to send a confirmation email to your inbox'}
              </p>
            </div>

            {/* Phone */}
            <div className="py-4 space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="flex-1 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 font-semibold text-sm transition-all"
                />
                {phoneVerified ? (
                  <div className="flex items-center gap-1.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium text-sm flex-shrink-0">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendPhoneVerification}
                    disabled={phoneVerificationLoading || !phone}
                    className="rounded-xl text-xs font-bold h-10 border-2"
                  >
                    {phoneVerificationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Verify'}
                  </Button>
                )}
              </div>
              {phoneVerificationSent && !phoneVerified && (
                <div className="mt-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 space-y-2">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Enter the 6-digit code sent to {phone}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={phoneVerificationCode}
                      onChange={(e) => setPhoneVerificationCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="flex-1 rounded-xl text-center tracking-widest font-mono text-sm h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleVerifyPhoneCode}
                      disabled={phoneVerificationLoading || phoneVerificationCode.length < 6}
                      className="rounded-xl text-xs font-bold h-9"
                    >
                      {phoneVerificationLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-semibold">
                {phoneVerified ? 'Verified through phone number' : 'Enter your phone number and click verify'}
              </p>
            </div>

            {/* Password form */}
            <form onSubmit={handlePasswordChange} className="py-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change Password</p>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Current password"
                className="h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 font-semibold text-sm transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="New password"
                  className="h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 font-semibold text-sm transition-all"
                />
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 font-semibold text-sm transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-sm px-5 gap-2"
              >
                {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…</> : 'Update Password'}
              </Button>
            </form>

            {/* 2FA */}
            <SettingRow icon={Shield} title="Two-Factor Authentication" description="Add an extra layer of security to your account">
              <Toggle
                checked={twoFactorEnabled}
                onChange={(v) => {
                  if (v) {
                    setShow2FAModal(true)
                  } else {
                    handleDisable2FA()
                  }
                }}
              />
            </SettingRow>
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionCard icon={Bell} title="Notifications" description="Push, email, and in-app alert preferences" accent="amber">
            <SettingRow icon={Bell} title="Push Notifications" description="Receive push notifications on your device">
              <Toggle
                checked={notificationSettings.pushNotifications}
                onChange={(v) => {
                  setNotificationSettings((s) => ({ ...s, pushNotifications: v }))
                  saveSetting('notificationSettings', { ...notificationSettings, pushNotifications: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={Globe} title="Email Notifications" description="Receive email updates and alerts">
              <Toggle
                checked={notificationSettings.emailNotifications}
                onChange={(v) => {
                  setNotificationSettings((s) => ({ ...s, emailNotifications: v }))
                  saveSetting('notificationSettings', { ...notificationSettings, emailNotifications: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={ShoppingBag} title="Product Alerts" description="Get notified about new products in your area">
              <Toggle
                checked={notificationSettings.listingAlerts}
                onChange={(v) => {
                  setNotificationSettings((s) => ({ ...s, listingAlerts: v }))
                  saveSetting('notificationSettings', { ...notificationSettings, listingAlerts: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={MessageSquare} title="Message Alerts" description="Get notified when you receive new messages">
              <Toggle
                checked={notificationSettings.messageAlerts}
                onChange={(v) => {
                  setNotificationSettings((s) => ({ ...s, messageAlerts: v }))
                  saveSetting('notificationSettings', { ...notificationSettings, messageAlerts: v })
                }}
              />
            </SettingRow>
          </SectionCard>
        </div>

        {/* ═══ RIGHT COLUMN (2 cols) ═══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Seller Verification ── */}
          {(!profile?.verification_status || profile?.verification_status === 'none' || profile?.verification_status === 'rejected') && (
            <SectionCard icon={Shield} title="Seller Verification" description="Verify your identity to start selling" accent="emerald">
              <form onSubmit={handleVerificationSubmit} className="py-1 space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upload Valid ID</Label>
                  <label className="mt-2 flex flex-col items-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/10 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    {verificationFile ? (
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{verificationFile.name}</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload</p>
                        <p className="text-[10px] text-slate-400">Driver's License, Passport, UMID, SSS ID</p>
                      </>
                    )}
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={verificationLoading || !verificationFile}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm gap-2 disabled:opacity-50"
                >
                  {verificationLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</> : 'Submit for Verification'}
                </Button>
              </form>
            </SectionCard>
          )}

          {/* ── Preferences ── */}
          <SectionCard icon={Globe} title="Preferences" description="Language and theme settings" accent="violet">
            {/* Language */}
            <div className="py-4 first:pt-0 space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{translate('language')}</p>
              <div className="flex gap-2">
                {[
                  { value: 'en' as Language, label: 'English' },
                  { value: 'fil' as Language, label: 'Filipino' },
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => handleLanguageChange(l.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      language === l.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="py-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{translate('theme')}</p>
              <div className="flex gap-2">
                {themes.map((t) => {
                  const TIcon = t.icon
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleThemeChange(t.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        preferences.theme === t.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                      }`}
                    >
                      <TIcon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          {/* ── Privacy & Data ── */}
          <SectionCard icon={Eye} title="Privacy & Data" description="Location, data sharing, and ad tracking" accent="rose">
            <SettingRow icon={MapPin} title="Share Location" description="Allow others to see your general location">
              <Toggle
                checked={privacySettings.shareLocation}
                onChange={(v) => {
                  setPrivacySettings((s) => ({ ...s, shareLocation: v }))
                  saveSetting('privacySettings', { ...privacySettings, shareLocation: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={BarChart3} title="Data Sharing" description="Share anonymous usage data to improve the platform">
              <Toggle
                checked={privacySettings.allowDataSharing}
                onChange={(v) => {
                  setPrivacySettings((s) => ({ ...s, allowDataSharing: v }))
                  saveSetting('privacySettings', { ...privacySettings, allowDataSharing: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={Eye} title="Ad Tracking" description="Allow personalized advertisements">
              <Toggle
                checked={privacySettings.adTracking}
                onChange={(v) => {
                  setPrivacySettings((s) => ({ ...s, adTracking: v }))
                  saveSetting('privacySettings', { ...privacySettings, adTracking: v })
                }}
              />
            </SettingRow>
          </SectionCard>

          {/* ── Accessibility & Display ── */}
          <SectionCard icon={Accessibility} title="Accessibility" description="Display adjustments for better usability" accent="amber">
            <SettingRow icon={Eye} title="High Contrast" description="Increase contrast for better visibility">
              <Toggle
                checked={accessibilitySettings.highContrast}
                onChange={(v) => {
                  setAccessibilitySettings((s) => ({ ...s, highContrast: v }))
                  saveSetting('accessibilitySettings', { ...accessibilitySettings, highContrast: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={Sparkles} title="Large Text" description="Increase text size for easier reading">
              <Toggle
                checked={accessibilitySettings.largeText}
                onChange={(v) => {
                  setAccessibilitySettings((s) => ({ ...s, largeText: v }))
                  saveSetting('accessibilitySettings', { ...accessibilitySettings, largeText: v })
                }}
              />
            </SettingRow>
            <SettingRow icon={Monitor} title="Reduce Motion" description="Minimize animations and transitions">
              <Toggle
                checked={accessibilitySettings.reduceMotion}
                onChange={(v) => {
                  setAccessibilitySettings((s) => ({ ...s, reduceMotion: v }))
                  saveSetting('accessibilitySettings', { ...accessibilitySettings, reduceMotion: v })
                }}
              />
            </SettingRow>
          </SectionCard>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enable Two-Factor Authentication</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              In production, you would scan a QR code with an authenticator app (like Google Authenticator or Authy) to set up 2FA. For this demo, we'll simulate the setup process.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShow2FAModal(false)}
                className="rounded-xl text-xs font-bold h-9 border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnable2FA}
                disabled={twoFactorLoading}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 gap-2"
              >
                {twoFactorLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enabling…</> : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
