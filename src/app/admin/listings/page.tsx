'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ShoppingBag,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AdminListingsPage() {
  const supabase = createClient()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'sold'>('all')

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint, error.code)
        throw error
      }

      // Fetch seller profiles separately
      const listingsWithSellers = await Promise.all(
        (data || []).map(async (listing) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', listing.seller_id)
              .single()
            return {
              ...listing,
              profiles: profile
            }
          } catch (e) {
            return {
              ...listing,
              profiles: { full_name: 'Unknown Seller', email: '' }
            }
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase.from('listings').delete().eq('id', id)
      if (error) throw error

      // Update local state directly
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch = listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [listings, searchQuery, statusFilter])

  // Count stats
  const stats = useMemo(() => {
    const total = listings.length
    const active = listings.filter(l => l.status === 'active').length
    const sold = listings.filter(l => l.status === 'sold').length
    const inactive = listings.filter(l => l.status === 'inactive').length
    return { total, active, sold, inactive }
  }, [listings])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner — unified gradient banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Catalog Operations</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Manage Products
              </h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">
                Review all active products, monitor seller item views, delete illegal/expired products, and inspect pricing
              </p>
            </div>
          </div>

          {/* Header Stats */}
          <div className="flex flex-wrap gap-2.5 md:flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider">Total Products</p>
              <p className="text-sm font-black text-white">{stats.total}</p>
            </div>
            <div className="bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/30 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Active</p>
              <p className="text-sm font-black text-emerald-400">{stats.active}</p>
            </div>
            <div className="bg-blue-500/15 backdrop-blur-sm border border-blue-500/30 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-blue-300 tracking-wider">Sold</p>
              <p className="text-sm font-black text-blue-400">{stats.sold}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Filters Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Product Filters</CardTitle>
              </div>
              <CardDescription>Select product filter tags</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                {(['all', 'active', 'inactive', 'sold'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left text-xs px-3 py-2.5 rounded-xl font-bold border transition-all ${statusFilter === status
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {status === 'all' && 'All Products'}
                    {status === 'active' && `Active Products (${stats.active})`}
                    {status === 'inactive' && `Inactive Products (${stats.inactive})`}
                    {status === 'sold' && `Sold Products (${stats.sold})`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product List */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Product Directory</CardTitle>
                  <CardDescription>Showing {filteredListings.length} products</CardDescription>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search titles, sellers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-xs h-10 transition-all duration-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 border-b-2 border-indigo-300" />
                  <p className="text-xs font-semibold text-slate-400">Loading catalog items...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-2xl mx-6 mb-6">
                  <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No products found</p>
                  <p className="text-xs text-slate-400 mt-1">Try refining search parameters or clearing filters</p>
                </div>
              ) : (
                <div className="space-y-3 p-4 sm:p-0">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800/50 rounded-2xl hover:bg-slate-50/40 dark:hover:bg-slate-850/10 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                          {listing.images?.[0] ? (
                            <img
                              src={listing.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-slate-450 dark:text-slate-500" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-850 dark:text-white truncate">
                            {listing.title}
                          </h3>

                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-300" />
                            <span>Seller: <span className="font-semibold text-slate-550 dark:text-slate-400">{listing.profiles?.full_name || 'Unknown'}</span></span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="text-xs font-black text-slate-800 dark:text-white">₱{listing.price.toLocaleString()}</span>

                            <Badge className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border-0 shadow-none uppercase ${listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                                listing.status === 'sold' ? 'bg-blue-500/10 text-blue-600' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {listing.status}
                            </Badge>

                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-semibold">
                              <Eye className="h-3.5 w-3.5 text-slate-300" />
                              {listing.views || 0} views
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="h-4.5 w-4.5 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                          <DropdownMenuItem
                            onClick={() => handleDelete(listing.id)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20 font-bold text-xs rounded-lg cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
