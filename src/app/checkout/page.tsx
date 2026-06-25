'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { ArrowLeft, MapPin, CreditCard, Package, CheckCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()

  // Support both single ?listing=id and multi ?listings=id1,id2,id3
  const singleListingId = searchParams.get('listing')
  const multiListingIds = searchParams.get('listings')
  const fromParam = searchParams.get('from') // 'cart' → back goes to /user/saved

  // Normalise to an array of IDs
  const listingIds: string[] = multiListingIds
    ? multiListingIds.split(',').filter(Boolean)
    : singleListingId
    ? [singleListingId]
    : []

  // For backward-compat we still expose a single "listingId" (first one)
  const listingId = listingIds[0] ?? null

  const [listings, setListings] = useState<any[]>([])   // all items in this checkout
  const [sellers, setSellers] = useState<Map<string, any>>(new Map())
  // legacy single aliases
  const listing = listings[0] ?? null
  const seller = sellers.get(listing?.seller_id) ?? null

  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderIds, setOrderIds] = useState<string[]>([])
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

  const handleBack = () => {
    if (fromParam === 'cart') router.push('/user/saved')
    else router.back()
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (listingIds.length > 0) {
      fetchListings()
      fetchAddresses()
      fetchPaymentMethods()
    }
  }, [user])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .in('id', listingIds)
        .eq('status', 'active')

      if (listingsData && listingsData.length > 0) {
        setListings(listingsData)

        // Fetch all unique sellers
        const sellerIds = [...new Set(listingsData.map((l: any) => l.seller_id))]
        const { data: sellersData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', sellerIds)

        const sellerMap = new Map<string, any>()
        sellersData?.forEach((s: any) => sellerMap.set(s.id, s))
        setSellers(sellerMap)
      } else {
        router.push('/browse')
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
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
    if (!user || listings.length === 0 || !selectedAddress || !selectedPayment) {
      alert('Please select an address and payment method')
      return
    }

    setPlacingOrder(true)

    try {
      const shippingAddress = `${selectedAddress.full_name}, ${selectedAddress.phone}, ${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}, ${selectedAddress.province} ${selectedAddress.postal_code || ''}`

      const placedIds: string[] = []

      // Create one order per listing (marketplace model)
      for (const item of listings) {
        const itemSeller = sellers.get(item.seller_id)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            seller_id: item.seller_id,
            listing_id: item.id,
            total_amount: item.price,
            shipping_address: shippingAddress,
            payment_method: selectedPayment,
            status: 'pending',
          })
          .select()
          .single()

        if (orderError) throw orderError

        if (orderData) {
          placedIds.push(orderData.id)
          // Notify each seller
          if (itemSeller) {
            await supabase.rpc('create_notification', {
              recipient_id: itemSeller.id,
              notification_type: 'system',
              notification_title: 'New Order Received',
              notification_content: `${user.email} has ordered "${item.title}" for ₱${item.price.toLocaleString()}`,
              notification_link: '/user/orders',
            })
          }
        }
      }

      setOrderIds(placedIds)
      setOrderPlaced(true)
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
        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Green hero */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-center text-white">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-9 w-9" />
              </div>
              <h1 className="text-2xl font-extrabold">Order{orderIds.length > 1 ? 's' : ''} Placed!</h1>
              <p className="text-emerald-100 text-sm mt-1">
                {orderIds.length} order{orderIds.length !== 1 ? 's' : ''} successfully created
              </p>
            </div>
            <CardContent className="p-8 space-y-6">
              {/* Items confirmed */}
              <div className="space-y-3">
                {listings.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="flex-1 font-medium line-clamp-1">{item.title}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(item.price, 'PHP')}</span>
                  </div>
                ))}
              </div>
              {/* Status trail */}
              <div className="border rounded-2xl p-4 space-y-3">
                {['Order Placed', 'Processing', 'Shipped', 'Delivered'].map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 text-sm ${i === 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                    {i === 0
                      ? <CheckCircle className="h-4 w-4" />
                      : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                    {step}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push('/user/orders')} className="w-full rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                  <Package className="h-4 w-4" />
                  View My Orders
                </Button>
                <Button variant="outline" onClick={() => router.push('/browse')} className="w-full rounded-xl gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalAmount = listings.reduce((sum, l) => sum + (l.price || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Checkout</h1>
            {listings.length > 1 && (
              <p className="text-sm text-muted-foreground">{listings.length} items</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Product Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* All items */}
                <div className="space-y-3">
                  {listings.map((item) => {
                    const itemSeller = sellers.get(item.seller_id)
                    const mainImage = item.images?.[0] || '/placeholder.svg'
                    return (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                        <img
                          src={mainImage}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Seller: {itemSeller?.full_name || 'Unknown'}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              item.buy_type === 'reserve'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {item.buy_type === 'reserve' ? 'Reserve' : 'Buy Now'}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                              {formatPrice(item.price, 'PHP')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({listings.length} item{listings.length !== 1 ? 's' : ''})</span>
                    <span>{formatPrice(totalAmount, 'PHP')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping Fee</span>
                    <span className="text-emerald-600">₱0</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(totalAmount, 'PHP')}</span>
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
                className="w-full rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold shadow-md shadow-indigo-500/20"
                disabled={!selectedAddress || !selectedPayment || placingOrder}
              >
                {placingOrder ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order{listings.length > 1 ? 's' : ''}…</>
                ) : (
                  <><CreditCard className="h-4 w-4" />Place Order{listings.length > 1 ? `s (${listings.length})` : ''}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
