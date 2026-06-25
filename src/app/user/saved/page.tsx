'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import {
  ShoppingCart,
  Bell,
  BellOff,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Package,
  MapPin,
  Tag,
  Sparkles,
  CheckSquare,
  Square,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

type CartListing = {
  id: string
  title: string
  price: number
  currency?: string
  images: string[]
  condition: string
  location: string
  quantity: number
  status: string
  buy_type?: string
}

function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-card animate-pulse">
      <div className="w-6 h-6 rounded bg-muted flex-shrink-0 mt-1" />
      <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded-lg w-3/4" />
        <div className="h-3 bg-muted rounded-lg w-1/3" />
        <div className="h-3 bg-muted rounded-lg w-1/4" />
        <div className="flex gap-2 mt-3">
          <div className="h-8 bg-muted rounded-lg w-24" />
          <div className="h-8 bg-muted rounded-lg w-20" />
        </div>
      </div>
      <div className="h-6 w-20 bg-muted rounded-lg flex-shrink-0" />
    </div>
  )
}

const CONDITION_STYLES: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  like_new: { label: 'Like New', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  good: { label: 'Good', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  fair: { label: 'Fair', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
}

export default function SavedListingsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const router = useRouter()
  const [listings, setListings] = useState<CartListing[]>([])
  const [loading, setLoading] = useState(true)
  const [savedItems, setSavedItems] = useState<Map<string, any>>(new Map())
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) fetchSavedListings()
  }, [user])

  const fetchSavedListings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select(`*, listings (*)`)
        .eq('user_id', user.id)
      if (error) throw error

      const savedMap = new Map()
      data?.forEach((item: any) => {
        savedMap.set(item.listing_id, { notify_on_price_drop: item.notify_on_price_drop })
      })
      setSavedItems(savedMap)
      const fetched = data?.map((item: any) => ({ ...item.listings })).filter(Boolean) || []
      setListings(fetched)
      // Auto-select all on load
      setSelectedIds(new Set(fetched.map((l: CartListing) => l.id)))
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (listingId: string) => {
    if (!user) return
    setRemovingId(listingId)
    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      if (error) throw error
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      setSavedItems((prev) => {
        const next = new Map(prev)
        next.delete(listingId)
        return next
      })
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(listingId)
        return next
      })
    } catch (error) {
      console.error('Error removing saved listing:', error)
    } finally {
      setRemovingId(null)
    }
  }

  const handleTogglePriceDrop = async (listingId: string) => {
    if (!user) return
    setTogglingId(listingId)
    const currentValue = savedItems.get(listingId)?.notify_on_price_drop || false
    try {
      const { error } = await supabase
        .from('saved_listings')
        .update({ notify_on_price_drop: !currentValue })
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      if (error) {
        if (error.message?.includes('column') || error.code === '42703') {
          alert('The price drop notification feature is not yet available.')
          return
        }
        throw error
      }
      setSavedItems((prev) => {
        const next = new Map(prev)
        next.set(listingId, { notify_on_price_drop: !currentValue })
        return next
      })
    } catch (error: any) {
      console.error('Error updating price drop notification:', error)
    } finally {
      setTogglingId(null)
    }
  }

  // ── Selection helpers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = listings.length > 0 && selectedIds.size === listings.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(listings.map((l) => l.id)))
  }

  const selectedListings = listings.filter((l) => selectedIds.has(l.id))
  const selectedTotal = selectedListings.reduce((sum, l) => sum + (l.price || 0), 0)

  const handleCheckoutSelected = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds).join(',')
    router.push(`/checkout?listings=${ids}&from=cart`)
  }

  const handleCheckoutSingle = (listingId: string) => {
    router.push(`/checkout?listing=${listingId}&from=cart`)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <ShoppingCart className="h-4 w-4 text-white" />
            </span>
            Cart Items
          </h1>
          <p className="text-sm text-muted-foreground pl-10">
            {loading ? 'Loading…' : `${listings.length} item${listings.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        {listings.length > 0 && (
          <Link href="/browse">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
              <Sparkles className="h-3.5 w-3.5" />
              Browse More
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <CartItemSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        /* ── Empty State ── */
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-24 flex flex-col items-center gap-5 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 text-lg">🛒</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Find something you love and add it to your cart to keep track of it.
            </p>
          </div>
          <Link href="/browse">
            <Button className="gap-2 rounded-xl px-6">
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        /* ── Main Layout: List + Summary ── */
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
          {/* Cart Items List */}
          <div className="flex-1 space-y-3">
            {/* Select-all bar */}
            <div className="flex items-center justify-between px-1 pb-1">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="h-4.5 w-4.5" />
                )}
                {allSelected ? 'Deselect all' : `Select all (${listings.length})`}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedIds.size} of {listings.length} selected
                </span>
              )}
            </div>

            {listings.map((listing, index) => {
              const notify = savedItems.get(listing.id)?.notify_on_price_drop || false
              const cond = CONDITION_STYLES[listing.condition] ?? { label: listing.condition, cls: 'bg-muted text-muted-foreground' }
              const isRemoving = removingId === listing.id
              const isToggling = togglingId === listing.id
              const mainImage = listing.images?.[0]
              const isSelected = selectedIds.has(listing.id)

              return (
                <div
                  key={listing.id}
                  className={`group flex gap-3 p-4 rounded-2xl border bg-card transition-all duration-200 ${
                    isRemoving ? 'opacity-40 pointer-events-none scale-[0.99]' : ''
                  } ${
                    isSelected
                      ? 'border-indigo-300 dark:border-indigo-700 shadow-sm shadow-indigo-500/10'
                      : 'border-border/50 hover:border-border hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(listing.id)}
                    className="flex-shrink-0 mt-1 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title={isSelected ? 'Deselect' : 'Select'}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  {/* Product Image */}
                  <Link href={`/products/${listing.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted relative">
                      {mainImage ? (
                        <Image
                          src={mainImage}
                          alt={listing.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/products/${listing.id}`}>
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                            {listing.title}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cond.cls}`}>
                            <Tag className="h-2.5 w-2.5" />
                            {cond.label}
                          </span>
                          {listing.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />
                              {listing.location}
                            </span>
                          )}
                          {listing.buy_type && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              listing.buy_type === 'reserve'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                            }`}>
                              {listing.buy_type === 'reserve' ? 'Reserve' : 'Buy Now'}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Price */}
                      <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        {formatPrice(listing.price, listing.currency || 'PHP')}
                      </span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
                      {/* Single Checkout Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 rounded-xl text-xs h-8 px-3"
                        onClick={() => handleCheckoutSingle(listing.id)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Checkout
                        <ArrowRight className="h-3 w-3" />
                      </Button>

                      {/* Price Drop Toggle */}
                      <button
                        onClick={() => handleTogglePriceDrop(listing.id)}
                        disabled={isToggling}
                        title={notify ? 'Disable price drop alerts' : 'Enable price drop alerts'}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border transition-all duration-200 ${
                          notify
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-border'
                        } ${isToggling ? 'opacity-60' : ''}`}
                      >
                        {notify ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{notify ? 'Alert On' : 'Alert Off'}</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(listing.id)}
                        disabled={isRemoving}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border border-border bg-muted/40 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-900 dark:hover:text-red-400 transition-all duration-200 ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Panel */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-border/50 bg-card overflow-hidden">
              {/* Panel Header */}
              <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20">
                <h2 className="font-semibold text-sm">Order Summary</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} of ${listings.length} item${listings.length !== 1 ? 's' : ''} selected`
                    : `${listings.length} item${listings.length !== 1 ? 's' : ''} (none selected)`}
                </p>
              </div>

              {/* Item Breakdown — only selected */}
              <div className="px-5 py-4 space-y-2.5 max-h-64 overflow-y-auto">
                {selectedListings.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Select items to see summary
                  </p>
                ) : (
                  selectedListings.map((listing) => (
                    <div key={listing.id} className="flex items-center gap-2 text-xs">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                        {listing.images?.[0] ? (
                          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="32px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 line-clamp-1 text-muted-foreground">{listing.title}</span>
                      <span className="font-semibold text-foreground flex-shrink-0">
                        {formatPrice(listing.price, listing.currency || 'PHP')}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-border/50 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''})</span>
                  <span>{formatPrice(selectedTotal, 'PHP')}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border/50">
                  <span>Estimated Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(selectedTotal, 'PHP')}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 space-y-2">
                <Button
                  onClick={handleCheckoutSelected}
                  disabled={selectedIds.size === 0}
                  className="w-full rounded-xl gap-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  Checkout {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </Button>
                <Link href="/browse">
                  <Button variant="outline" className="w-full rounded-xl gap-2 text-sm" size="sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
