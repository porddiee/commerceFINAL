'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { authService, profilesService } from '@/services'
import { Loader2, Eye, EyeOff, Mail, Lock, ShoppingBag, Shield, Users, Star, ArrowRight, TrendingUp } from 'lucide-react'
import Image from 'next/image'

// Dynamically import Capacitor to avoid build issues on web
let Capacitor: any = null
let Browser: any = null
try {
  Capacitor = require('@capacitor/core')
  Browser = require('@capacitor/browser')
} catch (e) {
  // Capacitor not available (web build)
}

const FEATURES = [
  { icon: ShoppingBag, title: 'Buy & Sell Locally', desc: 'Thousands of products from Surigao sellers' },
  { icon: Shield, title: 'Safe Transactions', desc: 'Verified sellers and secure payments' },
  { icon: Users, title: 'Trusted Community', desc: 'Connect with real people near you' },
  { icon: Star, title: 'Rated & Reviewed', desc: 'Make informed decisions with reviews' },
]

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser, setProfile, profile } = useAuthStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { 
    if (user && profile) {
      router.push(profile.role === 'admin' ? '/admin' : '/user')
    }
  }, [user, profile, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authService.signInWithPassword({ email, password })
      if (data.user) {
        setUser(data.user)
        const profile = await profilesService.getProfileById(data.user.id)
        if (profile) {
          setProfile(profile)
          router.push(profile.role === 'admin' ? '/admin' : '/user')
        }
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // Use Capacitor Browser for OAuth in mobile app
      const isNativeApp = Capacitor?.isNativePlatform() || false
      
      if (isNativeApp) {
        // Open OAuth in in-app browser for mobile
        const result = await authService.signInWithOAuth('google', {
          redirectTo: `${window.location.origin}/auth/callback`,
        })
        
        if (result.url) {
          await Browser.open({ url: result.url })
        }
      } else {
        // Regular web flow
        const result = await authService.signInWithOAuth('google', {
          redirectTo: `${window.location.origin}/auth/callback`,
        })
        if (result.url) window.location.href = result.url
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'An error occurred'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      {/* Background Image — matches homepage hero */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
          alt="Marketplace background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay gradients for readability — matches hero section */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-blue-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />
      </div>

      {/* Animated glow blobs — matches homepage hero */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* ── Left: Branding Panel (Desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg overflow-hidden">
            <Image src="/logo.png" alt="SuriMart" width={44} height={44} className="object-contain" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">SuriMart</span>
        </div>

        {/* Hero text */}
        <div className="space-y-8 mt-4">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              Surigao Marketplace
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight animate-broken-lamp">
              Your local market,{' '}
              <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
                now online.
              </span>
            </h1>
            <p className="text-indigo-100/90 text-lg leading-relaxed max-w-md font-medium">
              Buy and sell with trusted community members in Surigao del Norte. Safe, simple, and local.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                  <Icon
                    className="h-5 w-5 text-white animate-subtle-bounce"
                    style={{ animationDelay: `${index * 200}ms` }}
                  />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{title}</p>
                  <p className="text-indigo-200/80 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-300/60 text-sm">© 2025 SuriMart · Surigao del Norte</p>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="w-full lg:w-[48%] relative z-10 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="SuriMart" width={40} height={40} className="object-contain" />
            </div>
            <span className="text-white font-black text-lg">SuriMart</span>
          </div>

          {/* Form card — frosted white on the indigo background */}
          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl border-0 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your SuriMart account</p>
            </div>

            {/* Google */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] gap-3 mb-5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pl-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
                  <button type="button" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pl-10 pr-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 hover:border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gap-2 mt-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-indigo-200">
            Don't have an account?{' '}
            <Link href="/register" className="text-white font-bold hover:text-indigo-100 transition-colors underline underline-offset-2">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
