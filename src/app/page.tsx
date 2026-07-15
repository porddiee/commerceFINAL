'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ShoppingBag, Users, Shield, TrendingUp, MapPin, Handshake, ChevronDown, ShoppingCart, Package, Store, Truck, CreditCard, Gift, Laptop, Shirt, Home, Car, Trophy, Book, ArrowUp, Baby, Briefcase, Utensils, Heart, MoreHorizontal, PawPrint, MessageSquare, Eye, ArrowUpRight, Flame, Zap, X, Download } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import { listingsService, profilesService } from '@/services'
import { createClient } from '@/lib/supabase/client'

const categoryIcons: Record<string, any> = {
  'electronics': Laptop,
  'fashion': Shirt,
  'home & garden': Home,
  'home': Home,
  'vehicles': Car,
  'sports & hobbies': Trophy,
  'sports': Trophy,
  'books & media': Book,
  'books': Book,
  'baby & kids': Baby,
  'baby': Baby,
  'business & industrial': Briefcase,
  'business': Briefcase,
  'foods': Utensils,
  'food': Utensils,
  'health & beauty': Heart,
  'health': Heart,
  'other': MoreHorizontal,
  'pets': PawPrint,
  'pet': PawPrint,
}

type TrendingProduct = {
  id: string
  title: string
  price: number | null
  views: number | null
  images: string[] | null
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCinematicIntro, setShowCinematicIntro] = useState(false)
  const [cinematicStage, setCinematicStage] = useState(0)
  const [introMounted, setIntroMounted] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({})
  const [allFeaturedListings, setAllFeaturedListings] = useState<any[]>([])
  const [stats, setStats] = useState({ listings: 0, users: 0 })
  const [displayStats, setDisplayStats] = useState({ listings: 0, users: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [heroInView, setHeroInView] = useState(false)
  const [heroPointer, setHeroPointer] = useState({ x: 50, y: 38 })
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([])
  const trailIdRef = useRef(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([])
  const [trendingProductsLoading, setTrendingProductsLoading] = useState(true)
  const [introProgress, setIntroProgress] = useState(0)

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
  const [howItWorksInView, setHowItWorksInView] = useState(false)
  const [trendingInView, setTrendingInView] = useState(false)
  const [trendingAnimKey, setTrendingAnimKey] = useState(0)
  const [footerInView, setFooterInView] = useState(false)
  const [footerAnimKey, setFooterAnimKey] = useState(0)
  const heroRef = useRef<HTMLElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const trendingRef = useRef<HTMLDivElement>(null)
  const trendingMountedRef = useRef(false)
  const footerRef = useRef<HTMLElement>(null)
  const footerMountedRef = useRef(false)

  useEffect(() => {
    fetchCategories()
    fetchStats()
    fetchFeaturedListings()
    fetchTrendingProducts()
  }, [user])

  // Search suggestions
  useEffect(() => {
    const fetchSearchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price')
          .ilike('title', `%${searchQuery.trim()}%`)
          .eq('status', 'active')
          .limit(5)

        if (error) throw error
        setSearchSuggestions(data || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching search suggestions:', error)
        setSearchSuggestions([])
      }
    }

    const debounceTimer = setTimeout(fetchSearchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Client-side mount check
  useEffect(() => {
    setIsClient(true)

    // Use Navigation Timing API to detect navigation type
    const navType = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    console.log('Navigation type:', navType?.type)

    if (navType?.type === 'reload') {
      // This is a reload - clear sessionStorage so intro plays
      console.log('Reload detected - clearing sessionStorage')
      sessionStorage.removeItem('hasSeenCinematicIntro')
      localStorage.removeItem('introLastShown')
    } else if (navType?.type === 'navigate') {
      // This is navigation (could be back/forward or fresh visit)
      // Check referrer to distinguish
      const referrer = document.referrer
      const currentOrigin = window.location.origin

      if (referrer && referrer.startsWith(currentOrigin)) {
        // Same-origin referrer = navigation between pages
        console.log('Same-origin navigation - keeping sessionStorage')
      } else {
        // Different/no referrer = fresh visit
        console.log('Fresh visit - clearing sessionStorage')
        sessionStorage.removeItem('hasSeenCinematicIntro')
        localStorage.removeItem('introLastShown')
      }
    }
  }, [])

  // Preload hero background image
  useEffect(() => {
    if (!isClient) return
    const img = new Image()
    img.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop'
  }, [isClient])

  // Cinematic intro animation (only on client and first visit)
  useEffect(() => {
    if (!isClient) return

    // Check if intro was already shown in this session
    const hasSeenIntro = sessionStorage.getItem('hasSeenCinematicIntro')

    if (hasSeenIntro) {
      // Don't show intro if already seen
      return
    }

    setShowCinematicIntro(true)
    setIntroMounted(true)
    setIntroProgress(0)

    // Animate progress bar smoothly from 0 to 100 over 8 seconds
    const progressStart = performance.now()
    const progressDuration = 8000
    let progressFrame = 0

    const tickProgress = (now: number) => {
      const elapsed = now - progressStart
      const pct = Math.min((elapsed / progressDuration) * 100, 100)
      setIntroProgress(pct)
      if (pct < 100) {
        progressFrame = requestAnimationFrame(tickProgress)
      }
    }
    progressFrame = requestAnimationFrame(tickProgress)

    const stage1 = setTimeout(() => setCinematicStage(1), 1000) // Background gradient fades in
    const stage2 = setTimeout(() => setCinematicStage(2), 2500) // Logo reveal with scale
    const stage3 = setTimeout(() => setCinematicStage(3), 4000) // Tagline slide up
    const stage4 = setTimeout(() => setCinematicStage(4), 5500) // Subtitle words appear together
    const stage5 = setTimeout(() => setCinematicStage(5), 7000) // Decorative elements + letterbox collapse
    const finish = setTimeout(() => {
      setShowCinematicIntro(false)
      setIntroProgress(100)
      // Keep intro mounted briefly so it can fade out while hero fades in
      setTimeout(() => setIntroMounted(false), 600)
      sessionStorage.setItem('hasSeenCinematicIntro', 'true')
      localStorage.setItem('introLastShown', Date.now().toString())
    }, 8000) // Complete and mark as seen

    return () => {
      cancelAnimationFrame(progressFrame)
      clearTimeout(stage1)
      clearTimeout(stage2)
      clearTimeout(stage3)
      clearTimeout(stage4)
      clearTimeout(stage5)
      clearTimeout(finish)
    }
  }, [isClient])

  // Fetch products for hovered category
  useEffect(() => {
    if (!hoveredCategory) return

    const fetchCategoryProducts = async () => {
      // Check if we already have products for this category
      if (categoryProducts[hoveredCategory]) return

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price, images')
          .eq('category_id', hoveredCategory)
          .eq('status', 'active')
          .limit(3)

        if (error) throw error
        setCategoryProducts(prev => ({
          ...prev,
          [hoveredCategory]: data || []
        }))
      } catch (error) {
        console.error('Error fetching category products:', error)
      }
    }

    fetchCategoryProducts()
  }, [hoveredCategory, categoryProducts])

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

  // Scroll progress and back to top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(Math.min(progress, 100))
      setShowBackToTop(scrollTop > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    const startPosition = window.scrollY
    const duration = 1500 // 1.5 seconds for slower scroll
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)

      window.scrollTo(0, startPosition * (1 - easeOut))

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  const skipCinematicIntro = () => {
    setShowCinematicIntro(false)
    setTimeout(() => setIntroMounted(false), 600)
    sessionStorage.setItem('hasSeenCinematicIntro', 'true')
  }

  const handleHeroPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setHeroPointer({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100
    })
  }

  const fetchTrendingProducts = async () => {
    setTrendingProductsLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, views, images')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(3)

      if (error) throw error
      setTrendingProducts(data || [])
    } catch (error) {
      console.error('Error fetching trending products:', error)
      setTrendingProducts([])
    } finally {
      setTrendingProductsLoading(false)
    }
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setHowItWorksInView(entry.isIntersecting)
        })
      },
      { threshold: 0.1 }
    )

    if (howItWorksRef.current) {
      observer.observe(howItWorksRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Trending products scroll observer - repeatable on each scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTrendingAnimKey(prev => prev + 1)
          }
        })
      },
      { threshold: 0.15 }
    )

    if (trendingRef.current) {
      observer.observe(trendingRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Trigger trending animation on key change (repeatable) - skip initial mount so cards stay hidden until scrolled into view
  useEffect(() => {
    if (!trendingMountedRef.current) {
      trendingMountedRef.current = true
      return
    }
    setTrendingInView(false)
    const timer = setTimeout(() => setTrendingInView(true), 50)
    return () => clearTimeout(timer)
  }, [trendingAnimKey])

  // Footer scroll observer - repeatable on each scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFooterAnimKey(prev => prev + 1)
          }
        })
      },
      { threshold: 0.2 }
    )

    if (footerRef.current) {
      observer.observe(footerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Trigger footer animation on key change (repeatable)
  useEffect(() => {
    if (!footerMountedRef.current) {
      footerMountedRef.current = true
      return
    }
    setFooterInView(false)
    const timer = setTimeout(() => setFooterInView(true), 50)
    return () => clearTimeout(timer)
  }, [footerAnimKey])

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

  const fetchStats = async () => {
    try {
      const [listingsCount, usersCount] = await Promise.all([
        listingsService.countActiveListings(),
        profilesService.countUsers()
      ])
      setStats({
        listings: listingsCount,
        users: usersCount
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
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
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes loopTo {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes loopSuriMart {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
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
          animation: scrollCue 1s ease-in-out infinite;
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
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 200% 50%; }
        }
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
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes textShine {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }
        .animate-text-shine {
          background-size: 300% 100%;
          animation: textShine 2.5s ease-in-out infinite;
          will-change: background-position;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(48px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .trending-card-animate {
          animation: slideUp cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        @keyframes sectionFadeIn {
          from {
            opacity: 0;
            transform: translateY(32px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .trending-section-visible {
          animation: sectionFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}} />

      {/* Cinematic Introduction - stays mounted briefly after hiding for crossfade */}
      {introMounted && (
        <div className={`fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-4000 ${!showCinematicIntro || cinematicStage >= 5 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Skip Button - Enhanced for accessibility and touch targets */}
          <button
            onClick={skipCinematicIntro}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] min-w-[88px] shadow-lg hover:shadow-xl"
            aria-label="Skip introduction"
          >
            <X className="h-4 w-4" />
            Skip
          </button>

          {/* Background image that fades in smoothly - matches hero section */}
          <div className={`absolute inset-0 transition-opacity duration-3000 ease-in-out ${cinematicStage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Dark overlay gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-blue-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />
          </div>

          {/* Progress indicator bar */}
          <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-300 transition-all duration-75 ease-linear"
              style={{ width: `${introProgress}%` }}
            />
          </div>

          {/* Cinematic letterbox effect */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20">
            <div className={`h-16 bg-black transition-all duration-2500 ${cinematicStage >= 5 ? 'h-0' : ''}`} />
            <div className={`h-16 bg-black transition-all duration-2500 ${cinematicStage >= 5 ? 'h-0' : ''}`} />
          </div>

          {/* Main content - fades out smoothly on outro */}
          <div className={`relative z-10 text-center transition-all duration-1000 ease-in-out ${!showCinematicIntro || cinematicStage >= 5 ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
            {/* Logo reveal with enhanced gradient text */}
            <div className={`transition-all duration-700 ease-out ${cinematicStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
              <h1 className="text-4xl sm:text-8xl font-black tracking-widest mb-4 bg-gradient-to-r from-indigo-400 via-white to-blue-400 bg-clip-text text-transparent animate-gradient-shift drop-shadow-2xl">
                SGSHOP
              </h1>
              <div className={`w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto transition-all duration-500 ease-out ${cinematicStage >= 2 ? 'scale-x-100' : 'scale-x-0'}`} />
            </div>

            {/* Tagline reveal with improved contrast */}
            <div className={`mt-8 transition-all duration-500 ease-out delay-200 ${cinematicStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-base sm:text-2xl text-indigo-200 font-light tracking-wide drop-shadow-md">
                Your Gateway to the Surigao
              </p>
            </div>

            {/* Subtitle - words show together with better spacing */}
            <div className={`mt-6 flex items-center justify-center gap-4 sm:gap-6 transition-all duration-300 ease-out ${cinematicStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-xs sm:text-base text-indigo-300/90 tracking-widest uppercase font-bold drop-shadow-sm">
                Marketplace
              </span>
              <span className="text-indigo-400/60">•</span>
              <span className="text-xs sm:text-base text-indigo-300/90 tracking-widest uppercase font-bold drop-shadow-sm">
                Community
              </span>
              <span className="text-indigo-400/60">•</span>
              <span className="text-xs sm:text-base text-indigo-300/90 tracking-widest uppercase font-bold drop-shadow-sm">
                Connection
              </span>
            </div>

            {/* Enhanced decorative particles with animation */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out ${cinematicStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-indigo-400 rounded-full animate-pulse shadow-lg shadow-indigo-400/50" />
              <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300 shadow-lg shadow-blue-400/50" />
              <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-700 shadow-lg shadow-purple-400/50" />
              <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-indigo-300 rounded-full animate-pulse delay-1000 shadow-lg shadow-indigo-300/50" />
            </div>

            {/* Animated ring with enhanced glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-500/40 rounded-full transition-all duration-700 ease-out shadow-lg shadow-indigo-500/30 ${cinematicStage >= 5 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-blue-500/30 rounded-full transition-all duration-700 ease-out delay-100 shadow-lg shadow-blue-500/20 ${cinematicStage >= 5 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
          </div>

          {/* Dramatic light rays with improved performance */}
          <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ease-out ${cinematicStage >= 1 ? 'opacity-100' : 'opacity-0'} ${cinematicStage >= 5 ? 'opacity-0' : ''}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-500/40 via-transparent to-transparent animate-pulse" />
          </div>
        </div>
      )}

      {/* Hero Section - always rendered at full opacity behind the intro overlay */}
      <div>
        {/* Hero Showcase Section */}
        <section
          ref={heroRef}
          className="text-white py-12 sm:py-16 px-4 relative overflow-hidden min-h-[500px] sm:min-h-[600px] flex items-center shadow-xl"
          onPointerMove={handleHeroPointerMove}
        >
          {/* Background Image */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
              alt="Marketplace background"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-blue-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />
          </div>

          {/* Glow backdrop elements */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
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

          <div className="container mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left Side: Content & Actions */}
              <div className="space-y-6 sm:space-y-8 text-left">
                <div className="space-y-2.5 sm:space-y-3.5">
                  <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10 -translate-y-[10%] hover:scale-[1.03] transition-transform cursor-default overflow-hidden relative">
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 animate-badge-wave-left" />
                      <div className="flex-1 animate-badge-wave-right" />
                    </div>
                    <div className="relative flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-300 animate-pulse" />
                      <span className="animate-broken-lamp font-bold text-[10px] sm:text-xs">SGShop</span>
                    </div>
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight min-h-[120px] -translate-y-[2%]">
                    <span className="flex flex-wrap gap-x-3 items-center">
                      <span className="animate-loop-welcome" style={{ animation: 'loopWelcome 0.8s ease-out forwards' }}>Welcome</span>
                      <span className="animate-loop-to" style={{ animation: 'loopTo 0.8s ease-out 0.2s forwards' }}>to</span>
                    </span>
                    <span className="animate-loop-surimart block" style={{ animation: 'loopSuriMart 0.8s ease-out 0.4s forwards' }}>
                      <span className="bg-gradient-to-r from-blue-300 via-white via-indigo-200 to-blue-300 bg-clip-text text-transparent animate-text-shine">SGShop</span>
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-indigo-100/90 font-medium max-w-lg leading-relaxed animate-fade-in-up mt-6" style={{ animationDelay: '200ms' }}>
                    Find what matters. Sell with trust.
                  </p>
                </div>

                <div className="flex gap-3 sm:gap-4 flex-wrap animate-fade-in-up mt-6" style={{ animationDelay: '300ms' }}>
                  <Button
                    size="lg"
                    asChild
                    className="bg-white hover:bg-indigo-50 text-indigo-700 shadow-xl rounded-full px-6 sm:px-8 font-bold hover:-translate-y-0.5 transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base"
                  >
                    <Link href="/browse">
                      <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-bounce" />
                      Browse Products
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 shadow-lg rounded-full px-6 sm:px-8 font-bold hover:-translate-y-0.5 transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base"
                  >
                    <Link href="/user/products">
                      <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Start Selling
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-green-600/20 backdrop-blur-md border-green-400/30 text-green-100 hover:bg-green-600/30 shadow-lg rounded-full px-6 sm:px-8 font-bold hover:-translate-y-0.5 transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base"
                  >
                    <a href="/app-release.apk" download>
                      <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Download App
                    </a>
                  </Button>
                </div>

                {/* Marketplace stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 sm:pt-6 border-t border-white/10 max-w-md animate-fade-in-up" style={{ animationDelay: '400ms' }}>
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

          {/* Scroll Down Indicator */}
          <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center pointer-events-none">
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-all duration-300 group hero-scroll-cue pointer-events-auto"
            >
              <span className="text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-1">
                Scroll to explore
              </span>
              <div className="relative">
                <ChevronDown className="w-6 h-6" />
                <div className="absolute inset-0 bg-white/20 blur-sm rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </button>
          </div>
        </section>

        {/* Search and Categories Section */}
        <section ref={categoriesRef} className="py-12 px-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-blue-950/20 relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for products, categories, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-12 pr-32 py-4 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base text-slate-800 dark:text-slate-100"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md transition-all duration-200 h-10 font-bold"
                >
                  Search
                </Button>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                    {searchSuggestions.map((suggestion) => (
                      <Link
                        key={suggestion.id}
                        href={`/products/${suggestion.id}`}
                        onClick={() => {
                          setSearchQuery(suggestion.title)
                          setShowSuggestions(false)
                        }}
                        className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">{suggestion.title}</div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">₱{suggestion.price.toLocaleString()}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Trending Products */}
            <section ref={trendingRef} className="max-w-5xl mx-auto mb-16" aria-labelledby="trending-products-heading">
              <div className={trendingInView ? 'trending-section-visible' : 'opacity-0'}>
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20">
                      <Flame className="h-3.5 w-3.5 text-orange-300" />
                      Trending now
                    </div>
                    <h2 id="trending-products-heading" className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                      Most viewed products
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                      The hottest items everyone&#39;s looking at right now
                    </p>
                  </div>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-all duration-200 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:gap-2"
                  >
                    Browse all products
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

              {trendingProductsLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="mb-4 h-48 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-3">
                        <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : trendingProducts.length > 0 ? (
                <div key={trendingAnimKey} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {trendingProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:-translate-y-1.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800/80 dark:bg-slate-950 dark:hover:border-indigo-700 dark:hover:shadow-indigo-500/20 transition-transform transition-shadow transition-border-color ease-out ${
                        trendingInView ? 'trending-card-animate' : 'opacity-0'
                      }`}
                      style={{
                        animationDuration: `${1.3 + index}s`,
                        animationDelay: `${0.3 + index}s`
                      }}
                    >
                      {/* Image container */}
                      <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                          </div>
                        )}
                        
                        {/* Gradient overlay at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                        {/* Ranking badge */}
                        <div className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold shadow-lg backdrop-blur-sm ring-2 ${
                          index === 0
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-amber-300/50'
                            : index === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 ring-slate-200/50'
                              : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white ring-amber-500/50'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Hot badge */}
                        {index === 0 && (
                          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                            <Flame className="h-3.5 w-3.5" />
                            Hot
                          </div>
                        )}

                        {/* Price on image */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-sm font-extrabold text-indigo-700 shadow-md backdrop-blur-sm dark:bg-slate-950/95 dark:text-indigo-300">
                            {product.price !== null ? `₱${product.price.toLocaleString()}` : 'Price on request'}
                          </span>
                          <span className="flex items-center gap-1 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                            <Eye className="h-3.5 w-3.5" />
                            {(product.views || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-950 transition-colors duration-200 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                          {product.title}
                        </h3>
                        
                        {/* View details indicator */}
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-400 transition-all duration-200 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400">
                          View details
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950/60">
                  <TrendingUp className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    No trending products yet.
                  </p>
                </div>
              )}
              </div>
            </section>

            {/* Categories Grid */}
            <div className="max-w-6xl mx-auto">
              <h2 className={`text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-10 transition-all duration-700 ${categoriesInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
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
                    <div
                      key={category.id}
                      className={`group relative transition-all duration-550 z-30 ${categoriesInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                      style={{
                        transitionDelay: `${index * 50}ms`,
                      }}
                    >
                      <Link
                        href={`/browse?category=${category.id}`}
                        className="block h-full"
                        onMouseEnter={() => setHoveredCategory(category.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <Card className="hover:shadow-lg hover:scale-[1.05] transition-all duration-300 border border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-850 rounded-2xl bg-white dark:bg-slate-950 h-full relative z-10 min-h-[140px]">
                          <CardContent className="p-5 text-center flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 mb-2.5 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 flex-shrink-0">
                              {(() => {
                                const IconComponent = categoryIcons[category.name.toLowerCase()] || Package
                                return <IconComponent className="w-6 h-6" />
                              })()}
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

                      {/* Product Preview on Hover */}
                      {hoveredCategory === category.id && categoryProducts[category.id] && (
                        <div
                          className="absolute -top-64 left-0 right-0 z-[9999] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 animate-fade-in-up pointer-events-auto"
                        >
                          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 text-center">
                            {category.name}
                          </div>
                          <div className="space-y-2">
                            {categoryProducts[category.id].map((product: { id: string; title: string; images: string[]; price: number }) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                                  {product.images && product.images[0] ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 flex items-center justify-center">
                                      <span className="text-sm">📦</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {product.title}
                                  </p>
                                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                    ₱{product.price.toLocaleString()}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section ref={howItWorksRef} className="py-16 px-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/30 dark:from-slate-950 dark:via-indigo-950/20 dark:to-blue-950/20 relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto relative z-10">
            <h2 className={`text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-12 transition-all duration-700 ${howItWorksInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              How It Works
            </h2>

            <div className="max-w-5xl mx-auto">
              {/* Desktop: Horizontal timeline */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-8 relative">
                {/* Connecting line */}
                <div className={`absolute top-16 left-16 right-16 h-0.5 bg-gradient-to-r from-indigo-300 via-indigo-500 to-indigo-300 transition-all duration-1000 ${howItWorksInView ? 'opacity-100' : 'opacity-0'
                  }`} style={{ transitionDelay: '200ms' }} />

                {/* Step 1 */}
                <div className={`relative transition-all duration-700 ${howItWorksInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`} style={{ transitionDelay: '300ms' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 relative z-10">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Browse Products</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Search through thousands of listings in your area</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`relative transition-all duration-700 ${howItWorksInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`} style={{ transitionDelay: '400ms' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 relative z-10">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Seller</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Contact sellers directly to ask questions or negotiate</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`relative transition-all duration-700 ${howItWorksInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`} style={{ transitionDelay: '500ms' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 relative z-10">
                      <Handshake className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Meet & Trade</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Meet in a safe location to complete the transaction</p>
                  </div>
                </div>
              </div>

              {/* Mobile: Vertical timeline */}
              <div className="md:hidden space-y-8 relative">
                {/* Vertical connecting line */}
                <div className={`absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-300 via-indigo-500 to-indigo-300 transition-all duration-1000 ${howItWorksInView ? 'opacity-100' : 'opacity-0'
                  }`} style={{ transitionDelay: '200ms' }} />

                {/* Step 1 */}
                <div className={`relative pl-20 transition-all duration-700 ${howItWorksInView ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`} style={{ transitionDelay: '300ms' }}>
                  <div className="absolute left-4 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg z-10">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute left-6 top-1 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Browse Products</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Search through thousands of listings in your area</p>
                </div>

                {/* Step 2 */}
                <div className={`relative pl-20 transition-all duration-700 ${howItWorksInView ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`} style={{ transitionDelay: '400ms' }}>
                  <div className="absolute left-4 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg z-10">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute left-6 top-1 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Message Seller</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Contact sellers directly to ask questions or negotiate</p>
                </div>

                {/* Step 3 */}
                <div className={`relative pl-20 transition-all duration-700 ${howItWorksInView ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`} style={{ transitionDelay: '500ms' }}>
                  <div className="absolute left-4 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg z-10">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute left-6 top-1 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Meet & Trade</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Meet in a safe location to complete the transaction</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-16 px-4 bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/20 dark:from-slate-950 dark:via-indigo-950/15 dark:to-blue-950/15 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-400/5 dark:bg-indigo-600/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto max-w-5xl relative z-10">
            <h2 className={`text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white mb-10 transition-all duration-700 ${featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
              Why Choose SGShop?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
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

              <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
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

              <Card className={`border border-slate-200 dark:border-slate-850 transition-all duration-700 hover:shadow-md ${featuresInView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
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
        <section ref={footerRef} className={`py-24 px-4 bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-blue-950/70 text-white relative overflow-hidden transition-all duration-700 ${footerInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Enhanced glow backdrop elements */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="container mx-auto text-center relative z-10 max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Join Our Community
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Ready to Start Buying or Selling?
            </h2>
            <p className="text-lg sm:text-xl text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users already trading and connecting safely on SGShop.
            </p>
            <div className="flex gap-4 justify-center flex-wrap pt-4">
              <Button
                size="lg"
                asChild
                className="bg-white hover:bg-indigo-50 text-indigo-700 shadow-2xl rounded-full px-8 sm:px-10 font-bold h-12 sm:h-14 text-base hover:scale-105 transition-all duration-300"
              >
                <Link href="/register">
                  <Users className="mr-2 h-5 w-5 text-indigo-600" />
                  Create Account
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-xl rounded-full px-8 sm:px-10 font-bold h-12 sm:h-14 text-base hover:scale-105 transition-all duration-300"
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
    </div>
  )
}
