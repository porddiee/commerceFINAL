'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Package, DollarSign, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, orders, sales

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, filter])

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)

    try {
      if (filter === 'all' || filter === 'orders') {
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            listings (
              id,
              title,
              price,
              images,
              seller_id,
              profiles!listings_seller_id_fkey (
                full_name,
                avatar_url
              )
            )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
        setOrders(ordersData || [])
      }

      if (filter === 'all' || filter === 'sales') {
        const { data: salesData } = await supabase
          .from('orders')
          .select(`
            *,
            listings (
              id,
              title,
              price,
              images,
              buyer_id,
              profiles!listings_seller_id_fkey (
                full_name,
                avatar_url
              )
            )
          `)
          .eq('listings.seller_id', user.id)
          .order('created_at', { ascending: false })
        setSales(salesData || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      fetchTransactions()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Transactions</h1>
          <p className="text-muted-foreground">View your orders and sales</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTransactions} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(filter === 'all' || filter === 'orders') && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders
          </h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No orders yet</p>
                <Button asChild>
                  <a href="/browse">Browse Products</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{order.listings?.title}</CardTitle>
                      <CardDescription>
                        Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {order.listings?.images?.[0] && (
                        <img
                          src={order.listings.images[0]}
                          alt={order.listings.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{formatPrice(order.listings?.price, 'PHP')}</p>
                        <p className="text-sm text-muted-foreground">
                          Seller: {order.listings?.profiles?.full_name}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {(filter === 'all' || filter === 'sales') && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Sales
          </h2>
          {sales.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No sales yet</p>
                <Button asChild>
                  <a href="/user/listings/create">Sell Product</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            sales.map((sale) => (
              <Card key={sale.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{sale.listings?.title}</CardTitle>
                      <CardDescription>
                        Order #{sale.id.slice(0, 8)} • {new Date(sale.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sale.status)}
                      <span className="capitalize">{sale.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {sale.listings?.images?.[0] && (
                        <img
                          src={sale.listings.images[0]}
                          alt={sale.listings.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{formatPrice(sale.listings?.price, 'PHP')}</p>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {sale.listings?.profiles?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={sale.status}
                        onValueChange={(value) => handleUpdateOrderStatus(sale.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
