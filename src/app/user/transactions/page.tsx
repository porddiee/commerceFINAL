'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { 
  Package, 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  User, 
  MapPin, 
  CreditCard, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Star,
  Copy,
  Check,
  Truck,
  ExternalLink
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { OrderTimeline } from '@/components/order-timeline'
import Link from 'next/link'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  
  const [orders, setOrders] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchases') // purchases, sales
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, pending, processing, shipped, delivered, cancelled
  
  // Expanded card details state
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
  const [reviewedListings, setReviewedListings] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Fetch Orders (Purchases - where buyer is current user)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          listings (*),
          seller:profiles!orders_seller_id_fkey (id, full_name, avatar_url),
          buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_url)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError
      setOrders(ordersData || [])

      // 2. Fetch Sales (where seller is current user)
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select(`
          *,
          listings (*),
          seller:profiles!orders_seller_id_fkey (id, full_name, avatar_url),
          buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_url)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError
      setSales(salesData || [])

      // 3. Fetch reviews for delivered orders to check if already reviewed
      const deliveredListingIds = (ordersData || [])
        .filter((order: any) => order.status === 'delivered' && order.listing_id)
        .map((order: any) => order.listing_id)
      
      if (deliveredListingIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('listing_id')
          .eq('reviewer_id', user.id)
          .in('listing_id', deliveredListingIds)
        
        const reviewedSet = new Set(reviews?.map((r: any) => r.listing_id) || [])
        setReviewedListings(reviewedSet)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, buyer_id, listings (title)')
        .eq('id', orderId)
        .single()

      if (fetchError || !order) throw fetchError || new Error('Order not found')

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Send notification to buyer
      let notificationTitle = ''
      let notificationContent = ''

      if (newStatus === 'processing') {
        notificationTitle = 'Order Accepted'
        notificationContent = `Your order for "${order.listings?.title}" has been accepted by the seller.`
      } else if (newStatus === 'cancelled') {
        notificationTitle = 'Order Cancelled'
        notificationContent = `Your order for "${order.listings?.title}" has been cancelled by the seller.`
      } else if (newStatus === 'shipped') {
        notificationTitle = 'Order Shipped'
        notificationContent = `Your order for "${order.listings?.title}" has been shipped.`
      } else if (newStatus === 'delivered') {
        notificationTitle = 'Order Delivered'
        notificationContent = `Your order for "${order.listings?.title}" has been delivered.`
      }

      if (notificationTitle && notificationContent) {
        try {
          await supabase.rpc('create_notification', {
            recipient_id: order.buyer_id,
            notification_type: 'system',
            notification_title: notificationTitle,
            notification_content: notificationContent,
            notification_link: `/user/orders`,
          })
        } catch (err) {
          console.error('Error creating notification:', err)
        }
      }

      fetchTransactions()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-1.5" variant="outline">
            <CheckCircle className="h-3 w-3" />
            <span className="capitalize font-medium text-xs">Delivered</span>
          </Badge>
        )
      case 'pending':
      case 'pending_confirmation':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1.5" variant="outline">
            <Clock className="h-3 w-3" />
            <span className="capitalize font-medium text-xs">Pending</span>
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1.5" variant="outline">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span className="capitalize font-medium text-xs">Processing</span>
          </Badge>
        )
      case 'shipped':
        return (
          <Badge className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800 flex items-center gap-1.5" variant="outline">
            <Truck className="h-3 w-3 animate-bounce" />
            <span className="capitalize font-medium text-xs">Shipped</span>
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800 flex items-center gap-1.5" variant="outline">
            <XCircle className="h-3 w-3" />
            <span className="capitalize font-medium text-xs">Cancelled</span>
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5" variant="outline">
            <Clock className="h-3 w-3" />
            <span className="capitalize font-medium text-xs">{status}</span>
          </Badge>
        )
    }
  }

  // --- Calculations for Overview Stats ---
  const getStats = (items: any[], type: 'purchases' | 'sales') => {
    const validItems = items.filter(item => item.status !== 'cancelled')
    const totalAmount = validItems.reduce((acc, item) => acc + (item.total_amount || 0), 0)
    const activeCount = items.filter(item => ['pending', 'pending_confirmation', 'processing', 'shipped'].includes(item.status)).length
    const completedCount = items.filter(item => ['delivered', 'completed'].includes(item.status)).length

    return {
      totalAmount,
      activeCount,
      completedCount
    }
  }

  const purchasesStats = getStats(orders, 'purchases')
  const salesStats = getStats(sales, 'sales')

  // --- Filtering Logic ---
  const filterList = (list: any[]) => {
    return list.filter(item => {
      // 1. Search term match (Listing title or Order ID)
      const matchesSearch = 
        (item.listings?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      // 2. Status match
      if (statusFilter === 'all') return matchesSearch
      
      if (statusFilter === 'pending') {
        return matchesSearch && (item.status === 'pending' || item.status === 'pending_confirmation')
      }
      
      return matchesSearch && item.status === statusFilter
    })
  }

  const filteredOrders = filterList(orders)
  const filteredSales = filterList(sales)

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading transaction history...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Order History</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">My Transactions</h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">Track, manage, and review your purchases and shop sales.</p>
            </div>
          </div>
          <Button
            onClick={fetchTransactions}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl h-10 px-4 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="purchases" className="space-y-6" onValueChange={(val) => {
        setActiveTab(val)
        setStatusFilter('all') // Reset filters on tab switch
        setSearchTerm('')
      }}>
        <TabsList className="bg-slate-100 p-1 dark:bg-slate-800/80 rounded-xl grid grid-cols-2 max-w-md">
          <TabsTrigger 
            value="purchases" 
            className="rounded-lg py-2.5 font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all"
          >
            <ArrowDownLeft className="h-4 w-4 mr-2 text-emerald-500" />
            Purchases ({orders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className="rounded-lg py-2.5 font-semibold text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all"
          >
            <ArrowUpRight className="h-4 w-4 mr-2 text-blue-500" />
            Sales ({sales.length})
          </TabsTrigger>
        </TabsList>

        {/* Stats Grid Component */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-l-4 border-indigo-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeTab === 'purchases' ? 'Total Spent' : 'Total Revenue'}
                </p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                  {formatPrice(activeTab === 'purchases' ? purchasesStats.totalAmount : salesStats.totalAmount, 'PHP')}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {activeTab === 'purchases' ? <DollarSign className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-l-4 border-amber-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Transactions</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                  {activeTab === 'purchases' ? purchasesStats.activeCount : salesStats.activeCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-l-4 border-emerald-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Deals</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                  {activeTab === 'purchases' ? purchasesStats.completedCount : salesStats.completedCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Badges Filter Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search by product name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-950 border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
            {[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Processing', value: 'processing' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
                  statusFilter === btn.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Purchases Content */}
        <TabsContent value="purchases" className="space-y-4 outline-none">
          {filteredOrders.length === 0 ? (
            <Card className="border border-dashed border-slate-300 dark:border-slate-800 py-16">
              <CardContent className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center mb-4 text-muted-foreground">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No orders found</h3>
                <p className="text-muted-foreground max-w-sm text-center mt-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? "We couldn't find any orders matching your current search or filters." 
                    : "You haven't purchased anything yet. Explore our listing collections!"}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md px-6">
                    <Link href="/browse">Browse Marketplace</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const listing = order.listings
              const image = listing?.images?.[0] || '/placeholder.svg'
              const isExpanded = expandedOrders[order.id] || false
              const hasReviewed = reviewedListings.has(listing?.id)

              return (
                <Card 
                  key={order.id} 
                  className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-slate-950"
                >
                  {/* Card Header Section */}
                  <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">ORDER ID</span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span>{order.id.slice(0, 8).toUpperCase()}</span>
                          <button 
                            onClick={() => copyToClipboard(order.id)} 
                            className="hover:text-indigo-600 transition-colors"
                            title="Copy full order ID"
                          >
                            {copiedId === order.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Ordered on {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Card Body Section */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
                    {/* Item Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border flex-shrink-0 group">
                      <img
                        src={image}
                        alt={listing?.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-950 dark:text-white line-clamp-1 hover:underline">
                          <Link href={`/products/${listing?.id}`}>{listing?.title}</Link>
                        </h3>
                        <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(order.total_amount || listing?.price, 'PHP')}
                        </p>
                      </div>

                      {/* Counterparty / Seller details */}
                      <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-indigo-100">
                            <AvatarImage src={order.seller?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 font-bold text-xs uppercase">
                              {order.seller?.full_name?.slice(0, 2) || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium leading-none">Seller</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{order.seller?.full_name || 'Seller'}</p>
                          </div>
                        </div>

                        {/* Card Toggle buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleOrderExpansion(order.id)} 
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 h-8 px-2.5"
                          >
                            {isExpanded ? (
                              <>
                                Hide Info <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                View Info <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide down expandable details info */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-200">
                      {/* Timeline */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="h-4 w-4" />
                          Delivery Progress
                        </h4>
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                          <OrderTimeline 
                            status={order.status} 
                            buyType={listing?.buy_type || 'buy_now'} 
                          />
                        </div>
                      </div>

                      {/* Shipping & Payment Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            Shipping Details
                          </h4>
                          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border text-xs text-slate-700 dark:text-slate-350 space-y-1">
                            {order.shipping_address ? (
                              <p className="whitespace-pre-line font-medium">{order.shipping_address}</p>
                            ) : (
                              <p className="text-muted-foreground italic">No shipping details provided</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            Payment Method
                          </h4>
                          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {order.payment_method || 'GCash Payment'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="px-4 py-3 sm:px-5 border-t flex flex-wrap gap-2 justify-end bg-slate-50/20">
                    <Button variant="outline" size="sm" asChild className="text-xs font-semibold rounded-lg h-9">
                      <Link href={`/products/${listing?.id}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Product Page
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="text-xs font-semibold rounded-lg h-9">
                      <Link href={`/user/messages/${order.seller_id}`}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Chat Seller
                      </Link>
                    </Button>
                    {order.status === 'delivered' && !hasReviewed && (
                      <Button variant="default" size="sm" asChild className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9">
                        <Link href={`/user/review/${order.id}`}>
                          <Star className="h-3.5 w-3.5 mr-1.5 text-yellow-400 fill-yellow-400" />
                          Rate Product
                        </Link>
                      </Button>
                    )}
                    {order.status === 'delivered' && hasReviewed && (
                      <Button variant="outline" size="sm" disabled className="text-xs font-semibold rounded-lg h-9 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Reviewed
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Tab 2: Sales Content */}
        <TabsContent value="sales" className="space-y-4 outline-none">
          {filteredSales.length === 0 ? (
            <Card className="border border-dashed border-slate-300 dark:border-slate-800 py-16">
              <CardContent className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center mb-4 text-muted-foreground">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No sales found</h3>
                <p className="text-muted-foreground max-w-sm text-center mt-1">
                  {searchTerm || statusFilter !== 'all' 
                    ? "We couldn't find any sales transactions matching your search." 
                    : "You haven't listed or sold anything yet. Put your first product on SuriMart!"}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md px-6">
                    <Link href="/user/products/create">List a Product</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredSales.map((sale) => {
              const listing = sale.listings
              const image = listing?.images?.[0] || '/placeholder.svg'
              const isExpanded = expandedOrders[sale.id] || false

              return (
                <Card 
                  key={sale.id} 
                  className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-slate-950"
                >
                  {/* Card Header Section */}
                  <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">ORDER ID</span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span>{sale.id.slice(0, 8).toUpperCase()}</span>
                          <button 
                            onClick={() => copyToClipboard(sale.id)} 
                            className="hover:text-indigo-600 transition-colors"
                            title="Copy full order ID"
                          >
                            {copiedId === sale.id ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Ordered on {new Date(sale.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(sale.status)}
                    </div>
                  </div>

                  {/* Card Body Section */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
                    {/* Item Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border flex-shrink-0 group">
                      <img
                        src={image}
                        alt={listing?.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-slate-950 dark:text-white line-clamp-1 hover:underline">
                          <Link href={`/products/${listing?.id}`}>{listing?.title}</Link>
                        </h3>
                        <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(sale.total_amount || listing?.price, 'PHP')}
                        </p>
                      </div>

                      {/* Counterparty / Buyer details */}
                      <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-indigo-100">
                            <AvatarImage src={sale.buyer?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 font-bold text-xs uppercase">
                              {sale.buyer?.full_name?.slice(0, 2) || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium leading-none">Buyer</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sale.buyer?.full_name || 'Buyer'}</p>
                          </div>
                        </div>

                        {/* Card Toggle buttons */}
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleOrderExpansion(sale.id)} 
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 h-8 px-2.5"
                          >
                            {isExpanded ? (
                              <>
                                Hide Info <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                View Info <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slide down expandable details info */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-200">
                      {/* Timeline */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="h-4 w-4" />
                          Delivery Progress
                        </h4>
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border shadow-sm">
                          <OrderTimeline 
                            status={sale.status} 
                            buyType={listing?.buy_type || 'buy_now'} 
                          />
                        </div>
                      </div>

                      {/* Shipping & Payment Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            Buyer Shipping Address
                          </h4>
                          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border text-xs text-slate-700 dark:text-slate-350 space-y-1">
                            {sale.shipping_address ? (
                              <p className="whitespace-pre-line font-medium">{sale.shipping_address}</p>
                            ) : (
                              <p className="text-muted-foreground italic">No shipping details provided</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" />
                            Payment Method
                          </h4>
                          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {sale.payment_method || 'GCash Payment'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="px-4 py-3 sm:px-5 border-t flex flex-wrap gap-2 justify-end bg-slate-50/20">
                    <Button variant="outline" size="sm" asChild className="text-xs font-semibold rounded-lg h-9">
                      <Link href={`/user/messages/${sale.buyer_id}`}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Chat Buyer
                      </Link>
                    </Button>
                    
                    {/* Status Management Buttons (Seller Flow) */}
                    {sale.status === 'pending' && (
                      <>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleUpdateOrderStatus(sale.id, 'cancelled')}
                          className="text-xs font-semibold rounded-lg h-9"
                        >
                          Cancel Order
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleUpdateOrderStatus(sale.id, 'processing')}
                          className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9"
                        >
                          Accept Order
                        </Button>
                      </>
                    )}
                    {sale.status === 'processing' && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleUpdateOrderStatus(sale.id, 'shipped')}
                        className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9"
                      >
                        <Truck className="h-3.5 w-3.5 mr-1.5" />
                        Mark as Shipped
                      </Button>
                    )}
                    {sale.status === 'shipped' && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleUpdateOrderStatus(sale.id, 'delivered')}
                        className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
