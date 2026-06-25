'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ListingCard from '@/components/listing-card'
import ListingCardSkeleton from '@/components/listing-card-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X, Clock, ChevronDown, ShoppingBag } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useCartStore } from '@/lib/store/auth'
import { useLanguageStore } from '@/lib/store/language'

export default function BrowsePage() {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { incrementCart, decrementCart } = useCartStore()
  const { translate } = useLanguageStore()
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set())
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('search') || new URLSearchParams(window.location.search).get('q') || ''
    }
    return ''
  })
  const [category, setCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('category') || 'all'
    }
    return 'all'
  })
  const [condition, setCondition] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [datePosted, setDatePosted] = useState('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [showErrorNotification, setShowErrorNotification] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchListings()
  }, [])

  useEffect(() => {
    if (user) {
      fetchSearchHistory()
      fetchSavedListings()
      fetchRecentlyViewed()
    }
  }, [user])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchSuggestions()
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== searchQuery) {
      fetchListings()
    }
  }, [debouncedQuery])

  // Auto-search when filters change
  useEffect(() => {
    fetchListings()
  }, [category, condition, sortBy, priceRange, datePosted])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchSearchHistory = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) {
      console.error('Error fetching search history:', error)
    } else {
      setSearchHistory(data || [])
    }
  }

  const fetchSavedListings = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id)
    if (error) {
      console.error('Error fetching cart items:', error)
    } else {
      const savedIds = new Set((data || []).map((sl: any) => sl.listing_id))
      setSavedListings(savedIds)
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
      
      // Remove duplicates by listing ID
      const uniqueListings = data?.map((item: any) => ({
        ...item.listings,
        sellerName: item.listings.profiles?.full_name || 'Unknown',
        sellerAvatar: item.listings.profiles?.avatar_url
      })).filter(Boolean) || []
      const seen = new Set()
      const deduplicated = uniqueListings.filter((listing: any) => {
        if (seen.has(listing.id)) return false
        seen.add(listing.id)
        return true
      })
      
      setRecentlyViewed(deduplicated)
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
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

  const fetchSuggestions = async () => {
    if (searchQuery.length < 2) return
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, currency, images')
      .eq('status', 'active')
      .ilike('title', `%${searchQuery}%`)
      .limit(5)
    if (error) {
      console.error('Error fetching suggestions:', error)
    } else {
      setSuggestions(data || [])
      setShowSuggestions(true)
    }
  }

  const saveSearchHistory = async () => {
    if (!user || !searchQuery.trim()) return
    const filters = {
      category,
      condition,
      sortBy,
      priceRange,
      datePosted
    }
    await supabase.from('search_history').insert({
      user_id: user.id,
      query: searchQuery.trim(),
      filters
    })
    fetchSearchHistory()
  }

  const clearHistory = async () => {
    if (!user) return
    await supabase.from('search_history').delete().eq('user_id', user.id)
    setSearchHistory([])
  }

  const toggleSaveListing = async (listingId: string) => {
    if (!user) {
      setErrorMessage('Please log in to save listings')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    if (savedListings.has(listingId)) {
      // Unsave
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      if (error) {
        console.error('Error unsaving listing:', error)
        setErrorMessage('Failed to unsave listing')
        setShowErrorNotification(true)
        setTimeout(() => setShowErrorNotification(false), 3000)
      } else {
        setSavedListings((prev) => {
          const newSet = new Set(prev)
          newSet.delete(listingId)
          return newSet
        })
        decrementCart()
      }
    } else {
      // Save
      try {
        const { error } = await supabase
          .from('saved_listings')
          .insert({
            user_id: user.id,
            listing_id: listingId
          })
        
        if (error) {
          console.error('Error saving listing:', error.message, error)
          // Check if it's a duplicate error
          if (error.code === '23505' || error.message?.includes('duplicate')) {
            // Already saved, just update local state
            setSavedListings((prev) => new Set(prev).add(listingId))
          } else {
            setErrorMessage('Failed to save listing')
            setShowErrorNotification(true)
            setTimeout(() => setShowErrorNotification(false), 3000)
          }
        } else {
          setSavedListings((prev) => new Set(prev).add(listingId))
          incrementCart()
          setShowCartNotification(true)
          setTimeout(() => setShowCartNotification(false), 3000)
        }
      } catch (err) {
        console.error('Unexpected error saving listing:', err)
        setErrorMessage('Failed to save listing')
        setShowErrorNotification(true)
        setTimeout(() => setShowErrorNotification(false), 3000)
      }
    }
  }

  const fetchListings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')

      if (debouncedQuery) {
        query = query.ilike('title', `%${debouncedQuery}%`)
      }

      if (category !== 'all') {
        query = query.eq('category_id', category)
      }

      if (condition !== 'all') {
        query = query.eq('condition', condition)
      }

      // Price range filter
      query = query.gte('price', priceRange[0]).lte('price', priceRange[1])

      // Date posted filter
      if (datePosted !== 'all') {
        const now = new Date()
        let dateFilter = new Date()
        switch (datePosted) {
          case 'today':
            dateFilter = new Date(now.setHours(0, 0, 0, 0))
            break
          case 'week':
            dateFilter = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            dateFilter = new Date(now.setMonth(now.getMonth() - 1))
            break
          case 'year':
            dateFilter = new Date(now.setFullYear(now.getFullYear() - 1))
            break
        }
        query = query.gte('created_at', dateFilter.toISOString())
      }

      // Sort
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'price_low':
          query = query.order('price', { ascending: true })
          break
        case 'price_high':
          query = query.order('price', { ascending: false })
          break
        case 'popular':
          query = query.order('views', { ascending: false })
          break
        case 'relevance':
          // For relevance, we'd need full-text search - for now use newest
          query = query.order('created_at', { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint, error.code)
        throw error
      }

      // Fetch seller profiles and extra data for each listing
      const listingsWithExtraData = await Promise.all(
        (data || []).map(async (listing) => {
          // Fetch seller profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', listing.seller_id)
            .single()
          
          // Fetch reviews for this listing
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('listing_id', listing.id)
          
          // Fetch order count for this listing
          const { count: orderCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id)
            .in('status', ['delivered', 'processing', 'shipped'])
          
          // Calculate average rating
          const avgRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
          
          return {
            ...listing,
            profiles: profile,
            quantity: listing.quantity || 1,
            avgRating: avgRating || 0,
            reviewCount: reviews?.length || 0,
            purchaseCount: orderCount || 0
          }
        })
      )
      
      setListings(listingsWithExtraData)
    } catch (error: any) {
      console.error('Error fetching listings:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }


  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
  ]

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Viewed' },
  ]

  const dateOptions = [
    { value: 'all', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: 'year', label: 'Past Year' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-sm">Added to cart successfully!</span>
          </div>
        </div>
      )}
      
      {/* Error Notification */}
      {showErrorNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-rose-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-semibold text-sm">{errorMessage}</span>
          </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Marketplace</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">Browse Products</h1>
            <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">Find the perfect item from our curated collection of verified products</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Panel */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
        
        {/* Search controls row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 h-5 w-5" />
            <Input
              placeholder={translate('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchHistory.length > 0) setShowHistory(true)
              }}
              onBlur={() => {
                setTimeout(() => setShowHistory(false), 200)
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              className="pl-12 h-12 text-sm sm:text-base border border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-xl bg-white dark:bg-slate-950 shadow-inner"
            />

            {/* Autocomplete Suggestions Popover */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/products/${suggestion.id}`}
                    onClick={() => {
                      setSearchQuery(suggestion.title)
                      setShowSuggestions(false)
                    }}
                    className="block px-3 py-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      {suggestion.images && suggestion.images[0] && (
                        <img
                          src={suggestion.images[0]}
                          alt={suggestion.title}
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {suggestion.title}
                        </div>
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(suggestion.price, suggestion.currency)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Search History Popover */}
            {showHistory && searchHistory.length > 0 && !showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Recent Searches
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearHistory} 
                    className="h-6 px-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchHistory.map((history) => (
                    <button
                      key={history.id}
                      onClick={() => {
                        setSearchQuery(history.query)
                        setShowHistory(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-350 transition-colors flex items-center gap-2 group"
                    >
                      <Clock className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                      <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{history.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => { fetchListings(); saveSearchHistory(); }} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 shadow-md shadow-indigo-500/10 transition-all duration-200 rounded-xl font-semibold flex-1 md:flex-none"
            >
              <Search className="mr-1.5 h-4 w-4" />
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)} 
              className={`h-12 px-5 border ${
                showFilters 
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900'
              } transition-colors rounded-xl font-semibold`}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Filters
              {showFilters && <X className="h-4 w-4 ml-1.5" />}
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(category !== 'all' || condition !== 'all' || sortBy !== 'newest' || datePosted !== 'all') && (
          <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-slate-500 self-center mr-1">Active filters:</span>
            {category !== 'all' && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 rounded-full py-1 px-3 text-xs flex items-center gap-1.5" variant="outline">
                Category: {categories.find(c => c.id === category)?.name || category}
                <button onClick={() => setCategory('all')} className="text-indigo-400 hover:text-indigo-800 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {condition !== 'all' && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 rounded-full py-1 px-3 text-xs flex items-center gap-1.5" variant="outline">
                Condition: {conditions.find(c => c.value === condition)?.label || condition}
                <button onClick={() => setCondition('all')} className="text-indigo-400 hover:text-indigo-800 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'newest' && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 rounded-full py-1 px-3 text-xs flex items-center gap-1.5" variant="outline">
                Sort: {sortOptions.find(o => o.value === sortBy)?.label || sortBy}
                <button onClick={() => setSortBy('newest')} className="text-indigo-400 hover:text-indigo-800 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {datePosted !== 'all' && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 rounded-full py-1 px-3 text-xs flex items-center gap-1.5" variant="outline">
                Date: {dateOptions.find(o => o.value === datePosted)?.label || datePosted}
                <button onClick={() => setDatePosted('all')} className="text-indigo-400 hover:text-indigo-800 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Advanced Filters Expandable Grid */}
        {showFilters && (
          <div className="border-t border-slate-100 dark:border-slate-900 pt-6 space-y-6 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="h-10 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl">
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl">
                    <SelectValue placeholder="Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Posted</Label>
                <Select value={datePosted} onValueChange={setDatePosted}>
                  <SelectTrigger className="h-10 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl">
                    <SelectValue placeholder="Any Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range Slider Widget */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range</Label>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={100000}
                step={1000}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Recently Viewed Section */}
      {user && recentlyViewed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recently Viewed</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {recentlyViewed.map((listing) => (
              <div key={`browse-recently-${listing.id}`} className="flex-shrink-0 w-52 relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur h-6 w-6 rounded-full shadow-sm hover:scale-105 border transition-all"
                  onClick={() => handleRemoveFromRecentlyViewed(listing.id)}
                >
                  <X className="h-3.5 w-3.5 text-slate-600 hover:text-rose-500" />
                </Button>
                <ListingCard 
                  {...listing}
                  sellerName={listing.profiles?.full_name || 'Unknown'}
                  sellerAvatar={listing.profiles?.avatar_url}
                  isSaved={savedListings.has(listing.id)}
                  onToggleSave={toggleSaveListing}
                  quantity={listing.quantity}
                  avgRating={listing.avgRating}
                  reviewCount={listing.reviewCount}
                  purchaseCount={listing.purchaseCount}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>All Products</span>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-full dark:bg-indigo-950/30 dark:text-indigo-400">
            {listings.length} items
          </span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card className="border border-dashed py-16">
            <CardContent className="flex flex-col items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No products found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
                We couldn't find any products matching your search filter combination. Try adjusting your query or price parameters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard 
                key={listing.id}
                {...listing}
                sellerName={listing.profiles?.full_name || 'Unknown'}
                sellerAvatar={listing.profiles?.avatar_url}
                isSaved={savedListings.has(listing.id)}
                onToggleSave={toggleSaveListing}
                quantity={listing.quantity}
                avgRating={listing.avgRating}
                reviewCount={listing.reviewCount}
                purchaseCount={listing.purchaseCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
