'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { MapPin, Eye, Calendar, MessageCircle, ArrowLeft, ShoppingCart, Share2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ListingDetailContentProps {
  listingId: string
}

export default function ListingDetailContent({ listingId }: ListingDetailContentProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()
  const [listing, setListing] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [showCartNotification, setShowCartNotification] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [listingId])

  const fetchListing = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .single()

      if (error) throw error

      if (data) {
        setListing(data)
        
        // Increment view count using database function with user tracking
        const userId = user?.id || null
        let ipAddress = null
        try {
          const response = await fetch('https://api.ipify.org?format=json')
          const data = await response.json()
          ipAddress = data.ip
        } catch (error) {
          // Failed to fetch IP address
        }
        
        try {
          const { data, error: viewError } = await supabase.rpc('increment_listing_views', { 
            p_listing_id: listingId,
            p_user_id: userId,
            p_ip_address: ipAddress
          })
          if (viewError) {
            console.error('Error incrementing views:', viewError.message, viewError)
          } else {
            // Refresh listing data to get updated view count
            const { data: updatedListing } = await supabase
              .from('listings')
              .select('views')
              .eq('id', listingId)
              .single()
            if (updatedListing) {
              setListing(prev => ({ ...prev, views: updatedListing.views }))
            }
          }
        } catch (error: any) {
          console.error('Error incrementing views:', error?.message || error)
          // Don't block the page load if view increment fails
        }

        // Track recently viewed (only for logged-in users)
        if (userId) {
          try {
            await supabase.from('recently_viewed').insert({
              user_id: userId,
              listing_id: listingId,
              ip_address: ipAddress
            })
          } catch (error) {
            // Ignore errors (e.g., duplicate entries)
          }
        }

        // Fetch seller profile
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.seller_id)
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

  const handleMessageSeller = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    // Prevent seller from messaging themselves
    if (user.id === seller?.id) {
      alert('You cannot message yourself')
      return
    }
    
    // Send automatic message with product info
    const messageContent = `Is this still available?\n\nProduct: ${listing.title}\nPrice: ₱${listing.price.toLocaleString()}\n\nView product: ${window.location.href}`
    
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: seller?.id,
        content: messageContent,
        listing_id: listing.id,
      })
      
      // Navigate to messages page
      router.push('/user/messages')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleBuy = () => {
    if (!user) {
      router.push('/login')
      return
    }
    // Prevent seller from buying their own product
    if (user.id === seller?.id) {
      alert('You cannot buy your own product')
      return
    }
    // Navigate to checkout page with listing ID
    router.push(`/checkout?listing=${listing.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading listing...</p>
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

  const images = listing.images || []
  const currentImage = images[currentImageIndex] || '/placeholder.svg'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Added to cart!</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300 rounded-full hover:scale-105 active:scale-95" 
          size="sm" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={currentImage}
                alt={listing.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className={`h-10 w-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-300 ${isSaved ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  onClick={() => {
                    if (user?.id === seller?.id) {
                      alert('You cannot add your own product to cart')
                      return
                    }
                    setIsSaved(!isSaved)
                    if (!isSaved) {
                      setShowCartNotification(true)
                      setTimeout(() => setShowCartNotification(false), 3000)
                    }
                  }}
                >
                  <ShoppingCart className={`h-5 w-5 ${isSaved ? 'text-white' : ''}`} />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-300"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                      currentImageIndex === index ? 'border-purple-500 shadow-lg shadow-purple-500/30' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <Card className="border-2 border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">{listing.title}</CardTitle>
                    <CardDescription className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mt-2">
                      ₱{listing.price.toLocaleString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
                    listing.condition === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    listing.condition === 'like_new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    listing.condition === 'good' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {listing.condition.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-4">
                  <h3 className="font-bold mb-3 text-base text-gray-900 dark:text-gray-100">Description</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                    {listing.description}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4">
                  <MapPin className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">{listing.location}</span>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{listing.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">{new Date(listing.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="font-bold mb-4 text-base text-gray-900 dark:text-gray-100">Seller Information</h3>
                  <div className="flex items-center gap-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-4">
                    <Link href={`/profile/${seller?.id}`}>
                      <Avatar className="h-14 w-14 cursor-pointer hover:ring-4 hover:ring-purple-500/50 transition-all duration-300">
                        <AvatarImage src={seller?.avatar_url} alt={seller?.full_name} />
                        <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                          {seller?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${seller?.id}`}>
                        <p className="font-bold text-base hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer transition-colors">{seller?.full_name || 'Unknown'}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {seller?.is_verified_seller ? '✓ Verified Seller' : 'Seller'}
                      </p>
                    </div>
                    {user?.id !== seller?.id && (
                      <Button
                        onClick={handleBuy}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 rounded-full px-6"
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {user?.id !== seller?.id && (
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 rounded-full"
                      onClick={handleMessageSeller}
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Message Seller
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSaved(!isSaved)
                      if (!isSaved) {
                        setShowCartNotification(true)
                        setTimeout(() => setShowCartNotification(false), 3000)
                      }
                    }}
                    className={`border-2 transition-all duration-300 hover:scale-105 rounded-full px-6 ${isSaved ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'border-purple-500 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30'}`}
                  >
                    <ShoppingCart className={`mr-2 h-5 w-5`} />
                    {isSaved ? 'Added to Cart' : 'Add to Cart'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-yellow-800 dark:text-yellow-200">Safety Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-900 dark:text-yellow-100 space-y-2">
                <p className="flex items-center gap-2">• Meet in a safe, public place</p>
                <p className="flex items-center gap-2">• Inspect the item before paying</p>
                <p className="flex items-center gap-2">• Use cash or secure payment methods</p>
                <p className="flex items-center gap-2">• Trust your instincts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
