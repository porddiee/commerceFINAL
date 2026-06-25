'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Package, MapPin, CreditCard, CheckCircle, Clock, Truck, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { OrderTimeline } from '@/components/order-timeline'
import { OrdersListSkeleton } from '@/components/skeletons/order-skeleton'

export default function OrdersPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          listings (*),
          seller:profiles!orders_seller_id_fkey (full_name, avatar_url),
          buyer:profiles!orders_buyer_id_fkey (full_name, avatar_url)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
      }

      // Fetch addresses separately for orders that have shipping_address_id
      const ordersWithAddresses = await Promise.all(
        (data || []).map(async (order) => {
          if (order.shipping_address_id) {
            const { data: addressData } = await supabase
              .from('addresses')
              .select('*')
              .eq('id', order.shipping_address_id)
              .single()
            return { ...order, addresses: addressData }
          }
          return order
        })
      )

      // Fetch reviews for delivered orders to check if already reviewed
      const listingIds = (data || []).map((order: any) => order.listing_id).filter(Boolean)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('listing_id')
        .eq('reviewer_id', user.id)
        .in('listing_id', listingIds)
      
      const reviewedSet = new Set(reviews?.map((r: any) => r.listing_id) || [])
      setReviewedProducts(reviewedSet)
      
      setOrders(ordersWithAddresses)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'shipped':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <Clock className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_confirmation':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      case 'shipped':
        return 'text-purple-600'
      case 'delivered':
        return 'text-green-600'
      case 'cancelled':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">My Orders</h1>
          <OrdersListSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button asChild>
                <Link href="/browse">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const listing = order.listings
              const images = listing?.images || []
              const mainImage = images[0] || '/placeholder.svg'
              const isBuyer = user && order.buyer_id === user.id

              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={mainImage}
                        alt={listing?.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{listing?.title}</h3>
                            <p className="text-2xl font-bold text-primary mt-1">
                              ₱{order.total_amount?.toLocaleString()}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize font-medium">{order.status}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>Order ID: {order.id}</span>
                          </div>
                          {order.addresses ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <div>
                                <p>{order.addresses.full_name}</p>
                                <p>{order.addresses.address_line1}{order.addresses.address_line2 ? ', ' + order.addresses.address_line2 : ''}</p>
                                <p>{order.addresses.city}, {order.addresses.province}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>Address not available</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>{order.payment_method}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Seller:</span>
                            <span className="font-medium">{order.seller?.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Ordered on:</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-4">Order Status</h4>
                          <OrderTimeline 
                            status={order.status} 
                            buyType={listing?.buy_type || 'buy_now'} 
                          />
                        </div>

                        <div className="mt-4 flex gap-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/products/${listing?.id}`}>View Product</Link>
                          </Button>
                          {order.status === 'delivered' && !reviewedProducts.has(listing?.id) && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/user/review/${order.id}`}>
                                <Star className="h-4 w-4 mr-1" />
                                Rate/Review
                              </Link>
                            </Button>
                          )}
                          {order.status === 'delivered' && reviewedProducts.has(listing?.id) && (
                            <Button variant="outline" size="sm" disabled>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reviewed
                            </Button>
                          )}
                          {order.tracking_number && (
                            <Button variant="outline" size="sm">
                              Track Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
