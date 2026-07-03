'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/store/auth'
import { ordersService, reviewsService, notificationsService } from '@/services'
import { toast } from '@/hooks/use-toast'
import { Star, ArrowLeft, Package, User, CheckCircle, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (user && orderId) {
      fetchOrder()
    }
  }, [user, orderId])

  const fetchOrder = async () => {
    if (!user || !orderId) return
    setLoading(true)
    try {
      const data = await ordersService.getOrderById(orderId)
      if (data && data.buyer_id === user.id) {
        setOrder(data)

        // Check if user has already reviewed this listing
        const reviewData = await reviewsService.getReviewByListingAndReviewer(data.listing_id, user.id)
        setExistingReview(reviewData)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/user/transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !order) return

    if (rating === 0) {
      toast({ title: 'Error', description: 'Please select a star rating', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await reviewsService.createReview({
        listing_id: order.listing_id,
        reviewer_id: user.id,
        reviewee_id: order.seller_id,
        rating: rating,
        comment: comment.trim() || 'Great buyer experience!',
      })

      // Create notification for the seller
      try {
        await notificationsService.createNotification({
          user_id: order.seller_id,
          type: 'review',
          title: 'New Review Received',
          content: `You received a ${rating}-star review for "${order.listings?.title}".`,
          link: '/user/reviews',
          is_read: false,
        })
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
        // Don't throw error - review was submitted successfully
      }

      router.push('/user/transactions')
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingFeedback = (val: number) => {
    switch (val) {
      case 1: return { text: "Terrible", color: "text-red-500" }
      case 2: return { text: "Poor", color: "text-orange-500" }
      case 3: return { text: "Fair", color: "text-yellow-600 dark:text-yellow-500" }
      case 4: return { text: "Good", color: "text-blue-500" }
      case 5: return { text: "Amazing!", color: "text-emerald-500" }
      default: return { text: "Select your rating", color: "text-slate-400" }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <Package className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Order Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            We couldn't locate the transaction details for this order.
          </p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
            <Link href="/user/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (existingReview) {
    const stars = Array.from({ length: 5 }, (_, i) => i + 1)
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2">Review Submitted</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            You already left a review for this product on {new Date(existingReview.created_at).toLocaleDateString()}.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-8 text-left">
            <div className="flex gap-1 mb-2">
              {stars.map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= existingReview.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-200 dark:text-slate-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 italic">
              "{existingReview.comment}"
            </p>
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg">
            <Link href="/user/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    )
  }

  const activeFeedback = getRatingFeedback(hoverRating || rating)

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-900/40 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" asChild className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <Link href="/user/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="text-right">
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Delivered
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header Description */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Share Your Experience</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Your honest feedback helps the seller improve and guides other buyers in the community.
            </p>
          </div>

          {/* Product details card */}
          <Card className="overflow-hidden border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                {order.listings?.images?.[0] ? (
                  <img
                    src={order.listings.images[0]}
                    alt={order.listings.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{order.listings?.title}</h3>
                <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  ₱{order.total_amount?.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">Seller: {order.seller?.full_name || 'Seller'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating and review inputs card */}
          <Card className="border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl shadow-md p-6 sm:p-8 space-y-8">
            {/* Interactive Stars Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4 border-b border-slate-100 dark:border-slate-900">
              <Label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overall Rating
              </Label>
              
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform duration-100 hover:scale-125"
                  >
                    <Star
                      className={`h-9 w-9 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400 filter drop-shadow-[0_2px_8px_rgba(250,204,21,0.35)]'
                          : 'text-slate-200 dark:text-slate-800'
                      } transition-colors duration-150`}
                    />
                  </button>
                ))}
              </div>

              <div className="h-5">
                <span className={`text-sm font-extrabold transition-all duration-300 ${activeFeedback.color}`}>
                  {activeFeedback.text}
                </span>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Write Your Comment
                </Label>
                <span className="text-[10px] font-semibold text-slate-400">
                  Optional
                </span>
              </div>
              <textarea
                placeholder="What did you like or dislike about the product? Mention description accuracy, seller communication, or delivery..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent text-sm font-medium transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/user/transactions')} 
                className="flex-1 rounded-xl h-12 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
