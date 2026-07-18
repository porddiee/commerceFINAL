'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useCartStore } from '@/lib/store/auth'
import { listingsService, savedListingsService, profilesService, reviewsService } from '@/services'
import { 
  MapPin, 
  Eye, 
  Calendar, 
  MessageCircle, 
  ArrowLeft, 
  ShoppingCart, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ListingDetailContentProps {
  listingId: string
}

export default function ListingDetailContent({ listingId }: ListingDetailContentProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { incrementCart, decrementCart } = useCartStore()
  const supabase = createClient()
  const [listing, setListing] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [showErrorNotification, setShowErrorNotification] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchListing()
    fetchReviews()
    if (user) {
      checkIfSaved()
    }
  }, [listingId, user])

  const checkIfSaved = async () => {
    if (!user) return
    try {
      const isSaved = await savedListingsService.isListingSaved(user.id, listingId)
      setIsSaved(isSaved)
    } catch (error) {
      setIsSaved(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const reviewsData = await reviewsService.getReviewsByListingWithDetails(listingId)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setReviews([])
    }
  }

  const toggleSaveListing = async () => {
    if (!user) {
      setErrorMessage('Please log in to add to cart')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    if (user.id === seller?.id) {
      setErrorMessage('You cannot add your own product to cart')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    try {
      const { saved } = await savedListingsService.toggleSavedListing(user.id, listingId)
      setIsSaved(saved)
      if (saved) {
        incrementCart()
        setShowCartNotification(true)
        setTimeout(() => setShowCartNotification(false), 3000)
      } else {
        decrementCart()
      }
    } catch (error) {
      console.error('Error toggling saved listing:', error)
      setErrorMessage(isSaved ? 'Failed to remove from cart' : 'Failed to add to cart')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
    }
  }

  const fetchListing = async () => {
    setLoading(true)
    try {
      const listing = await listingsService.getListingById(listingId)
      if (!listing) {
        // Listing not found - handle gracefully (sold, deactivated, or deleted)
        setListing(null)
        setSeller(null)
        return
      }
      setListing(listing)

      // Fetch seller profile
      const seller = await profilesService.getProfileById(listing.seller_id)
      setSeller(seller)

      // Increment view count (don't throw error if this fails)
      try {
        await listingsService.incrementViews(listingId)
      } catch (viewError) {
        // Silently ignore view increment errors
      }
    } catch (error) {
      // Handle any other errors gracefully
      setListing(null)
      setSeller(null)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!user) {
      setErrorMessage('Please log in to purchase')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    if (user.id === seller?.id) {
      setErrorMessage('You cannot purchase your own product')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    router.push(`/checkout?listing=${listingId}`)
  }

  const handleMessageSeller = async () => {
    if (!user) {
      setErrorMessage('Please log in to send message')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    if (user.id === seller?.id) {
      setErrorMessage('You cannot message yourself')
      setShowErrorNotification(true)
      setTimeout(() => setShowErrorNotification(false), 3000)
      return
    }

    router.push(`/user/messages?seller=${seller?.id}&listing=${listingId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-650 animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Catalog Details...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Info className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
          <p className="text-xs font-semibold text-slate-500 mt-2">
            This item is no longer available or was deactivated by the seller.
          </p>
          <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6">
            <Link href="/browse">Browse Products</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const images = listing.images || []
  const currentImage = images[currentImageIndex] || '/placeholder.svg'

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 py-8">
      {/* Toast Notifications */}
      {showCartNotification && (
        <div className="fixed top-25 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-100" />
            <span>Successfully added to cart!</span>
          </div>
        </div>
      )}
      
      {showErrorNotification && (
        <div className="fixed top-25 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-100" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back navigation */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all duration-200 font-bold text-xs" 
          size="sm" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4 text-slate-400" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Image Gallery (5 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[4/3] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-md group">
              <Image
                src={currentImage}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-[1.01] transition-transform duration-500"
                priority
              />
              {/* Image control badges */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  className={`h-10 w-10 rounded-full border border-slate-200/50 backdrop-blur-md shadow-md transition-all hover:scale-105 active:scale-95 ${
                    isSaved 
                      ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                      : 'bg-white/90 dark:bg-slate-950/90 text-slate-800 dark:text-slate-100'
                  }`}
                  onClick={toggleSaveListing}
                  title={isSaved ? "Remove from Cart" : "Add to Cart"}
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-white/90 dark:bg-slate-950/90 border border-slate-200/50 backdrop-blur-md shadow-md transition-all hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-100"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setErrorMessage('Product link copied to clipboard!')
                    setShowErrorNotification(true)
                    setTimeout(() => setShowErrorNotification(false), 2000)
                  }}
                  title="Copy Product Link"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>
            
            {/* Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((image: string, index: number) => (
                  <button
                    key={`gallery-thumb-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      currentImageIndex === index 
                        ? 'border-indigo-500 shadow-md shadow-indigo-500/20' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details & Actions (6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-slate-200 dark:border-slate-850 rounded-3xl shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-900 pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        listing.condition === 'new' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                        listing.condition === 'like_new' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                        listing.condition === 'good' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' :
                        'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                      }`}>
                        {listing.condition.replace('_', ' ')}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {listing.title}
                    </h1>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                      ₱{listing.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Description</h3>
                  <div className="bg-slate-50/50 dark:bg-slate-900/20 border p-4 rounded-2xl">
                    <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-semibold">
                      {listing.description}
                    </p>
                  </div>
                </div>

                 {/* Meetup Coordinates & Metadata */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 border p-3 rounded-2xl bg-slate-50/10 border-slate-200 dark:border-slate-850">
                     <MapPin className="h-5 w-5 text-indigo-500 shrink-0" />
                     <div className="min-w-0">
                       <p className="text-[9px] uppercase font-bold text-slate-400">Meetup Location</p>
                       <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{listing.location}</p>
                     </div>
                   </div>

                   <div className="flex items-center gap-3 border p-3 rounded-2xl bg-slate-50/10 border-slate-200 dark:border-slate-850">
                     <Calendar className="h-5 w-5 text-indigo-500 shrink-0" />
                     <div className="min-w-0">
                       <p className="text-[9px] uppercase font-bold text-slate-400">Listed Date</p>
                       <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                         {new Date(listing.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                       </p>
                     </div>
                   </div>

                   {/* Quantity Available */}
                   <div className="flex items-center gap-3 border p-3 rounded-2xl bg-slate-50/10 border-slate-200 dark:border-slate-850">
                     <ShoppingCart className="h-5 w-5 text-indigo-500 shrink-0" />
                     <div className="min-w-0">
                       <p className="text-[9px] uppercase font-bold text-slate-400">Quantity Available</p>
                       <p className={`text-xs font-bold ${listing.quantity === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                         {listing.quantity === 0 ? 'Sold Out' : `${listing.quantity} item${listing.quantity > 1 ? 's' : ''} available`}
                       </p>
                     </div>
                   </div>
                 </div>

                {/* View counter metadata */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views || 0} total product views</span>
                </div>

                {/* Seller Profile Widget */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-5 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seller details</h3>
                  <div className="flex items-center gap-4 bg-slate-50/30 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4">
                    <Link href={`/profile/${seller?.id}`}>
                      <Avatar className="h-12 w-12 hover:ring-2 hover:ring-indigo-500/20 transition-all">
                        <AvatarImage src={seller?.avatar_url} alt={seller?.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold">
                          {seller?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${seller?.id}`}>
                        <p className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 transition-colors truncate">{seller?.full_name || 'Anonymous Seller'}</p>
                      </Link>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                        {seller?.is_verified_seller ? 'Verified Seller ID' : 'Basic Member'}
                      </p>
                    </div>
                    {user?.id !== seller?.id && (
                      <Button
                        onClick={handleBuy}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9 px-4 shrink-0 transition-transform hover:-translate-y-0.5 shadow-md shadow-indigo-500/10"
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Primary CTA Action Row */}
                {user?.id !== seller?.id && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={handleMessageSeller}
                      className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message Seller
                    </Button>
                    
                    <Button
                      onClick={toggleSaveListing}
                      variant="outline"
                      className={`h-11 px-6 rounded-xl font-bold border-2 transition-all hover:scale-[1.01] ${
                        isSaved 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
                          : 'border-indigo-500 text-indigo-650 hover:bg-indigo-50/50'
                      }`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {isSaved ? 'Remove from Cart' : 'Add to Cart'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Tips Alerts */}
            <Card className="bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/15 dark:to-orange-950/5 border border-amber-200/50 dark:border-amber-900/40 rounded-3xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  SuriMart Safe Meetup Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-amber-900/90 dark:text-amber-400/90 font-semibold space-y-2 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="text-amber-550 shrink-0 font-bold">✓</span>
                  <span><strong>Safe Location</strong>: Coordinate transactions in busy, well-lit public squares (e.g. Surigao City Plaza, Mall lobbies).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-550 shrink-0 font-bold">✓</span>
                  <span><strong>Physical Inspection</strong>: Always verify quality and test electronic details before handing over payment.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-550 shrink-0 font-bold">✓</span>
                  <span><strong>Cash or Secure COD</strong>: Avoid sending money beforehand. Settle transactions securely in person.</span>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border border-slate-200 dark:border-slate-850 rounded-3xl shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-900 pb-5">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Star className="h-4.5 w-4.5 text-indigo-500" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm font-semibold">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 dark:border-slate-900 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewer?.avatar_url} alt={review.reviewer?.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-xs">
                            {review.reviewer?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {review.reviewer?.full_name || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">
                            {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {review.comment}
                          </p>
                          {review.reply && (
                            <div className="mt-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                              <p className="text-xs font-bold text-slate-500 mb-1">Seller Reply:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{review.reply}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
