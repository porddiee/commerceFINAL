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
    if (savedAccessibility) setAccessibilitySettings(JSON.parse(savedAccessibility))
  }, [setLanguage])

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
        useAuthStore.getState().setProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Failed to submit verification request')
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
            onClick={() => {
              if (user) supabase.from('profiles').update({ verification_status: 'none' }).eq('id', user.id)
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
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="mt-1.5 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Contact support to change your email address</p>
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
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-9 border-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                Enable 2FA
              </Button>
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
    </div>
  )
}
