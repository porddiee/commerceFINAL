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
import { Search, SlidersHorizontal, X, Clock, ChevronDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useLanguageStore } from '@/lib/store/language'

export default function BrowsePage() {
  const supabase = createClient()
  const { user } = useAuthStore()
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
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [condition, setCondition] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [datePosted, setDatePosted] = useState('all')
  const [debouncedQuery, setDebouncedQuery] = useState('')

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
      alert('Please log in to save listings')
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
        alert('Failed to unsave listing')
      } else {
        setSavedListings((prev) => {
          const newSet = new Set(prev)
          newSet.delete(listingId)
          return newSet
        })
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
            alert('Failed to save listing')
          }
        } else {
          setSavedListings((prev) => new Set(prev).add(listingId))
        }
      } catch (err) {
        console.error('Unexpected error saving listing:', err)
        alert('Failed to save listing')
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

      // Fetch seller profiles separately
      const listingsWithSellers = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', listing.seller_id)
            .single()
          return {
            ...listing,
            profiles: profile
          }
        })
      )
      
      setListings(listingsWithSellers)
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Browse Products</h1>
        <p className="text-muted-foreground">Find the perfect item for you</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
              className="pl-10"
            />
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-10 p-2">
                {suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/listings/${suggestion.id}`}
                    onClick={() => {
                      setSearchQuery(suggestion.title)
                      setShowSuggestions(false)
                    }}
                    className="block px-2 py-2 hover:bg-muted rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {suggestion.images && suggestion.images[0] && (
                        <img
                          src={suggestion.images[0]}
                          alt={suggestion.title}
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{suggestion.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPrice(suggestion.price, suggestion.currency)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {/* Search History */}
            {showHistory && searchHistory.length > 0 && !showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-10 p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
                  <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 text-xs">
                    Clear
                  </Button>
                </div>
                {searchHistory.map((history) => (
                  <button
                    key={history.id}
                    onClick={() => {
                      setSearchQuery(history.query)
                      setShowHistory(false)
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                  >
                    <Clock className="inline h-3 w-3 mr-2" />
                    {history.query}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => { fetchListings(); saveSearchHistory(); }} className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
            Search
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] rounded-full">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
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

              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={datePosted} onValueChange={setDatePosted}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Posted" />
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

            {/* Price Range Slider */}
            <div className="space-y-2">
              <Label>Price Range: ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}</Label>
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
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Recently Viewed</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recentlyViewed.map((listing) => (
              <div key={`browse-recently-${listing.id}`} className="flex-shrink-0 w-48 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 z-10 bg-background/90 backdrop-blur h-6 w-6"
                  onClick={() => handleRemoveFromRecentlyViewed(listing.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <ListingCard 
                  {...listing}
                  sellerName={listing.profiles?.full_name || 'Unknown'}
                  sellerAvatar={listing.profiles?.avatar_url}
                  isSaved={savedListings.has(listing.id)}
                  onToggleSave={toggleSaveListing}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No listings found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard 
              key={listing.id}
              {...listing}
              sellerName={listing.profiles?.full_name || 'Unknown'}
              sellerAvatar={listing.profiles?.avatar_url}
              isSaved={savedListings.has(listing.id)}
              onToggleSave={toggleSaveListing}
            />
          ))}
        </div>
      )}
    </div>
  )
}
