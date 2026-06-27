'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ShoppingBag, Users, Shield, TrendingUp, Clock, X, MapPin, Handshake, ChevronDown, ShoppingCart, Package, Store, Truck, CreditCard, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import ListingCard from '@/components/listing-card'

const categoryIcons: Record<string, string> = {
  'Electronics': '💻',
  'Fashion': '👕',
  'Home & Garden': '🏠',
  'Vehicles': '🚗',
  'Sports & Hobbies': '⚽',
  'Books & Media': '📚',
}

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [categories, setCategories] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [allFeaturedListings, setAllFeaturedListings] = useState<any[]>([])
  const [stats, setStats] = useState({ listings: 0, users: 0 })
  const [displayStats, setDisplayStats] = useState({ listings: 0, users: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [heroInView, setHeroInView] = useState(false)
  const [heroPointer, setHeroPointer] = useState({ x: 50, y: 38 })
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([])
  const trailIdRef = useRef(0)
  
  // Split featured listings into 3 groups for different columns
  const column1Listings = useMemo(() => {
    const mid = Math.floor(allFeaturedListings.length / 3)
    return [...allFeaturedListings.slice(0, mid), ...allFeaturedListings.slice(0, mid)]
  }, [allFeaturedListings])
  
  const column2Listings = useMemo(() => {
    const mid = Math.floor(allFeaturedListings.length / 3)
    const end = Math.floor((allFeaturedListings.length / 3) * 2)
    return [...allFeaturedListings.slice(mid, end), ...allFeaturedListings.slice(mid, end)]
  }, [allFeaturedListings])
  
  const column3Listings = useMemo(() => {
    const start = Math.floor((allFeaturedListings.length / 3) * 2)
    return [...allFeaturedListings.slice(start), ...allFeaturedListings.slice(start)]
  }, [allFeaturedListings])
  
  // Intersection observer animations
  const [categoriesInView, setCategoriesInView] = useState(false)
  const [featuresInView, setFeaturesInView] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
    fetchStats()
    fetchFeaturedListings()
    if (user) {
      fetchRecentlyViewed()
    }
  }, [user])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroInView(entry.isIntersecting)
      },
      { threshold: 0.35 }
    )

    if (heroRef.current) {
      observer.observe(heroRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!heroInView) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setHeroPointer({ x, y })
      
      // Add to cursor trail
      const id = trailIdRef.current++
      setCursorTrail(prev => [...prev, { x, y, id }])
      
      // Remove trail point after animation
      setTimeout(() => {
        setCursorTrail(prev => prev.filter(point => point.id !== id))
      }, 1000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [heroInView])

  useEffect(() => {
    if (!heroInView) return

    const duration = 1200
    const startedAt = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayStats({
        listings: Math.round(stats.listings * eased),
        users: Math.round(stats.users * eased)
      })

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [heroInView, stats.listings, stats.users])

  const handleHeroPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setHeroPointer({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100
    })
  }

  const fetchFeaturedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setAllFeaturedListings(data || [])
    } catch (error) {
      console.error('Error fetching featured listings:', error)
    }
  }

  // Scroll observers for smooth animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setCategoriesInView(entry.isIntersecting)
        })
      },
      { threshold: 0.1 }
    )

    if (categoriesRef.current) {
      observer.observe(categoriesRef.current)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setFeaturesInView(entry.isIntersecting)
        })
      },
      { threshold: 0.1 }
    )

    if (featuresRef.current) {
      observer.observe(featuresRef.current)
    }
    return () => observer.disconnect()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError

      // Fetch active count for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active')

          return { ...category, count: count || 0 }
        })
      )

      setCategories(categoriesWithCounts)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentlyViewed = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('recently_viewed')
        .select(`
          listings (
            *,
            profiles!listings_seller_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(8)
      
      const listings = data?.map((item: any) => ({
        ...item.listings,
        sellerName: item.listings.profiles?.full_name || 'Unknown',
        sellerAvatar: item.listings.profiles?.avatar_url
      })).filter(Boolean) || []
      
      const seen = new Set()
      const deduplicated = listings.filter((listing: any) => {
        if (seen.has(listing.id)) return false
        seen.add(listing.id)
        return true
      })
      
      setRecentlyViewed(deduplicated)
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const [{ count: listingsCount }, { count: usersCount }] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ])
      setStats({
        listings: listingsCount || 0,
        users: usersCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRemoveFromRecentlyViewed = async (listingId: string) => {
    if (!user) return
    try {
      await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      
      setRecentlyViewed(recentlyViewed.filter((l) => l.id !== listingId))
    } catch (error) {
      console.error('Error removing from recently viewed:', error)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="flex-1 space-y-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bgPan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes heroTide {
          0% { transform: translate3d(-2%, -1%, 0) scale(1); }
          50% { transform: translate3d(2%, 1.5%, 0) scale(1.03); }
          100% { transform: translate3d(-2%, -1%, 0) scale(1); }
        }
        @keyframes wovenDrift {
          0% { transform: translate3d(0, 0, 0); opacity: 0.32; }
          50% { transform: translate3d(-24px, 18px, 0); opacity: 0.5; }
          100% { transform: translate3d(0, 0, 0); opacity: 0.32; }
        }
        @keyframes wordLift {
          0% {
            opacity: 0;
            transform: translate3d(0, 26px, 0) rotateX(34deg);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotateX(0deg);
            filter: blur(0);
          }
        }
        @keyframes marketPulse {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(-1.5deg);
          }
          50% {
            transform: translate3d(0, -8px, 0) rotate(1.5deg);
          }
        }
        @keyframes scrollCue {
          0%, 100% { transform: translateY(0); opacity: 0.65; }
          50% { transform: translateY(8px); opacity: 1; }
        }
        @keyframes brokenLamp {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            opacity: 1;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.4);
            color: #ffffff;
          }
          20%, 24%, 55% {
            opacity: 0.55;
            text-shadow: none;
            color: rgba(226, 232, 240, 0.8);
          }
        }
        @keyframes loopWelcome {
          0% { opacity: 0; }
          16.67% { opacity: 1; }
          91.67% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes loopTo {
          0%, 16.67% { opacity: 0; }
          33.33% { opacity: 1; }
          91.67% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes loopSuriMart {
          0%, 33.33% { opacity: 0; }
          50% { opacity: 1; }
          91.67% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes floatIcon1 {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(15px, -20px, 0) rotate(5deg); }
          50% { transform: translate3d(30px, 0, 0) rotate(0deg); }
          75% { transform: translate3d(15px, 20px, 0) rotate(-5deg); }
        }
        @keyframes floatIcon2 {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          33% { transform: translate3d(-20px, 15px, 0) rotate(-8deg); }
          66% { transform: translate3d(10px, -25px, 0) rotate(6deg); }
        }
        @keyframes floatIcon3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-25px, -15px, 0) scale(1.05); }
        }
        @keyframes floatIcon4 {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(20px, 25px, 0); }
          50% { transform: translate3d(-10px, 15px, 0); }
          75% { transform: translate3d(15px, -20px, 0); }
        }
        @keyframes floatIcon5 {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-30px, 20px, 0) rotate(10deg); }
        }
        @keyframes badgeWaveLeft {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-1deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-1px) rotate(0.5deg); }
        }
        @keyframes badgeWaveRight {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-1px) rotate(0.5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-1deg); }
        }
        @keyframes mouseGlow {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes trailFade {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
        }
        .animate-float-icon-1 {
          animation: floatIcon1 8s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-icon-2 {
          animation: floatIcon2 10s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-icon-3 {
          animation: floatIcon3 12s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-icon-4 {
          animation: floatIcon4 9s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-icon-5 {
          animation: floatIcon5 11s ease-in-out infinite;
          will-change: transform;
        }
        .animate-badge-wave-left {
          animation: badgeWaveLeft 3s ease-in-out infinite;
          will-change: transform;
        }
        .animate-badge-wave-right {
          animation: badgeWaveRight 3s ease-in-out infinite 0.15s;
          will-change: transform;
        }
        .mouse-glow {
          animation: mouseGlow 0.3s ease-out forwards;
        }
        .trail-fade {
          animation: trailFade 1s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-bg-pan {
          background-size: 200% 200%;
          animation: bgPan 4s ease infinite;
        }
        .hero-tide {
          animation: heroTide 16s ease-in-out infinite;
          will-change: transform;
        }
        .hero-woven-drift {
          animation: wovenDrift 22s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .hero-word {
          animation: wordLift 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: bottom left;
        }
        .hero-market-chip {
          animation: marketPulse 6s ease-in-out infinite;
          will-change: transform;
        }
        .hero-scroll-cue {
          animation: scrollCue 1.8s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .hero-magnetic {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .hero-magnetic::after {
          content: '';
          position: absolute;
          inset: -1px;
          background: radial-gradient(circle at 35% 0%, rgba(255,255,255,0.45), transparent 34%);
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 300ms ease, transform 300ms ease;
          pointer-events: none;
          z-index: -1;
        }
        .hero-magnetic:hover::after {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-product-stage {
          transform-style: preserve-3d;
          perspective: 1200px;
        }
        .hero-product-card {
          transform: translateZ(0) rotateX(0deg) rotateY(0deg);
          will-change: transform;
        }
        .hero-product-card:hover {
          transform: translateZ(24px) rotateX(3deg) rotateY(-4deg) scale(1.045);
        }
        .animate-broken-lamp {
          animation: brokenLamp 3.5s infinite;
        }
        .animate-loop-welcome {
          animation: loopWelcome 6s infinite;
        }
        .animate-loop-to {
          animation: loopTo 6s infinite;
        }
        .animate-loop-surimart {
          animation: loopSuriMart 6s infinite;
        }
      `}} />
      {/* Hero Showcase Section */}
      <section 
        ref={heroRef}
        className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-950 text-white py-12 sm:py-16 px-4 relative overflow-hidden min-h-[500px] sm:min-h-[600px] flex items-center shadow-xl"
        onPointerMove={handleHeroPointerMove}
      >
        {/* Glow backdrop elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        {/* Mouse cursor trail effect */}
        {cursorTrail.map((point) => (
          <div
            key={point.id}
            className="absolute w-6 h-6 rounded-full blur-x.2 pointer-events-none trail-fade"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              background: `linear-gradient(135deg, rgba(59, 130, 246, 2), rgba(147, 197, 253, 0.7), rgba(255, 255, 255, 0.45))`
            }}
          />
        ))}
        
        {/* Floating e-commerce icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Scattered icons across the entire background */}
          <ShoppingBag className="absolute top-[8%] left-[12%] w-5 h-5 sm:w-9 sm:h-9 text-white/7 animate-float-icon-1" />
          <ShoppingCart className="absolute top-[15%] right-[25%] w-6 h-6 sm:w-10 sm:h-10 text-white/8 animate-float-icon-2" />
          <Package className="absolute top-[35%] left-[8%] w-5 h-5 sm:w-9 sm:h-9 text-white/7 animate-float-icon-3" />
          <Store className="absolute top-[45%] right-[15%] w-6 h-6 sm:w-10 sm:h-10 text-white/8 animate-float-icon-4" />
          <Truck className="absolute bottom-[35%] left-[20%] w-5 h-5 sm:w-9 sm:h-9 text-white/7 animate-float-icon-5" />
          <CreditCard className="absolute bottom-[25%] right-[22%] w-6 h-6 sm:w-10 sm:h-10 text-white/8 animate-float-icon-1" style={{ animationDelay: '2s' }} />
          <Gift className="absolute top-[65%] left-[35%] w-5 h-5 sm:w-9 sm:h-9 text-white/7 animate-float-icon-2" style={{ animationDelay: '3s' }} />
          <ShoppingBag className="absolute top-[20%] left-[40%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-1" style={{ animationDelay: '4s' }} />
          <Store className="absolute bottom-[15%] left-[45%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-4" style={{ animationDelay: '5s' }} />
          <Gift className="absolute top-[75%] right-[35%] w-5 h-5 sm:w-8 sm:h-8 text-white/6 animate-float-icon-2" style={{ animationDelay: '6s' }} />
          <CreditCard className="absolute top-[30%] right-[40%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-1" style={{ animationDelay: '7s' }} />
          <Package className="absolute bottom-[45%] left-[55%] w-5 h-5 sm:w-8 sm:h-8 text-white/6 animate-float-icon-3" style={{ animationDelay: '1.5s' }} />
          <ShoppingCart className="absolute top-[55%] right-[50%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-2" style={{ animationDelay: '2.5s' }} />
          <Truck className="absolute top-[40%] left-[60%] w-5 h-5 sm:w-8 sm:h-8 text-white/6 animate-float-icon-5" style={{ animationDelay: '3.5s' }} />
          <ShoppingBag className="absolute bottom-[20%] right-[60%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-1" style={{ animationDelay: '4.5s' }} />
          {/* Additional icons on upper middle */}
          <ShoppingCart className="absolute top-[12%] left-[45%] w-5 h-5 sm:w-8 sm:h-8 text-white/6 animate-float-icon-2" style={{ animationDelay: '0.5s' }} />
          <Package className="absolute top-[18%] right-[45%] w-4 h-4 sm:w-7 sm:h-7 text-white/5 animate-float-icon-3" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left Side: Content & Actions */}
            <div className="space-y-6 sm:space-y-8 text-left">
              <div className="space-y-2.5 sm:space-y-3.5">
                <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10 hover:scale-[1.03] transition-transform cursor-default overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 animate-badge-wave-left" />
                    <div className="flex-1 animate-badge-wave-right" />
                  </div>
                  <div className="relative flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-300 animate-pulse" />
                    <span className="animate-broken-lamp font-bold text-[10px] sm:text-xs">Surigao Region Marketplace</span>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight flex flex-wrap gap-x-3 items-center min-h-[72px]">
                  <span className="animate-loop-welcome">Welcome</span>
                  <span className="animate-loop-to">to</span>
                  <span className="animate-loop-surimart inline-block">
                    <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent bg-size-200 animate-bg-pan">SuriMart</span>
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-indigo-100/90 font-medium max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  Your trusted region marketplace. Safe meetups, verified products, and direct communication.
                </p>
              </div>

              <div className="flex gap-3 sm:gap-4 flex-wrap animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <Button 
                  size="lg" 
                  asChild 
                  className="bg-white hover:bg-indigo-50 text-indigo-700 shadow-xl rounded-full px-6 sm:px-8 font-bold hover:-translate-y-0.5 transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base"
                >
                  <Link href="/browse">
                    <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 animate-bounce" />
                    Browse Products
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild 
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 shadow-lg rounded-full px-6 sm:px-8 font-bold hover:-translate-y-0.5 transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base"
                >
                  <Link href="/register">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-indigo-200" />
                    Start Selling
                  </Link>
                </Button>
              </div>
              
              {/* Marketplace stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-white/10 max-w-md animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="group/stat cursor-default hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white group-hover/stat:text-indigo-200 transition-colors">{stats.listings.toLocaleString()}+</div>
                  <div className="text-indigo-200/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Active Products</div>
                </div>
                <div className="group/stat cursor-default hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white group-hover/stat:text-indigo-200 transition-colors">{stats.users.toLocaleString()}+</div>
                  <div className="text-indigo-200/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Verified Users</div>
                </div>
                <div className="group/stat cursor-default hover:scale-105 transition-transform duration-200">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white group-hover/stat:text-indigo-200 transition-colors">24/7</div>
                  <div className="text-indigo-200/80 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">Support</div>
                </div>
              </div>
            </div>

            {/* Right Side: Showcase Columns of Featured Listings */}
            <div className="relative h-[480px] hidden lg:block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 z-10 pointer-events-none" />
              
              {/* Featured Label overlay */}
              <div className="absolute top-4 left-4 z-20 bg-indigo-600/90 text-white font-bold text-[10px] tracking-widest uppercase py-1 px-3.5 rounded-full shadow-md backdrop-blur border border-indigo-400/30">
                Featured Products
              </div>

              {/* Grid scroll display */}
              <div className="grid grid-cols-3 gap-4 h-full">
                {/* Column 1 - Scroll Up */}
                <div className="scroll-container h-full overflow-hidden relative">
                  <div className="scroll-content scroll-column-up space-y-4">
                    {column1Listings.map((listing, index) => (
                      <Link
                        key={`${listing.id}-col1-${index}`}
                        href={`/products/${listing.id}`}
                        className="block rounded-xl overflow-hidden border border-white/20 bg-slate-900/80 shadow-md group relative aspect-square transition-transform duration-300 hover:scale-[1.03]"
                      >
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-2 border-t border-white/10">
                          <p className="text-[10px] font-bold text-white truncate">{listing.title}</p>
                          <p className="text-[10px] font-extrabold text-indigo-300">₱{listing.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Column 2 - Scroll Down */}
                <div className="scroll-container h-full overflow-hidden relative">
                  <div className="scroll-content scroll-column-down space-y-4">
                    {column2Listings.map((listing, index) => (
                      <Link
                        key={`${listing.id}-col2-${index}`}
                        href={`/products/${listing.id}`}
                        className="block rounded-xl overflow-hidden border border-white/20 bg-slate-900/80 shadow-md group relative aspect-square transition-transform duration-300 hover:scale-[1.03]"
                      >
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-2 border-t border-white/10">
                          <p className="text-[10px] font-bold text-white truncate">{listing.title}</p>
                          <p className="text-[10px] font-extrabold text-indigo-300">₱{listing.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Column 3 - Scroll Up */}
                <div className="scroll-container h-full overflow-hidden relative">
                  <div className="scroll-content scroll-column-up space-y-4">
                    {column3Listings.map((listing, index) => (
                      <Link
                        key={`${listing.id}-col3-${index}`}
                        href={`/products/${listing.id}`}
                        className="block rounded-xl overflow-hidden border border-white/20 bg-slate-900/80 shadow-md group relative aspect-square transition-transform duration-300 hover:scale-[1.03]"
                      >
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 p-2 border-t border-white/10">
                          <p className="text-[10px] font-bold text-white truncate">{listing.title}</p>
                          <p className="text-[10px] font-extrabold text-indigo-300">₱{listing.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Input Section */}
      <section className="py-12 px-4 bg-slate-50 dark:bg-slate-900/40 border-b">
        <div className="container mx-auto">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for products, categories, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-4 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base text-slate-800 dark:text-slate-100"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md transition-all duration-200 h-10 font-bold"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Recently Viewed Section */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-12 px-4 bg-white dark:bg-slate-950">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-8 border-b pb-3">
              <Clock className="h-5 w-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recently Viewed</h2>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {recentlyViewed.map((listing, index) => (
                <div key={`recently-${listing.id}-${index}`} className="flex-shrink-0 w-32 sm:w-52 relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur h-6 w-6 rounded-full shadow-sm hover:scale-105 border transition-all"
                    onClick={() => handleRemoveFromRecentlyViewed(listing.id)}
                  >
                    <X className="h-3.5 w-3.5 text-slate-500 hover:text-rose-500" />
                  </Button>
                  <ListingCard {...listing} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid Section */}
      <section ref={categoriesRef} className="py-16 px-4 bg-slate-55/20 dark:bg-slate-900/10">
        <div className="container mx-auto max-w-6xl">
          <h2 className={`text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-10 transition-all duration-700 ${
            categoriesInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            Browse Categories
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center animate-pulse h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/browse?category=${category.id}`}
                  className={`group transition-all duration-550 ${
                    categoriesInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  <Card className="hover:shadow-md hover:scale-[1.03] transition-all duration-300 border border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-850 rounded-2xl bg-white dark:bg-slate-950">
                    <CardContent className="p-5 text-center">
                      <div className="text-4xl mb-2.5 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                        {categoryIcons[category.name] || '📦'}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm sm:text-base">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">
                        {category.count || 0} products
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 px-4 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-5xl">
          <h2 className={`text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-10 transition-all duration-700 ${
            featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            Why Choose SuriMart?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${
              featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '100ms' }}>
              <CardHeader className="space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">Secure Transactions</CardTitle>
                <CardDescription className="text-slate-550 dark:text-slate-400 leading-relaxed text-sm">
                  Region-tailored safety tips and protected seller profiles prevent fraudulent deals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${
              featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <CardHeader className="space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">Verified Sellers</CardTitle>
                <CardDescription className="text-slate-550 dark:text-slate-400 leading-relaxed text-sm">
                  Document verifications authenticate local sellers to build deep marketplace trust.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${
              featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '300ms' }}>
              <CardHeader className="space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">Local Community Focus</CardTitle>
                <CardDescription className="text-slate-550 dark:text-slate-400 leading-relaxed text-sm">
                  Connect quickly with active products right in your municipality for fast cash handovers.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-700 via-indigo-850 to-blue-900 text-white relative overflow-hidden">
        {/* Glow backdrop elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="container mx-auto text-center relative z-10 max-w-2xl space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Ready to Start Buying or Selling?
          </h2>
          <p className="text-lg text-indigo-100/90 max-w-lg mx-auto leading-relaxed">
            Join thousands of users already trading and communication safely on SuriMart.
          </p>
          <div className="flex gap-4 justify-center flex-wrap pt-2">
            <Button 
              size="lg" 
              asChild 
              className="bg-white hover:bg-slate-50 text-indigo-700 shadow-xl rounded-full px-8 font-bold h-12"
            >
              <Link href="/register">
                <Users className="mr-2 h-5 w-5 text-indigo-650" />
                Create Account
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/25 shadow-lg rounded-full px-8 font-bold h-12"
            >
              <Link href="/browse">
                <ShoppingBag className="mr-2 h-5 w-5 text-indigo-200" />
                Explore Products
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
