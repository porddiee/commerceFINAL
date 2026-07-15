'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { authService, profilesService } from '@/services'
import {
  Loader2, Eye, EyeOff, Mail, Lock, User, ArrowRight,
  ShoppingBag, Shield, Users, Star, Check, TrendingUp,
} from 'lucide-react'
import Image from 'next/image'

const FEATURES = [
  { icon: ShoppingBag, title: 'Buy & Sell Locally', desc: 'Thousands of products from local sellers' },
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

type StrengthLevel = { score: number; label: string; color: string }

function getPasswordStrength(pwd: string): StrengthLevel {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { score, label: 'Too weak', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' }
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-400' }
  if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' }
  return { score, label: 'Very strong', color: 'bg-emerald-400' }
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, setUser, setProfile, profile } = useAuthStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { 
    if (user && profile) {
      router.push(profile.role === 'admin' ? '/admin' : '/user')
    }
  }, [user, profile, router])

  const strength = useMemo(() => password ? getPasswordStrength(password) : null, [password])
  const passwordsMatch = confirmPassword && password === confirmPassword

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return }
    try {
      const data = await authService.signUp({ email, password, full_name: fullName })
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

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await authService.signInWithOAuth('google', {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (data.url) window.location.href = data.url
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

      {/* ── Left: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl tracking-tight">SGShop</span>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              Free to join · No listing fees
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight animate-broken-lamp">
              Start selling in{' '}
              <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
                minutes.
              </span>
            </h1>
            <p className="text-indigo-100/90 text-lg leading-relaxed max-w-md font-medium">
              Join thousands of Surigao residents buying and selling everything from gadgets to fresh produce.
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

        <p className="text-indigo-300/60 text-sm">© 2025 SGShop</p>
      </div>

      {/* ── Right: Register Form ── */}
      <div className="w-full lg:w-[48%] relative z-10 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-2">
            <span className="text-white font-black text-lg">SGShop</span>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl border-0 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Join SGShop and start buying or selling</p>
            </div>

            {/* Google */}
            <Button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] gap-3 mb-5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Sign up with Google
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <form onSubmit={handleEmailRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="fullName" type="text" placeholder="Juan dela Cruz"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    required disabled={loading}
                    className="h-11 pl-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="email" type="email" placeholder="name@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required disabled={loading}
                    className="h-11 pl-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Password + Strength */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required disabled={loading} minLength={6}
                    className="h-11 pl-10 pr-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all hover:border-slate-300"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <div key={bar} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.score >= bar ? strength.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${
                      strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-orange-500' :
                      strength.score === 3 ? 'text-amber-500' : 'text-emerald-600'
                    }`}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required disabled={loading} minLength={6}
                    className={`h-11 pl-10 pr-10 rounded-xl border-2 transition-all duration-200 ${
                      confirmPassword
                        ? passwordsMatch
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'
                          : 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 hover:border-slate-300'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {confirmPassword && passwordsMatch && (
                    <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                    Passwords don't match
                  </p>
                )}
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
                disabled={loading || (!!confirmPassword && !passwordsMatch)}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] gap-2 mt-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? 'Creating account…' : 'Create account'}
              </Button>

              <p className="text-center text-xs text-slate-400 pt-0.5">
                By signing up, you agree to our{' '}
                <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors">Terms of Service</span>{' '}
                and{' '}
                <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors">Privacy Policy</span>
              </p>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-indigo-200">
            Already have an account?{' '}
            <Link href="/login" className="text-white font-bold hover:text-indigo-100 transition-colors underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
