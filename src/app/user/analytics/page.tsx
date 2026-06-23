'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Eye, Heart, ShoppingCart, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [listings, setListings] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (user) {
      fetchListings()
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchListings = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
      
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const fetchAnalytics = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, price, views, created_at, status')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (!listingsData) {
        setAnalytics([])
        setLoading(false)
        return
      }

      const listingIds = listingsData.map((l: any) => l.id)

      // Fetch saves for each listing
      const { data: savesData } = await supabase
        .from('saved_listings')
        .select('listing_id')
        .in('listing_id', listingIds)

      // Count saves per listing
      const savesCount: Record<string, number> = {}
      savesData?.forEach((save: any) => {
        savesCount[save.listing_id] = (savesCount[save.listing_id] || 0) + 1
      })

      // Fetch orders for each listing
      const { data: ordersData } = await supabase
        .from('orders')
        .select('listing_id')
        .in('listing_id', listingIds)

      // Count orders per listing
      const ordersCount: Record<string, number> = {}
      ordersData?.forEach((order: any) => {
        ordersCount[order.listing_id] = (ordersCount[order.listing_id] || 0) + 1
      })

      // Combine analytics
      const analyticsData = listingsData.map((listing: any) => ({
        ...listing,
        saves: savesCount[listing.id] || 0,
        orders: ordersCount[listing.id] || 0,
        conversionRate: listing.views > 0 
          ? ((ordersCount[listing.id] || 0) / listing.views * 100).toFixed(1)
          : '0.0'
      }))

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0)
  const totalSaves = analytics.reduce((sum, a) => sum + (a.saves || 0), 0)
  const totalOrders = analytics.reduce((sum, a) => sum + (a.orders || 0), 0)
  const avgConversionRate = analytics.length > 0
    ? (analytics.reduce((sum, a) => sum + parseFloat(a.conversionRate), 0) / analytics.length).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listing Analytics</h1>
          <p className="text-muted-foreground">Track your listing performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Items saved by users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Orders received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate}%</div>
            <p className="text-xs text-muted-foreground">Views to orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Performance</CardTitle>
          <CardDescription>Detailed analytics for each of your listings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No listings yet</p>
              <Button asChild>
                <Link href="/user/listings/create">Create Your First Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Listing</th>
                    <th className="text-right p-4 font-medium">Views</th>
                    <th className="text-right p-4 font-medium">Saves</th>
                    <th className="text-right p-4 font-medium">Orders</th>
                    <th className="text-right p-4 font-medium">Conversion</th>
                    <th className="text-right p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {item.images && item.images[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/listings/${item.id}`}
                              className="font-medium hover:text-primary truncate block"
                            >
                              {item.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">₱{item.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.views || 0}</span>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.saves || 0}</span>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <div className="flex items-center justify-end gap-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.orders || 0}</span>
                        </div>
                      </td>
                      <td className="text-right p-4">
                        <span className={`font-medium ${
                          parseFloat(item.conversionRate) > 2 ? 'text-green-600' : 
                          parseFloat(item.conversionRate) > 1 ? 'text-yellow-600' : 'text-muted-foreground'
                        }`}>
                          {item.conversionRate}%
                        </span>
                      </td>
                      <td className="text-right p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === 'active' ? 'bg-green-100 text-green-700' :
                          item.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
