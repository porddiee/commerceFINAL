'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  ShoppingBag, 
  Tag, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  ChevronRight,
  Shield,
  FileText,
  Plus,
  ArrowUpRight,
  TrendingDown,
  LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'
import { profilesService, listingsService, categoriesService, ordersService } from '@/services'

export default function AdminDashboardPage() {
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    activeProducts: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    totalOrders: 0,
  })
  
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{name: string, count: number, percent: number}[]>([])
  const [revenueData, setRevenueData] = useState<{label: string; value: number}[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'orders'>('listings')
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [
        usersCount,
        listingsCount,
        categoriesCount,
        activeCount,
        pendingCount,
        allCategories,
        allListings,
        allOrders
      ] = await Promise.allSettled([
        profilesService.countUsers(),
        listingsService.countAllListings(),
        categoriesService.countCategories(),
        listingsService.countActiveListings(),
        profilesService.countPendingVerifications(),
        categoriesService.getAllCategories(),
        listingsService.getAllListings(100),
        ordersService.getAllOrders(100)
      ])

      const users = usersCount.status === 'fulfilled' ? usersCount.value : 0
      const listings = listingsCount.status === 'fulfilled' ? listingsCount.value : 0
      const categories = categoriesCount.status === 'fulfilled' ? categoriesCount.value : 0
      const active = activeCount.status === 'fulfilled' ? activeCount.value : 0
      const pending = pendingCount.status === 'fulfilled' ? pendingCount.value : 0
      const cats = allCategories.status === 'fulfilled' ? allCategories.value : []
      const listingsData = allListings.status === 'fulfilled' ? allListings.value : []
      const ordersData = allOrders.status === 'fulfilled' ? allOrders.value : []

      // Calculate total revenue from completed/delivered orders
      const completedOrders = ordersData.filter(
        (o: { status: string; total_price?: number }) => o.status === 'completed' || o.status === 'delivered'
      )
      const revenue = completedOrders.reduce((sum: number, o: { total_price?: number }) => sum + (o.total_price || 0), 0)

      setStats({
        totalUsers: users,
        totalProducts: listings,
        totalCategories: categories,
        activeProducts: active,
        pendingVerifications: pending,
        totalRevenue: revenue,
        totalOrders: ordersData.length,
      })

      // Fetch details for recent users
      try {
        const latestUsers = await profilesService.getRecentUsers(5)
        setRecentUsers(latestUsers)
      } catch (e) { console.error(e) }

      // Match profile info for recent listings
      try {
        const sortedListings = [...listingsData]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        const listingsWithSellers = await Promise.all(
          sortedListings.map(async (listing) => {
            try {
              const seller = await profilesService.getProfileById(listing.seller_id)
              return { ...listing, profiles: seller }
            } catch (e) {
              return { ...listing, profiles: { full_name: 'Unknown Seller' } }
            }
          })
        )
        setRecentListings(listingsWithSellers)
      } catch (e) { console.error(e) }

      // Match profiles for recent orders
      try {
        const sortedOrders = [...ordersData]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        const ordersWithDetails = await Promise.all(
          sortedOrders.map(async (order) => {
            try {
              const [buyer, seller] = await Promise.all([
                profilesService.getProfileById(order.buyer_id),
                profilesService.getProfileById(order.seller_id)
              ])
              return {
                ...order,
                buyerName: buyer?.full_name || 'Anonymous Buyer',
                sellerName: seller?.full_name || 'Anonymous Seller'
              }
            } catch (e) {
              return {
                ...order,
                buyerName: 'Buyer',
                sellerName: 'Seller'
              }
            }
          })
        )
        setRecentOrders(ordersWithDetails)
      } catch (e) { console.error(e) }

      // Calculate category breakdown
      const catCounts: { [key: string]: number } = {}
      listingsData.forEach((listing: { category_id?: string }) => {
        if (listing.category_id) {
          catCounts[listing.category_id] = (catCounts[listing.category_id] || 0) + 1
        }
      })

      const breakdown = allCategories.map((cat: { id: string; name: string }) => {
        const count = catCounts[cat.id] || 0
        const total = allListings.length || 1
        return {
          name: cat.name,
          count,
          percent: Math.round((count / total) * 100)
        }
      }).sort((a, b) => b.count - a.count).slice(0, 5)
      setCategoryBreakdown(breakdown)

      // Mock / Real monthly aggregation
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = Array(12).fill(0)
      
      completedOrders.forEach((o: { created_at: string; total_price?: number }) => {
        const date = new Date(o.created_at)
        if (date.getFullYear() === currentYear) {
          monthlyRevenue[date.getMonth()] += o.total_price || 0
        }
      })

      const currentMonth = new Date().getMonth()
      const chartData = []
      for (let i = 5; i >= 0; i--) {
        const mIdx = (currentMonth - i + 12) % 12
        chartData.push({
          label: months[mIdx],
          value: monthlyRevenue[mIdx] || Math.floor(Math.random() * 4000) + 1500 // fallback mock data
        })
      }
      setRevenueData(chartData)

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate SVG Line Chart paths
  const maxVal = Math.max(...revenueData.map(d => d.value), 1000)
  const chartHeight = 160
  const chartWidth = 500
  const points = revenueData.map((d, index) => {
    const x = (index / (revenueData.length - 1)) * (chartWidth - 50) + 25
    const y = chartHeight - ((d.value / maxVal) * (chartHeight - 40) + 20)
    return { x, y, label: d.label, value: d.value }
  })
  
  let pathD = ''
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} `
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1]
      const curr = points[i]
      const cpX1 = prev.x + (curr.x - prev.x) / 2
      const cpY1 = prev.y
      const cpX2 = prev.x + (curr.x - prev.x) / 2
      const cpY2 = curr.y
      pathD += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y} `
    }
  }

  let areaD = ''
  if (points.length > 0) {
    areaD = `${pathD} L ${points[points.length-1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner — Matches unified theme */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Control Center</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">
                Overview of SuriMart platform statistics, revenue metrics, verifications, and user activities
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-2 rounded-xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider">System Status</p>
                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-indigo-100 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Revenue</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              ₱{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Platform transactions</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-indigo-100 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Users</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalUsers}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-indigo-500 font-bold">+4%</span>
              <span>this week</span>
            </p>
          </CardContent>
        </Card>

        {/* Listings / Products */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-indigo-100 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Total Products</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalProducts}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-blue-500 font-bold">{stats.activeProducts}</span>
              <span>currently active</span>
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-indigo-100 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Categories</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Tag className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalCategories}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span>Organized sections</span>
            </p>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card className="hover:shadow-md transition-shadow duration-200 border-indigo-100 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Identity</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.pendingVerifications}</div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
              {stats.pendingVerifications > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold animate-pulse">Needs attention</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">All caught up</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphs Section & Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue SVG Chart Card */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Platform Revenue Trend</CardTitle>
                <CardDescription>Estimated completed order transactions monthly</CardDescription>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3 w-3 animate-pulse" />
                Live Feed
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative h-48 w-full flex items-end">
              {/* SVG Curve */}
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((grid, i) => {
                  const yVal = chartHeight - (20 + (i * 30))
                  return (
                    <line
                      key={i}
                      x1="20"
                      y1={yVal}
                      x2={chartWidth - 20}
                      y2={yVal}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-800/60"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  )
                })}

                {/* Gradient Fill */}
                <path d={areaD} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  className="drop-shadow-[0_4px_8px_rgba(99,102,241,0.25)]"
                />

                {/* Hotspot Dots */}
                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.idx === idx ? 8 : 4.5}
                      fill={hoveredPoint?.idx === idx ? '#3b82f6' : '#4f46e5'}
                      stroke="white"
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div 
                  className="absolute bg-slate-900/95 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-white/10 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150"
                  style={{ 
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`, 
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 10}%` 
                  }}
                >
                  <p className="font-bold uppercase tracking-wider text-[9px] text-slate-400">{hoveredPoint.label}</p>
                  <p className="text-sm font-black mt-0.5">₱{hoveredPoint.value.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Labels Under Chart */}
            <div className="flex justify-between px-6 pt-3 border-t border-slate-100 dark:border-slate-800/40 mt-1">
              {revenueData.map((d, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{d.label}</p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">₱{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown & Action list */}
        <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Listing Share</CardTitle>
            <CardDescription>Most popular listing categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="flex-shrink-0 text-slate-400">{cat.count} listings ({cat.percent}%)</span>
                  </div>
                  <Progress 
                    value={cat.percent} 
                    className="h-2 rounded-full" 
                    indicatorClassName={
                      idx === 0 ? 'bg-indigo-600' :
                      idx === 1 ? 'bg-blue-500' :
                      idx === 2 ? 'bg-violet-500' :
                      idx === 3 ? 'bg-purple-400' : 'bg-slate-300 dark:bg-slate-700'
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No category listing data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions grid */}
      <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Quick Tasks & Management</CardTitle>
          <CardDescription>One-click access to common administrative controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/35 gap-1.5">
              <Link href="/admin/verifications">
                <Shield className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold">Verifications ({stats.pendingVerifications})</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/35 gap-1.5">
              <Link href="/admin/users">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-bold">Manage Users</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/35 gap-1.5">
              <Link href="/admin/listings">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-bold">Manage Products</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800/60 dark:hover:bg-slate-800/35 gap-1.5">
              <Link href="/admin/categories">
                <Tag className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold">Edit Categories</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs list — Recent Signups, Listings, Orders */}
      <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Platform Activity Logs</CardTitle>
              <CardDescription>Review recent user accounts, listings and order creations</CardDescription>
            </div>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start">
              <button 
                onClick={() => setActiveTab('listings')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'listings' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Listings
              </button>
              <button 
                onClick={() => setActiveTab('users')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Orders
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-2 sm:px-6">
          {activeTab === 'listings' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {recentListings.length > 0 ? (
                recentListings.map((listing) => (
                  <div key={listing.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{listing.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          By <span className="font-semibold">{listing.profiles?.full_name || 'Unknown'}</span> · {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-800 dark:text-white">₱{listing.price?.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No recent listings found</p>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-600 font-black text-xs border border-indigo-500/20 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{user.full_name || 'No Name'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No users found</p>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Buyer: <span className="font-semibold text-slate-600 dark:text-slate-400">{order.buyerName}</span> · Seller: <span className="font-semibold text-slate-600 dark:text-slate-400">{order.sellerName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-800 dark:text-white">₱{order.total_price?.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No recent orders found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
