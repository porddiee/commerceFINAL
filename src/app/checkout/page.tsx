'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()
  const listingId = searchParams.get('listing')
  
  const [listing, setListing] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [addresses, setAddresses] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    is_default: false
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (listingId) {
      fetchListing()
      fetchAddresses()
      fetchPaymentMethods()
    }
  }, [listingId, user])

  const fetchListing = async () => {
    setLoading(true)
    try {
      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .single()

      if (listingData) {
        setListing(listingData)
        
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', listingData.seller_id)
          .single()
        
        setSeller(sellerData)
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
      router.push('/browse')
    } finally {
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
      
      setAddresses(data || [])
      if (data && data.length > 0) {
        setSelectedAddress(data[0])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const fetchPaymentMethods = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
      
      setPaymentMethods(data || [])
      if (data && data.length > 0) {
        const defaultMethod = data.find((m: any) => m.is_default) || data[0]
        setSelectedPayment(defaultMethod.type)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const handleAddAddress = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          ...newAddress
        })
        .select()
        .single()

      if (data) {
        setAddresses([...addresses, data])
        setSelectedAddress(data)
        setShowAddAddress(false)
        setNewAddress({
          label: '',
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          province: '',
          postal_code: '',
          is_default: false
        })
      }
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Failed to add address')
    }
  }

  const handlePlaceOrder = async () => {
    if (!user || !listing || !seller || !selectedAddress || !selectedPayment) {
      alert('Please select an address and payment method')
      return
    }
    
    setPlacingOrder(true)
    
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: seller.id,
          listing_id: listing.id,
          total_amount: listing.price,
          shipping_address: `${selectedAddress.full_name}, ${selectedAddress.phone}, ${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}, ${selectedAddress.province} ${selectedAddress.postal_code || ''}`,
          payment_method: selectedPayment,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) {
        console.error('Supabase order error:', orderError)
        throw orderError
      }

      if (orderData) {
        const notificationTitle = 'New Order Received'
        const notificationContent = `${user.email} has ordered "${listing.title}" for ₱${listing.price.toLocaleString()}`
        
        // Create notification for seller using function
        const { data: notificationData, error: notificationError } = await supabase.rpc('create_notification', {
          recipient_id: seller.id,
          notification_type: 'system',
          notification_title: notificationTitle,
          notification_content: notificationContent,
          notification_link: `/user/orders`,
        })
        
        if (notificationError) {
          console.error('Notification error:', notificationError)
          console.error('Notification error details:', JSON.stringify(notificationError, null, 2))
        }

        setOrderId(orderData.id)
        setOrderPlaced(true)
      }
    } catch (error: any) {
      console.error('Error placing order:', error)
      alert(`Failed to place order: ${error?.message || 'Unknown error'}`)
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button asChild>
            <Link href="/browse">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/browse">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Order Confirmation</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Order Placed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-lg font-semibold">Order ID: {orderId}</p>
                <p className="text-muted-foreground">
                  Your order has been placed successfully
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Order Placed</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  <span>Processing</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  <span>Shipped</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  <span>Delivered</span>
                </div>
              </div>

              <Button onClick={() => router.push('/user/orders')} className="w-full">
                View My Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const images = listing.images || []
  const mainImage = images[0] || '/placeholder.svg'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/listings/${listing.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Product Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <img
                    src={mainImage}
                    alt={listing.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-2xl font-bold text-primary mt-2">
                      ₱{listing.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seller: {seller?.full_name || 'Unknown'}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        listing.buy_type === 'reserve' 
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {listing.buy_type === 'reserve' ? 'Reserve - Seller Confirmation Required' : 'Buy Now - Instant Purchase'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₱{listing.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>₱0</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₱{listing.price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:border-primary ${
                        selectedPayment === method.type ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedPayment(method.type)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold capitalize">{method.type.replace('_', ' ')}</p>
                          {method.account_number && (
                            <p className="text-sm text-muted-foreground">•••• {method.account_number.slice(-4)}</p>
                          )}
                          {method.provider_name && (
                            <p className="text-sm text-muted-foreground">{method.provider_name}</p>
                          )}
                        </div>
                        {method.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No saved payment methods</p>
                )}
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Or select a payment option:</p>
                  {['Cash on Delivery', 'GCash', 'Maya', 'Bank Transfer'].map((method) => (
                    <div
                      key={method}
                      className={`p-3 border rounded-lg cursor-pointer hover:border-primary ${
                        selectedPayment === method ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedPayment(method)}
                    >
                      <p className="font-semibold text-sm">{method}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddAddress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Label</label>
                      <input
                        type="text"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        placeholder="Home, Work, etc."
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Full Name</label>
                      <input
                        type="text"
                        value={newAddress.full_name}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone</label>
                    <input
                      type="text"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Address Line 1</label>
                    <input
                      type="text"
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.address_line2}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">City</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Province</label>
                      <input
                        type="text"
                        value={newAddress.province}
                        onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                        placeholder="Province"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Postal Code (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      placeholder="Postal code"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={newAddress.is_default}
                      onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                    />
                    <label htmlFor="is_default" className="text-sm">Set as default address</label>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowAddAddress(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddAddress} className="flex-1">
                      Save Address
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No addresses saved</p>
                  ) : (
                    addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:border-primary ${
                          selectedAddress?.id === address.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <p className="font-semibold">{address.label}</p>
                        <p className="text-sm">{address.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.address_line1}{address.address_line2 ? ', ' + address.address_line2 : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.province} {address.postal_code}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                      </div>
                    ))
                  )}
                  <Button variant="outline" onClick={() => setShowAddAddress(true)} className="w-full">
                    + Add New Address
                  </Button>
                </div>
              )}

              <Button 
                onClick={handlePlaceOrder} 
                className="w-full" 
                disabled={!selectedAddress || !selectedPayment || placingOrder}
              >
                {placingOrder ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
