'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ShoppingBag, Users, Shield, ArrowRight, TrendingUp, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import ListingCard from '@/components/listing-card'
import ListingCardSkeleton from '@/components/listing-card-skeleton'

const categoryIcons: Record<string, string> = {
  'Electronics': '💻',
  'Fashion': '�',
  'Home & Garden': '🏠',
  'Vehicles': '🚗',
  'Sports & Hobbies': '⚽',
  'Books & Media': '📚',
}

export default function HomePage() {
  const supabase = createClient()
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [allFeaturedListings, setAllFeaturedListings] = useState<any[]>([])
  const [stats, setStats] = useState({ listings: 0, users: 0 })

  const fetchFeaturedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      setAllFeaturedListings(data || [])
      setFeaturedListings((data || []).slice(0, 6))
    } catch (error) {
      console.error('Error fetching featured listings:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchStats()
    fetchFeaturedListings()
    if (user) {
      fetchRecentlyViewed()
    }
  }, [user])

  useEffect(() => {
    if (allFeaturedListings.length <= 6) return

    const interval = setInterval(() => {
      const shuffled = [...allFeaturedListings].sort(() => Math.random() - 0.5)
      setFeaturedListings(shuffled.slice(0, 6))
    }, 5000)

    return () => clearInterval(interval)
  }, [allFeaturedListings])

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError

      // Fetch listing counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active')

          if (countError) {
            console.error('Error fetching count for category:', category.name, countError)
            return { ...category, count: 0 }
          }

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
      
      // Deduplicate by listing ID
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

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-700 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-16 px-4 relative overflow-hidden min-h-[600px]">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4 tracking-tight drop-shadow-lg animate-fade-in-up font-sans">
                <span className="inline-block animate-typing text-white">Welcome to <span className="font-black">SuriMart</span></span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 mb-8 font-light leading-relaxed animate-fade-in-up delay-200 font-sans">
                Surigao Marketplace - Your trusted marketplace for buying and selling in the region
              </p>
              <div className="flex gap-4 flex-wrap animate-fade-in-up delay-300">
                <Button 
                  size="lg" 
                  asChild 
                  className="animate-color-swap shadow-2xl hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-[1.02] rounded-full px-8 font-semibold border-2 border-indigo-600"
                >
                  <Link href="/browse">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Browse Products
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild 
                  className="animate-color-swap-reverse shadow-xl hover:shadow-white/20 transition-all duration-200 hover:scale-[1.02] rounded-full px-8 font-semibold border-2 border-white"
                >
                  <Link href="/register">
                    <Users className="mr-2 h-5 w-5" />
                    Start Selling
                  </Link>
                </Button>
              </div>
              
              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1 font-sans">{stats.listings.toLocaleString()}+</div>
                  <div className="text-white/70 text-sm font-medium">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1 font-sans">{stats.users.toLocaleString()}+</div>
                  <div className="text-white/70 text-sm font-medium">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1 font-sans">24/7</div>
                  <div className="text-white/70 text-sm font-medium">Support</div>
                </div>
              </div>
            </div>

            {/* Right Side - Floating Products */}
            <div className="relative h-[400px] lg:h-[500px] hidden lg:block">
              {featuredListings.slice(0, 6).map((listing, index) => (
                <Link
                  key={`${listing.id}-${index}`}
                  href={`/listings/${listing.id}`}
                  className="absolute w-32 h-32 lg:w-40 lg:h-40 rounded-2xl shadow-2xl overflow-hidden border-4 border-white/20 backdrop-blur-sm group cursor-pointer animate-fade-in-out"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    left: `${10 + (index % 3) * 35}%`,
                    top: `${5 + Math.floor(index / 3) * 45}%`,
                  }}
                >
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2 group-hover:bg-black/70 transition-colors">
                    <p className="text-white text-xs font-medium truncate">{listing.title}</p>
                    <p className="text-white/80 text-xs">₱{listing.price?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-background to-gray-50 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="Search for items, categories, or sellers..."
                className="w-full pl-12 pr-32 py-4 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white rounded-full px-6 shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed Section */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-12 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-blue-400 dark:to-purple-400">
                <Clock className="h-8 w-8 text-indigo-500" />
                Recently Viewed
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {recentlyViewed.map((listing, index) => (
                <div key={`recently-${listing.id}-${index}`} className="flex-shrink-0 w-52 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm h-7 w-7 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-all duration-200"
                    onClick={() => handleRemoveFromRecentlyViewed(listing.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <ListingCard {...listing} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-blue-400 dark:to-purple-400">Browse Categories</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center animate-pulse hover:shadow-lg transition-all duration-300">
                  <div className="h-16 w-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/browse?category=${category.id}`}
                  className="group"
                >
                  <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-indigo-500/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group">
                    <CardContent className="p-6 text-center">
                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        <div className="relative text-5xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6">{categoryIcons[category.name] || '📦'}</div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{category.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{category.count || 0} items</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Listings</h2>
            <Button variant="outline" asChild>
              <Link href="/browse">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Choose SuriMart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Secure Transactions</CardTitle>
                <CardDescription>
                  Safe and secure payments with buyer protection
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Verified Sellers</CardTitle>
                <CardDescription>
                  Only verified sellers can list items for sale
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Local Focus</CardTitle>
                <CardDescription>
                  Connect with buyers and sellers in your area
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-700 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 animate-fade-in-up">
            Ready to Start Buying or Selling?
          </h2>
          <p className="text-xl lg:text-2xl mb-8 opacity-90 animate-fade-in-up delay-200">
            Join thousands of users already using SuriMart
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up delay-300">
            <Button 
              size="lg" 
              asChild 
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-[1.02] rounded-full px-8 font-semibold"
            >
              <Link href="/register">
                <Users className="mr-2 h-5 w-5" />
                Create Account
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 shadow-xl hover:shadow-white/20 transition-all duration-200 hover:scale-[1.02] rounded-full px-8 font-semibold"
            >
              <Link href="/browse">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
