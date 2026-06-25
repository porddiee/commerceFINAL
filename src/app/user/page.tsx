'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { 
  ShoppingBag, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  ArrowUpRight, 
  Activity, 
  Package, 
  UserCheck 
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalRevenue: 0,
    unreadMessages: 0,
    activeSales: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return
    setLoading(true)

    try {
      const [
        { count: listingsCount },
        { data: listings },
        { count: unreadCount },
        { data: salesData },
      ] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id),
        supabase
          .from('listings')
          .select('views')
          .eq('seller_id', user.id),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        supabase
          .from('orders')
          .select('total_price, status')
          .eq('seller_id', user.id),
      ])

      const totalViews = listings?.reduce((sum, listing) => sum + (listing.views || 0), 0) || 0
      
      const totalRevenue = salesData
        ?.filter((order: any) => order.status === 'delivered' || order.status === 'completed')
        ?.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0) || 0

      const activeSales = salesData
        ?.filter((order: any) => ['pending', 'processing', 'shipped'].includes(order.status))?.length || 0

      setStats({
        totalListings: listingsCount || 0,
        totalViews,
        totalRevenue,
        unreadMessages: unreadCount || 0,
        activeSales,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Seller Hub & Dashboard</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Member'}!
              </h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">Manage products, check views, respond to buyers, and track sales performance</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-2 rounded-xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider">Joined</p>
                <p className="text-[11px] font-semibold text-white">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : 'Active'}
                </p>
              </div>
            </div>
            {profile?.is_verified_seller && (
              <div className="bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Status</p>
                  <p className="text-[11px] font-semibold text-emerald-100">Verified</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Notice Card */}
      {!profile?.is_verified_seller && (
        <Card className="border-2 border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-amber-950/20 dark:to-orange-950/10 shadow-lg rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0 border border-amber-200/50 dark:border-amber-800/50">
                <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-amber-900 dark:text-amber-400 text-lg">Verify Your Seller Account</h3>
                <p className="text-sm text-amber-800/95 dark:text-amber-300/90 font-medium">
                  To publish active products and communicate safely on SuriMart, request identity verification.
                </p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-5 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto">
              <Link href="/user/settings">Verify Identity</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Modern Metrics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: My Products */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Products</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100/50 dark:border-indigo-900/50 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : stats.totalListings}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Active products</span>
              <Link href="/user/products" className="text-indigo-600 dark:text-indigo-400 flex items-center hover:underline">
                Manage <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Total Views */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Views</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100/50 dark:border-blue-900/50 flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : stats.totalViews.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Audience footprint</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">Live views</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Active Sales */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Deals</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100/50 dark:border-emerald-900/50 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : stats.activeSales}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Ongoing seller actions</span>
              <Link href="/user/transactions" className="text-emerald-600 dark:text-emerald-400 flex items-center hover:underline">
                View Deals <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Unread Messages */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Messages</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-100/50 dark:border-purple-900/50 flex items-center justify-center relative">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {stats.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : stats.unreadMessages}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Unread discussions</span>
              <Link href="/user/messages" className="text-purple-600 dark:text-purple-400 flex items-center hover:underline">
                Chat Rooms <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Panel */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/50 shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10">
            <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="font-semibold text-slate-500">Common administrative tasks and links</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Action 1: Create Products */}
              <Link href="/user/products/create" className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/50 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Create New Product</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Publish an item to the catalog</p>
                </div>
              </Link>

              {/* Action 2: View Saved / Wishlist */}
              <Link href="/user/saved" className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center border border-pink-100/50 dark:border-pink-900/50 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">View Saved Items</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Explore your bookmarked items</p>
                </div>
              </Link>

              {/* Action 3: Manage Products */}
              <Link href="/user/products" className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100/50 dark:border-blue-900/50 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Manage Products</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Edit, bump, or review active items</p>
                </div>
              </Link>

              {/* Action 4: Messages */}
              <Link href="/user/messages" className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center border border-green-100/50 dark:border-green-900/50 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Inbox Chat Rooms</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Coordinate with buyer meetups</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Selling Performance Overlay Widget */}
        <Card className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/50 shadow-md rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
              <CardTitle className="text-lg font-bold text-slate-950 dark:text-white">Performance Overview</CardTitle>
            </div>
            <CardDescription className="font-semibold text-slate-500">Live indicators of your store footprint</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              {/* Indicator 1: Audience Engagement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Product Engagement</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {stats.totalListings > 0 ? Math.round(stats.totalViews / stats.totalListings) : 0} views/item
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, stats.totalListings > 0 ? (stats.totalViews / stats.totalListings) * 5 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Indicator 2: Sales Conversion Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Sales Conversion Value</span>
                  <span className="text-slate-900 dark:text-white font-bold">₱{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, stats.totalRevenue > 0 ? (stats.totalRevenue / 50000) * 100 : 0)}%` }}
                  />
                </div>
              </div>

              {/* Indicator 3: Unread Messages Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Unread Inbox load</span>
                  <span className="text-slate-900 dark:text-white font-bold">{stats.unreadMessages} conversations</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, stats.unreadMessages * 20)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <Link 
                href="/user/analytics" 
                className="inline-flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline gap-1 group"
              >
                Explore detailed store analytics
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
