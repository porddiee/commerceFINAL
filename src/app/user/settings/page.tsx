'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useLanguageStore } from '@/lib/store/language'
import { Upload, Shield, Lock, Bell, Eye, Globe, CheckCircle, XCircle, Clock } from 'lucide-react'

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
      // Apply theme
      if (prefs.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (prefs.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      // Apply language from store
      setLanguage(prefs.language || 'en')
    }
    if (savedAccessibility) setAccessibilitySettings(JSON.parse(savedAccessibility))
  }, [setLanguage])

  // Save settings to localStorage when they change
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

  const getVerificationStatusUI = () => {
    switch (profile?.verification_status) {
      case 'pending':
        return (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                <Clock className="h-5 w-5" />
                Verification Pending
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Your verification request is being reviewed by an admin. This usually takes 1-2 business days.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      case 'approved':
        return (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                Verified Seller
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                You are now a verified seller and can create listings on SuriMart.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      case 'rejected':
        return (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                Verification Rejected
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                {profile?.verification_rejection_reason || 'Your verification was rejected. Please try again with valid documents.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => {
                supabase.from('profiles').update({ verification_status: 'none' }).eq('id', user.id)
              }}>
                Submit New Request
              </Button>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                <Shield className="h-5 w-5" />
                Seller Verification
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Verify your identity to start selling on SuriMart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification_document">Upload Valid ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="verification_document"
                      type="file"
                      accept="image/*,.pdf"
                      className="cursor-pointer"
                      onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                      required
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted: Driver's License, Passport, UMID, SSS ID
                  </p>
                </div>
                <Button type="submit" disabled={verificationLoading || !verificationFile}>
                  {verificationLoading ? 'Submitting...' : 'Submit for Verification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{translate('settings')}</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Account & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Account & Security
          </CardTitle>
          <CardDescription>Manage personal data, update passwords, and enable two-factor authentication (2FA)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline">Enable 2FA</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>Control ad tracking, location access, and data sharing permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Share Location</h4>
              <p className="text-sm text-muted-foreground">Allow others to see your general location</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.shareLocation}
              onChange={(e) => {
                setPrivacySettings({ ...privacySettings, shareLocation: e.target.checked })
                saveSetting('privacySettings', { ...privacySettings, shareLocation: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Data Sharing</h4>
              <p className="text-sm text-muted-foreground">Allow sharing of anonymous usage data</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.allowDataSharing}
              onChange={(e) => {
                setPrivacySettings({ ...privacySettings, allowDataSharing: e.target.checked })
                saveSetting('privacySettings', { ...privacySettings, allowDataSharing: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Ad Tracking</h4>
              <p className="text-sm text-muted-foreground">Allow personalized advertisements</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.adTracking}
              onChange={(e) => {
                setPrivacySettings({ ...privacySettings, adTracking: e.target.checked })
                saveSetting('privacySettings', { ...privacySettings, adTracking: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Customize push, email, and in-app alert frequencies to avoid notification fatigue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.pushNotifications}
              onChange={(e) => {
                setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })
                saveSetting('notificationSettings', { ...notificationSettings, pushNotifications: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">Receive email updates and alerts</p>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.emailNotifications}
              onChange={(e) => {
                setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })
                saveSetting('notificationSettings', { ...notificationSettings, emailNotifications: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Listing Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified about new listings in your area</p>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.listingAlerts}
              onChange={(e) => {
                setNotificationSettings({ ...notificationSettings, listingAlerts: e.target.checked })
                saveSetting('notificationSettings', { ...notificationSettings, listingAlerts: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Message Alerts</h4>
              <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.messageAlerts}
              onChange={(e) => {
                setNotificationSettings({ ...notificationSettings, messageAlerts: e.target.checked })
                saveSetting('notificationSettings', { ...notificationSettings, messageAlerts: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>Configure default language, regional formats, and auto-update behaviors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{translate('language')}</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => {
                const newLanguage = e.target.value as Language
                setLanguage(newLanguage)
                setPreferences({ ...preferences, language: newLanguage })
                saveSetting('preferences', { ...preferences, language: newLanguage })
              }}
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="en">English</option>
              <option value="fil">Filipino</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">{translate('theme')}</Label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={(e) => {
                const newTheme = e.target.value
                setPreferences({ ...preferences, theme: newTheme })
                saveSetting('preferences', { ...preferences, theme: newTheme })
                // Apply theme immediately
                if (newTheme === 'dark') {
                  document.documentElement.classList.add('dark')
                } else if (newTheme === 'light') {
                  document.documentElement.classList.remove('dark')
                }
              }}
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="system">{translate('system')}</option>
              <option value="light">{translate('light')}</option>
              <option value="dark">{translate('dark')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility & Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility & Display
          </CardTitle>
          <CardDescription>Customize display settings for better accessibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">High Contrast Mode</h4>
              <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
            </div>
            <input
              type="checkbox"
              checked={accessibilitySettings.highContrast}
              onChange={(e) => {
                setAccessibilitySettings({ ...accessibilitySettings, highContrast: e.target.checked })
                saveSetting('accessibilitySettings', { ...accessibilitySettings, highContrast: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Large Text</h4>
              <p className="text-sm text-muted-foreground">Increase text size for easier reading</p>
            </div>
            <input
              type="checkbox"
              checked={accessibilitySettings.largeText}
              onChange={(e) => {
                setAccessibilitySettings({ ...accessibilitySettings, largeText: e.target.checked })
                saveSetting('accessibilitySettings', { ...accessibilitySettings, largeText: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Reduce Motion</h4>
              <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
            </div>
            <input
              type="checkbox"
              checked={accessibilitySettings.reduceMotion}
              onChange={(e) => {
                setAccessibilitySettings({ ...accessibilitySettings, reduceMotion: e.target.checked })
                saveSetting('accessibilitySettings', { ...accessibilitySettings, reduceMotion: e.target.checked })
              }}
              className="w-5 h-5"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
