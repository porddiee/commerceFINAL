'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Users, Target, Zap, ArrowRight, CheckCircle, MapPin, ShoppingBag, Star, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const VALUES = [
  {
    icon: Shield,
    title: 'Trust & Safety',
    desc: 'We require all sellers to verify their identity with a valid government ID before listing items — ensuring every transaction is with a real, accountable person.',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Users,
    title: 'Community First',
    desc: "Built for the Surigao region, SuriMart connects neighbors. Whether you're in Surigao City or a nearby municipality, your buyer or seller is just around the corner.",
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Target,
    title: 'Simple Experience',
    desc: 'Our platform is designed with clarity in mind — clean search, intuitive navigation, and a listing flow that gets your product live in under 5 minutes.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Zap,
    title: 'Fast & Modern',
    desc: 'Powered by Next.js 15 and Supabase, SuriMart delivers real-time updates, instant search, and a snappy experience across every device.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
]

const STEPS = [
  { n: '01', title: 'Create an Account', desc: 'Sign up in seconds with email or Google — no lengthy forms required.' },
  { n: '02', title: 'Verify Your Identity', desc: 'Upload a government-issued ID to unlock seller status and build buyer trust.' },
  { n: '03', title: 'List or Browse', desc: 'Post your items with photos and a price, or search thousands of local products.' },
  { n: '04', title: 'Connect & Transact', desc: 'Message sellers directly, arrange meetups, and complete safe transactions.' },
]

export default function AboutPage() {
  const supabase = createClient()
  const [stats, setStats] = useState([
    { value: '0', label: 'Active Products', icon: ShoppingBag },
    { value: '0', label: 'Verified Users', icon: Users },
    { value: '0.0', label: 'Avg. Seller Rating', icon: Star },
    { value: '24/7', label: 'Community Support', icon: MessageCircle },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [
        { count: listingsCount },
        { count: verifiedUsersCount },
        { data: reviews },
      ] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified_seller', true),
        supabase
          .from('reviews')
          .select('rating'),
      ])

      // Calculate average rating
      const avgRating = reviews && reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0'

      setStats([
        { value: `${listingsCount || 0}+`, label: 'Active Products', icon: ShoppingBag },
        { value: `${verifiedUsersCount || 0}+`, label: 'Verified Users', icon: Users },
        { value: `${avgRating}★`, label: 'Avg. Seller Rating', icon: Star },
        { value: '24/7', label: 'Community Support', icon: MessageCircle },
      ])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex-1 space-y-0">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="container mx-auto max-w-3xl text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-indigo-300" />
            Surigao del Norte, Philippines
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            About{' '}
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
              SuriMart
            </span>
          </h1>
          <p className="text-lg text-indigo-100/90 max-w-xl mx-auto leading-relaxed font-medium">
            Connecting the people of Surigao through safe, simple, and community-driven commerce — online and local.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-indigo-700 font-bold text-sm shadow-lg hover:bg-indigo-50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-md"
            >
              <Users className="h-4 w-4" />
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center py-8 px-4 gap-2 ${i < 3 ? 'border-r border-slate-100 dark:border-slate-800' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-1">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '...' : value}</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Our Mission</span>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Commerce that works for everyone in Surigao
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                SuriMart was built with one goal: to make buying and selling in Surigao del Norte safe, fast, and community-centered. We believe local commerce thrives when people trust each other — so we built the tools to make that trust easy.
              </p>
              <ul className="space-y-3">
                {[
                  'Identity-verified sellers for every listing',
                  'Direct messaging with no middlemen',
                  'Honest buyer reviews on every transaction',
                  'Free to use — no listing fees, ever',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual block */}
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white shadow-xl shadow-indigo-500/20">
                <blockquote className="text-xl font-semibold leading-relaxed italic">
                  "We built SuriMart because we believe every person in Surigao deserves a marketplace they can trust."
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    SM
                  </div>
                  <div>
                    <p className="font-bold text-sm">The SuriMart Team</p>
                    <p className="text-indigo-200 text-xs">Surigao City, Philippines</p>
                  </div>
                </div>
              </div>
              {/* Decorative dot grid */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10">
                <div className="grid grid-cols-6 gap-2">
                  {[...Array(36)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">What We Stand For</span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, color, bg, text }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex gap-5"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Getting Started</span>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">How SuriMart Works</h2>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-px bg-gradient-to-b from-indigo-300 via-blue-300 to-transparent dark:from-indigo-700 dark:via-blue-800 hidden md:block" />
            <div className="space-y-8">
              {STEPS.map(({ n, title, desc }, i) => (
                <div key={n} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-20 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white text-sm font-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200 relative z-10">
                      {i + 1}
                    </div>
                    <span className="text-[10px] text-indigo-400 dark:text-indigo-600 font-bold mt-1">{n}</span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm group-hover:shadow-md group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all duration-200">
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="container mx-auto max-w-2xl text-center relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight">Ready to join SuriMart?</h2>
          <p className="text-indigo-100/90 text-lg leading-relaxed">
            Create your free account and start exploring thousands of local products today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-indigo-700 font-bold text-sm shadow-xl hover:bg-indigo-50 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-md"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
