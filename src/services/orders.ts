import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface OrderWithListing extends Order {
  listing_id: string
}

export interface Order {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string
  total_amount: number
  shipping_address_id?: string
  payment_method: string
  status: 'pending' | 'pending_confirmation' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number?: string
  created_at: string
  updated_at: string
}

export const ordersService = {
  /**
   * Count orders by listing ID (for purchase count)
   */
  async countOrdersByListing(listingId: string): Promise<number> {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)

    if (error) throw error
    return count || 0
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get orders by buyer ID
   */
  async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get orders by seller ID
   */
  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Count completed orders by listing IDs
   */
  async countCompletedOrdersByListingIds(listingIds: string[]): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('orders')
      .select('listing_id')
      .in('listing_id', listingIds)
      .in('status', ['delivered'])

    if (error) throw error

    const counts: Record<string, number> = {}
    for (const order of data || []) {
      counts[order.listing_id] = (counts[order.listing_id] || 0) + 1
    }
    return counts
  },

  /**
   * Get orders by listing IDs
   */
  async getOrdersByListingIds(listingIds: string[]): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('listing_id', listingIds)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get all orders (admin use)
   */
  async getAllOrders(limit = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('id, total_price, status, created_at, seller_id, buyer_id')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Count all orders
   */
  async countAllOrders(): Promise<number> {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update tracking number
   */
  async updateTrackingNumber(id: string, trackingNumber: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },
}
