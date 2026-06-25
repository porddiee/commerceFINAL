'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Package, MapPin, CreditCard, CheckCircle, Clock, Truck, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SalesPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        .eq('seller_id', user.id)
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
      
      setOrders(ordersWithAddresses)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('*, buyer_id, listings (title)')
        .eq('id', orderId)
        .single()

      if (!order) return

      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

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
          const { error: notificationError } = await supabase.rpc('create_notification', {
            recipient_id: order.buyer_id,
            notification_type: 'system',
            notification_title: notificationTitle,
            notification_content: notificationContent,
            notification_link: `/user/transactions`,
          })
          
          if (notificationError) {
            console.error('Notification error:', notificationError)
            console.error('Notification error details:', JSON.stringify(notificationError, null, 2))
          }
        } catch (err) {
          console.error('Unexpected error creating notification:', err)
          console.error('Error details:', JSON.stringify(err, null, 2))
        }
      }

      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">My Sales</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No sales yet</p>
              <Button asChild>
                <Link href="/user/products">Manage Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const listing = order.listings
              const images = listing?.images || []
              const mainImage = images[0] || '/placeholder.svg'

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
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Buyer: {order.buyer?.full_name}</span>
                          </div>
                          {order.addresses ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <div>
                                <p>{order.addresses.full_name}</p>
                                <p>{order.addresses.address_line1}{order.addresses.address_line2 ? ', ' + order.addresses.address_line2 : ''}</p>
                                <p>{order.addresses.city}, {order.addresses.province}</p>
                                <p>{order.addresses.phone}</p>
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
                            <span>Ordered on:</span>
                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/products/${listing?.id}`}>View Product</Link>
                          </Button>
                          {order.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                              >
                                Accept Order
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'processing' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            >
                              Mark as Shipped
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            >
                              Mark as Delivered
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
