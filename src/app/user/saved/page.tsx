'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import ListingCard from '@/components/listing-card'
import { Heart, Bell, BellOff } from 'lucide-react'

export default function SavedListingsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savedItems, setSavedItems] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    if (user) {
      fetchSavedListings()
    }
  }, [user])

  const fetchSavedListings = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select(`
          *,
          listings (*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      const savedMap = new Map()
      data?.forEach((item: any) => {
        savedMap.set(item.listing_id, { notify_on_price_drop: item.notify_on_price_drop })
      })
      setSavedItems(savedMap)
      
      setListings(data?.map((item: any) => ({
        ...item.listings,
        sellerName: 'Seller', // Would need to join with profiles
      })) || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (listingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (error) throw error
      fetchSavedListings()
    } catch (error) {
      console.error('Error removing saved listing:', error)
    }
  }

  const handleTogglePriceDrop = async (listingId: string) => {
    if (!user) return

    const currentValue = savedItems.get(listingId)?.notify_on_price_drop || false
    try {
      const { error } = await supabase
        .from('saved_listings')
        .update({ notify_on_price_drop: !currentValue })
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (error) {
        console.error('Supabase error:', error)
        // Check if the error is about missing column
        if (error.message?.includes('column') || error.code === '42703') {
          alert('The price drop notification feature is not yet available. Please run the database migration.')
          return
        }
        throw error
      }
      
      // Update local state
      const newSavedItems = new Map(savedItems)
      newSavedItems.set(listingId, { notify_on_price_drop: !currentValue })
      setSavedItems(newSavedItems)
    } catch (error: any) {
      console.error('Error updating price drop notification:', error)
      alert(`Failed to update notification: ${error?.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cart Items</h1>
        <p className="text-muted-foreground">Items you've added to your cart</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No cart items yet</p>
            <Button asChild>
              <a href="/browse">Browse Products</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={`saved-${listing.id}`} className="relative">
              <ListingCard {...listing} />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-background/90 backdrop-blur"
                  onClick={() => handleTogglePriceDrop(listing.id)}
                  title={savedItems.get(listing.id)?.notify_on_price_drop ? "Disable price drop alerts" : "Enable price drop alerts"}
                >
                  {savedItems.get(listing.id)?.notify_on_price_drop ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-background/90 backdrop-blur"
                  onClick={() => handleRemove(listing.id)}
                >
                  Remove
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-background/90 backdrop-blur p-2 rounded-lg">
                <Switch
                  checked={savedItems.get(listing.id)?.notify_on_price_drop || false}
                  onCheckedChange={() => handleTogglePriceDrop(listing.id)}
                  id={`price-drop-${listing.id}`}
                />
                <Label htmlFor={`price-drop-${listing.id}`} className="text-xs cursor-pointer">
                  Notify on price drop
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
