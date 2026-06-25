'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import {
  Eye, Heart, ShoppingCart, TrendingUp, TrendingDown,
  BarChart3, Package, ArrowRight, Sparkles, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  sold:     'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function StatCard({
  icon: Icon, label, value, sub, gradient, trend,
}: {
  icon: any; label: string; value: string | number; sub: string; gradient: string; trend?: number
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex gap-4 items-start hover:shadow-sm transition-shadow">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-foreground mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          {trend !== undefined && (
            trend >= 0
              ? <TrendingUp className="h-3 w-3 text-emerald-500" />
              : <TrendingDown className="h-3 w-3 text-red-400" />
          )}
          {sub}
        </p>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-muted rounded-lg w-2/3" />
        <div className="h-3 bg-muted rounded-lg w-1/4" />
      </div>
      <div className="flex gap-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 w-10 bg-muted rounded-lg" />)}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('all')
  const [sortBy, setSortBy] = useState<'views' | 'saves' | 'orders' | 'conversion'>('views')

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    if (!user) return
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select('id, title, price, views, created_at, status, images')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        const cutoff = new Date(Date.now() - days * 86400000).toISOString()
        query = query.gte('created_at', cutoff)
      }

      const { data: listingsData } = await query
      if (!listingsData) { setAnalytics([]); return }

      const listingIds = listingsData.map((l: any) => l.id)

      const [{ data: savesData }, { data: ordersData }] = await Promise.all([
        supabase.from('saved_listings').select('listing_id').in('listing_id', listingIds),
        supabase.from('orders').select('listing_id').in('listing_id', listingIds),
      ])

      const savesCount: Record<string, number> = {}
      savesData?.forEach((s: any) => { savesCount[s.listing_id] = (savesCount[s.listing_id] || 0) + 1 })

      const ordersCount: Record<string, number> = {}
      ordersData?.forEach((o: any) => { ordersCount[o.listing_id] = (ordersCount[o.listing_id] || 0) + 1 })

      setAnalytics(
        listingsData.map((l: any) => ({
          ...l,
          saves: savesCount[l.id] || 0,
          orders: ordersCount[l.id] || 0,
          conversionRate:
            l.views > 0
              ? ((ordersCount[l.id] || 0) / l.views * 100)
              : 0,
        }))
      )
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalViews = analytics.reduce((s, a) => s + (a.views || 0), 0)
  const totalSaves = analytics.reduce((s, a) => s + (a.saves || 0), 0)
  const totalOrders = analytics.reduce((s, a) => s + (a.orders || 0), 0)
  const avgConversion = analytics.length > 0
    ? (analytics.reduce((s, a) => s + a.conversionRate, 0) / analytics.length).toFixed(1)
    : '0.0'

  const sorted = [...analytics].sort((a, b) => {
    if (sortBy === 'conversion') return b.conversionRate - a.conversionRate
    return (b[sortBy] || 0) - (a[sortBy] || 0)
  })

  // Bar width helper (relative to max in the column)
  const maxViews = Math.max(...analytics.map((a) => a.views || 0), 1)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </span>
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground pl-10">Track performance across all your listings</p>
        </div>
        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 rounded-xl border-2 h-9 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="text-xs font-semibold">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-xs font-semibold">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-xs font-semibold">Last 90 days</SelectItem>
              <SelectItem value="all" className="text-xs font-semibold">All time</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/user/products/create">
            <Button size="sm" className="rounded-xl gap-1.5 text-xs h-9 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye}          label="Total Views"    value={totalViews.toLocaleString()}  sub="Across all products"    gradient="from-indigo-500 to-blue-600" />
        <StatCard icon={Heart}        label="Total Saves"    value={totalSaves.toLocaleString()}  sub="Items added to cart"    gradient="from-pink-500 to-rose-500"   />
        <StatCard icon={ShoppingCart} label="Total Orders"   value={totalOrders.toLocaleString()} sub="Orders received"        gradient="from-emerald-500 to-teal-500" />
        <StatCard icon={TrendingUp}   label="Avg Conversion" value={`${avgConversion}%`}          sub="Views → orders rate"    gradient="from-amber-500 to-orange-500" />
      </div>

      {/* ── Performance Table ── */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-500" />
              Product Performance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {analytics.length} listing{analytics.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          {/* Sort control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
            <div className="flex gap-1">
              {(['views', 'saves', 'orders', 'conversion'] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setSortBy(col)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === col
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-indigo-400 dark:text-indigo-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No listings yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">Create your first product to start tracking performance.</p>
            </div>
            <Link href="/user/products/create">
              <Button className="gap-2 rounded-xl">
                <Sparkles className="h-4 w-4" />
                Create Your First Listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1"><Eye className="h-3 w-3" /> Views</div>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1"><Heart className="h-3 w-3" /> Saves</div>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1"><ShoppingCart className="h-3 w-3" /> Orders</div>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3" /> Conv.</div>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sorted.map((item, idx) => {
                  const rate = item.conversionRate
                  const rateColor = rate > 2 ? 'text-emerald-600 dark:text-emerald-400' : rate > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                  const barWidth = Math.round(((item.views || 0) / maxViews) * 100)
                  const mainImage = item.images?.[0]

                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/10 transition-colors"
                    >
                      {/* Product cell */}
                      <td className="px-5 py-4">
                        <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0 relative shadow-sm">
                            {mainImage ? (
                              <Image src={mainImage} alt={item.title} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              ₱{item.price?.toLocaleString()}
                            </p>
                            {/* Mini view bar */}
                            <div className="mt-1.5 h-1 w-24 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Views */}
                      <td className="text-right px-5 py-4">
                        <span className={`font-bold text-sm ${sortBy === 'views' ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
                          {(item.views || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Saves */}
                      <td className="text-right px-5 py-4">
                        <span className={`font-bold text-sm ${sortBy === 'saves' ? 'text-pink-600 dark:text-pink-400' : 'text-foreground'}`}>
                          {item.saves}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="text-right px-5 py-4">
                        <span className={`font-bold text-sm ${sortBy === 'orders' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {item.orders}
                        </span>
                      </td>

                      {/* Conversion rate */}
                      <td className="text-right px-5 py-4">
                        <span className={`font-bold text-sm ${sortBy === 'conversion' ? rateColor : rateColor}`}>
                          {rate.toFixed(1)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="text-right px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.inactive}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Top Performers callout ── */}
      {!loading && sorted.length > 0 && (() => {
        const top = sorted[0]
        return (
          <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <TrendingUp className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Top Performer</p>
                <p className="text-sm font-bold text-foreground line-clamp-1">{top.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {top.views} views · {top.saves} saves · {top.orders} orders
                </p>
              </div>
            </div>
            <Link href={`/products/${top.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex-shrink-0">
                View <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )
      })()}
    </div>
  )
}
